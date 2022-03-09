import { ReserveCacheError, restoreCache, saveCache } from '@actions/cache';
import type { context as Context } from '@actions/github';

import { tree } from './fs';
import { debug, info, logger, success, warning } from './logger';

export const NX_CACHE_PATH = 'node_modules/.cache/nx';

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

export async function restoreNxCache(context: typeof Context, hash: string): Promise<void> {
  if (logger().debugMode) {
    debug(`Debug mode is on, skipping restoring cache`);
    return;
  }

  const [primaryKey, restoreKeys] = getCacheKeys(hash, context);
  debug(`Restoring NX cache for ${primaryKey}`);

  try {
    const key = await restoreCache([tree.resolve(`${NX_CACHE_PATH}/${hash}`)], primaryKey, restoreKeys);

    if (key) {
      success(`Cache hit: ${key}`);
    } else {
      info(`Cache miss`);
    }
  } catch (e) {
    warning(e);
  }
}

export async function saveNxCache(context: typeof Context, hash: string): Promise<void> {
  if (logger().debugMode) {
    debug(`Debug mode is on, skipping saving cache`);
    return;
  }

  const [primaryKey, cacheKey] = getCacheKeys(hash, context);

  if (!primaryKey) {
    info(`Couldn't find the primary key, skipping saving cache`);
    return;
  }

  debug(`Saving NX cache to ${primaryKey}`);

  try {
    await saveCache([tree.resolve(`${NX_CACHE_PATH}/${hash}`)], primaryKey);

    success(`Successfully saved cache to ${primaryKey}`);
  } catch (err) {
    // don't throw an error if cache already exists, which may happen due to concurrency
    if (err instanceof ReserveCacheError) {
      info(`Cache hit occurred on the primary key ${cacheKey}, not saving cache.`);
      return;
    }
    // otherwise re-throw
    throw err;
  }
}
