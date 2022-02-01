import { ReserveCacheError, restoreCache, saveCache } from '@actions/cache';
import { getState, saveState } from '@actions/core';
import { context } from '@actions/github';
import { hashFiles } from '@actions/glob';

import { tree } from './fs';
import { logger } from './logger';

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

async function getCacheKeys(target: string, distribution: number): Promise<[primary: string, restoreKeys: string[]]> {
  const keyParts = [];
  const restoreKeys = [];

  const addRestoreKey = () => restoreKeys.unshift(keyParts.join('-'));
  keyParts.push(`${process.env.RUNNER_OS}-${process.env.RUNNER_ARCH}`);

  const lockFile = tree.getLockFilePath();
  if (lockFile) {
    keyParts.push(await hashFiles(lockFile));
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

  logger.debug(`primary key is: ${keyParts.join('-')}`);
  logger.debug(`restore keys are: ${restoreKeys.join(' | ')}`);

  return [keyParts.join('-'), restoreKeys];
}

export async function restoreNxCache(target: string, distribution: number): Promise<void> {
  if (logger.debugMode) {
    logger.debug(`Debug mode is on, skipping restoring cache`);
    return;
  }

  const [primaryKey, restoreKeys] = await getCacheKeys(target, distribution);

  saveState(PRIMARY_KEY, primaryKey);
  logger.debug(`Restoring NX cache for ${primaryKey}`);

  try {
    const key = await restoreCache([tree.resolve(NX_CACHE_PATH)], primaryKey, restoreKeys);

    if (key) {
      logger.success(`Cache hit: ${key}`);

      saveState(CACHE_KEY, key);
    } else {
      logger.info(`Cache miss`);
    }
  } catch (e) {
    logger.warning(e);
  }
}

export async function saveNxCache(): Promise<void> {
  if (logger.debugMode) {
    logger.debug(`Debug mode is on, skipping saving cache`);
    return;
  }

  const cacheKey = getState(CACHE_KEY);
  const primaryKey = getState(PRIMARY_KEY);

  if (!primaryKey) {
    logger.info(`Couldn't find the primary key, skipping saving cache`);
    return;
  }

  if (isExactKeyMatch(primaryKey, cacheKey)) {
    logger.info(`Cache hit occurred on the primary key ${cacheKey}, not saving cache.`);
    return;
  }

  logger.debug(`Saving NX cache to ${primaryKey}`);

  try {
    await saveCache([tree.resolve(NX_CACHE_PATH)], primaryKey);

    logger.success(`Successfully saved cache to ${primaryKey}`);
  } catch (err) {
    // don't throw an error if cache already exists, which may happen due to concurrency
    if (err instanceof ReserveCacheError) {
      logger.warning(err);
      return;
    }
    // otherwise re-throw
    throw err;
  }
}
