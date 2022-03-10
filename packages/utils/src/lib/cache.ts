import { ReserveCacheError, restoreCache, saveCache } from '@actions/cache';

import { debug, info, logger, success, warning } from './logger';

import type { context as Context } from '@actions/github';
import type { Hash } from '@nrwl/workspace/src/core/hasher/hasher';

export const NX_CACHE_PATH = 'node_modules/.cache/nx';

export const getNxCachePaths = (hash: string) => [`${NX_CACHE_PATH}/${hash}` /*, `${NX_CACHE_PATH}/${hash}*`*/];

export function getCacheKeys(hash: string, context: typeof Context): [primary: string, restoreKeys: string[]] {
  const keyParts = [];
  const restoreKeys = [];
  const addRestoreKey = () => restoreKeys.unshift(keyParts.join('-'));

  keyParts.push(`nx-cache-${hash}`);

  if (context.eventName === 'pull_request') {
    addRestoreKey();
    keyParts.push(context.payload.pull_request.number.toString());
  }

  debug(`primary key is: ${keyParts.join('-')}`);
  debug(`restore keys are: ${restoreKeys.join(' | ')}`);

  return [keyParts.join('-'), restoreKeys];
}

export async function restoreNxCache(context: typeof Context, hash: Hash & { cacheKey?: string }): Promise<void> {
  if (logger().debugMode) {
    debug(`Debug mode is on, skipping restoring cache`);
    return;
  }

  const [primaryKey, restoreKeys] = getCacheKeys(hash.value, context);
  debug(`Restoring NX cache for ${primaryKey}`);

  try {
    const key = await restoreCache(getNxCachePaths(hash.value), primaryKey, restoreKeys);

    if (key) {
      success(`Cache hit: ${key}`);
      hash.cacheKey = key;
    } else {
      info(`Cache miss`);
    }
  } catch (e) {
    warning(e);
  }
}

export async function saveNxCache(context: typeof Context, hash: Hash & { cacheKey?: string }): Promise<void> {
  if (logger().debugMode) {
    debug(`Debug mode is on, skipping saving cache`);
    return;
  }

  const [primaryKey] = getCacheKeys(hash.value, context);

  if (!primaryKey) {
    info(`Couldn't find the primary key, skipping saving cache`);
    return;
  }

  if (isExactKeyMatch(primaryKey, hash.cacheKey)) {
    info(`Cache hit occurred on the primary key ${hash.cacheKey}, not saving cache.`);
    return;
  }

  debug(`Saving NX cache to ${primaryKey}`);

  try {
    await saveCache(getNxCachePaths(hash.value), primaryKey);

    success(`Successfully saved cache to ${primaryKey}`);
  } catch (err) {
    // don't throw an error if cache already exists, which may happen due to concurrency
    if (err instanceof ReserveCacheError) {
      warning(err);
      return;
    }
    // otherwise re-throw
    throw err;
  }
}

function isExactKeyMatch(key: string, cacheKey?: string): boolean {
  return !!(
    cacheKey &&
    key &&
    cacheKey.localeCompare(key, undefined, {
      sensitivity: 'accent',
    }) === 0
  );
}
