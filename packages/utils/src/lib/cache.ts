import { ReserveCacheError, restoreCache, saveCache } from '@actions/cache';
import { context } from '@actions/github';
import { hashFiles } from '@actions/glob';

import { tree } from './fs';
import { logger } from './logger';

export const NX_CACHE_PATH = 'node_modules/.cache/nx';
export const CACHE_KEY = 'cacheKey';

export async function getCacheKeys(
  target: string,
  distribution: number
): Promise<[primary: string, restoreKeys: string[]]> {
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

export async function restoreNxCache(primaryKey: string, restoreKeys: string[]): Promise<void> {
  logger.debug(`Restoring NX cache from ${primaryKey}`);

  if (logger.debugMode) {
    logger.debug(`Debug mode is on, skipping restoring cache`);
    return;
  }
  try {
    const key = await restoreCache([NX_CACHE_PATH], primaryKey, restoreKeys);

    if (key) {
      logger.success(`Cache hit: ${key}`);
    } else {
      logger.info(`Cache miss`);
    }
  } catch (e) {
    logger.warning(e);
  }
}

export async function saveNxCache(primaryKey: string): Promise<void> {
  logger.debug(`Saving NX cache to ${primaryKey}`);

  if (logger.debugMode) {
    logger.debug(`Debug mode is on, skipping saving cache`);
    return;
  }

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
