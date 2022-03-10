import { context as Context } from '@actions/github';

import { group } from '@e-square/utils/logger';
import { restoreNxCache, saveNxCache } from '@e-square/utils/cache';
import { Task } from '@e-square/utils/task';

export function restoreCache(context: typeof Context, tasks?: Task[], nxCloud?: boolean): Promise<void> {
  if (nxCloud) return;

  return group('🚀 Retrieving NX cache', () => Promise.all(tasks?.map((task) => restoreNxCache(context, task))).then());
}

export function saveCache(context: typeof Context, tasks?: Task[], nxCloud?: boolean): Promise<void> {
  if (nxCloud) return;

  return group('🚀 Saving NX cache', () => Promise.all(tasks?.map((task) => saveNxCache(context, task))).then());
}
