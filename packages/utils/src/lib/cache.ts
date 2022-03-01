import { ReserveCacheError, restoreCache, saveCache } from '@actions/cache';
import type * as Core from '@actions/core';
import type * as Glob from '@actions/glob';
import type { context as Context } from '@actions/github';

import { tree } from './fs';
import { debug, info, logger, success, warning } from './logger';

export const NX_CACHE_PATH = 'node_modules/.cache/nx';
export const CACHE_KEY = 'CACHE_KEY';
export const PRIMARY_KEY = 'PRIMARY_KEY';

function isExactKeyMatch(key: string, cacheKey?: string): boolean {
  return !!(
    cacheKey &&
    key &&
    cacheKey.localeCompare(key, undefined, {
      sensitivity: 'accent',
    }) === 0
  );
}

async function getCacheKeys(
  context: typeof Context,
  glob: typeof Glob,
  target: string,
  distribution: number
): Promise<[primary: string, restoreKeys: string[]]> {
  const keyParts = [];
  const restoreKeys = [];

  const addRestoreKey = () => restoreKeys.unshift(keyParts.join('-'));
  keyParts.push(`${process.env.RUNNER_OS}-${process.env.RUNNER_ARCH}`);

  const lockFile = tree.getLockFilePath();
  if (lockFile) {
    keyParts.push(await glob.hashFiles(lockFile));
    addRestoreKey();
  }

  // setting cache limit to 1 month
  const now = new Date();
  keyParts.push(now.getFullYear().toString(), (now.getMonth() + 1).toString());
  addRestoreKey();

  // setting target and distribution
  keyParts.push(`${target}`);

  if (distribution) {
    addRestoreKey();
    keyParts.push(distribution);
  }

  if (context.eventName === 'pull_request') {
    addRestoreKey();
    keyParts.push(context.payload.pull_request.number.toString());
  }

  debug(`primary key is: ${keyParts.join('-')}`);
  debug(`restore keys are: ${restoreKeys.join(' | ')}`);

  return [keyParts.join('-'), restoreKeys];
}

export async function restoreNxCache(
  context: typeof Context,
  glob: typeof Glob,
  core: typeof Core,
  target: string,
  distribution: number
): Promise<void> {
  if (logger().debugMode) {
    debug(`Debug mode is on, skipping restoring cache`);
    return;
  }

  const [primaryKey, restoreKeys] = await getCacheKeys(context, glob, target, distribution);

  core.saveState(PRIMARY_KEY, primaryKey);
  debug(`Restoring NX cache for ${primaryKey}`);

  try {
    const key = await restoreCache([tree.resolve(NX_CACHE_PATH)], primaryKey, restoreKeys);

    if (key) {
      success(`Cache hit: ${key}`);

      core.saveState(CACHE_KEY, key);
    } else {
      info(`Cache miss`);
    }
  } catch (e) {
    warning(e);
  }
}

export async function saveNxCache(core: typeof Core): Promise<void> {
  if (logger().debugMode) {
    debug(`Debug mode is on, skipping saving cache`);
    return;
  }

  const cacheKey = core.getState(CACHE_KEY);
  const primaryKey = core.getState(PRIMARY_KEY);

  if (!primaryKey) {
    info(`Couldn't find the primary key, skipping saving cache`);
    return;
  }

  if (isExactKeyMatch(primaryKey, cacheKey)) {
    info(`Cache hit occurred on the primary key ${cacheKey}, not saving cache.`);
    return;
  }

  debug(`Saving NX cache to ${primaryKey}`);

  try {
    await saveCache([tree.resolve(NX_CACHE_PATH)], primaryKey);

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
