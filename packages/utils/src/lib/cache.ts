import { sep } from 'path';

import { restoreCache, saveCache } from '@actions/cache';

import { debug, info, logger, success, warning } from './logger';

import type { context as Context } from '@actions/github';
import type { Task } from './task';

export const NX_CACHE_PATH = 'node_modules/.cache/nx';

export const getNxCachePaths = (task: Task) => [
  `${NX_CACHE_PATH}/${task.hash}`,
  `${NX_CACHE_PATH}/${task.hash}.commit`,
  ...(task.outputs ?? []).map(
    (path) => `${NX_CACHE_PATH}/latestOutputsHashes/${path.replace(new RegExp(sep, 'g'), '-')}.hash`
  ),
];

export function getCacheKeys(hash: string, context: typeof Context): [primary: string, restoreKeys: string[]] {
  const keyParts: string[] = [];
  const restoreKeys: string[] = [];
  const addRestoreKey = () => restoreKeys.unshift(keyParts.join('-'));

  keyParts.push(`nx-cache-${hash}`);

  if (context.eventName === 'pull_request' && context?.payload?.pull_request?.number !== undefined) {
    addRestoreKey();
    keyParts.push(context.payload.pull_request.number.toString());
  }

  debug(`primary key is: ${keyParts.join('-')}`);
  debug(`restore keys are: ${restoreKeys.join(' | ')}`);

  return [keyParts.join('-'), restoreKeys];
}

export async function restoreNxCache(context: typeof Context, task: Task): Promise<string | void> {
  if (logger().debugMode) {
    debug(`Debug mode is on, skipping restoring cache`);
    return;
  }

  if (!task.hash) {
    debug(`Hash is missing for task '${task.id}'`);
    return;
  }

  const [primaryKey, restoreKeys] = getCacheKeys(task.hash, context);
  debug(`Restoring NX cache for ${primaryKey}`);

  try {
    const key = await restoreCache(getNxCachePaths(task), primaryKey, restoreKeys);

    if (key) {
      success(`Cache hit: ${key}`);
      task.cacheKey = key;
    } else {
      info(`Cache miss`);
    }
  } catch (e) {
    warning(e as string);
  }

  return task.cacheKey;
}

export async function saveNxCache(context: typeof Context, task: Task): Promise<void> {
  if (logger().debugMode) {
    debug(`Debug mode is on, skipping saving cache`);
    return;
  }

  if (!task.hash) {
    debug(`Hash is missing for task '${task.id}'`);
    return;
  }

  const [primaryKey] = getCacheKeys(task.hash, context);

  if (isExactKeyMatch(primaryKey, task.cacheKey)) {
    info(`Cache hit occurred on the primary key ${task.cacheKey}, not saving cache.`);
    return;
  }

  debug(`Saving NX cache to ${primaryKey}`);

  try {
    await saveCache(getNxCachePaths(task), primaryKey);

    success(`Successfully saved cache to ${primaryKey}`);
  } catch (err) {
      warning(err as string);
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
