import { context } from '@actions/github';
import { ReserveCacheError, restoreCache, saveCache } from '@actions/cache';
import { debug, group, info, warning } from '@actions/core';

export const NX_CACHE_PATH = 'node_modules/.cache/nx';

export function getCacheKeys(target: string, distribution: number): [primary: string, restoreKeys: string[]] {
  const keyParts = [];
  const restoreKeys = [];

  const addRestoreKey = () => restoreKeys.unshift(keyParts.join('-'));

  keyParts.push(`${process.platform}-${process.arch}`);

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

  debug(`🐞 primary key is: ${keyParts.join('-')}`);
  debug(`🐞 restore keys are: ${restoreKeys.join(' | ')}`);

  return [keyParts.join('-'), restoreKeys];
}

export async function restoreNxCache(primaryKey: string, restoreKeys: string[]): Promise<void> {
  debug(`🐞 Restoring NX cache from ${primaryKey}`);

  try {
    const key = await restoreCache([NX_CACHE_PATH], primaryKey, restoreKeys);

    if (key) {
      info(`✅ Cache hit: ${key}`);
    } else {
      info(`❕ Cache miss`);
    }
  } catch (e) {
    warning(e);
  }
}

export async function saveNxCache(primaryKey: string): Promise<void> {
  debug(`🐞 Saving NX cache to ${primaryKey}`);

  try {
    await saveCache([NX_CACHE_PATH], primaryKey);

    info(`✅ Successfully saved cache to ${primaryKey}`);
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

export async function withCache(target: string, distribution: number, cb: () => Promise<unknown>): Promise<void> {
  const [primary, restoreKeys] = getCacheKeys(target, distribution);

  await group('🚀 Retrieving NX cache', () => restoreNxCache(primary, restoreKeys));

  await cb();

  await group('✅ Saving NX cache', () => saveNxCache(primary));
}
