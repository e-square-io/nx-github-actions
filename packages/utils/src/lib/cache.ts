import { ReserveCacheError, restoreCache, saveCache } from '@actions/cache';
import { debug, warning } from '@actions/core';

export const NX_CACHE_PATH = 'node_modules/.cache/nx';

export function getCacheKeys(
  target: string,
  bucket: number
): [primary: string, restoreKeys: string[]] {
  const keyParts = [];
  keyParts.push(`${process.platform}-${process.arch}`);
  debug(`🐞 key so far: ${keyParts.join('-')}`);

  // setting cache limit to 1 month
  const now = new Date();
  keyParts.push(now.getFullYear().toString(), (now.getMonth() + 1).toString());
  debug(`🐞 key so far: ${keyParts.join('-')}`);

  // setting target and bucket
  keyParts.push(target, bucket);
  debug(`🐞 key so far: ${keyParts.join('-')}`);

  const restoreKeys = [
    keyParts.slice(0, -1).join('-'),
    keyParts.slice(0, -2).join('-'),
  ];

  return [keyParts.join('-'), restoreKeys];
}

export async function restoreNxCache(
  primaryKey: string,
  restoreKeys: string[]
): Promise<string> {
  debug(`🐞 Restoring NX cache from ${primaryKey}`);

  return restoreCache([NX_CACHE_PATH], primaryKey, restoreKeys);
}

export async function saveNxCache(primaryKey: string): Promise<number> {
  debug(`🐞 Saving NX cache to ${primaryKey}`);

  return saveCache([NX_CACHE_PATH], primaryKey).catch((err) => {
    // don't throw an error if cache already exists, which may happen due to
    // race conditions
    if (err instanceof ReserveCacheError) {
      warning(err);
      return -1;
    }
    // otherwise re-throw
    throw err;
  });
}
