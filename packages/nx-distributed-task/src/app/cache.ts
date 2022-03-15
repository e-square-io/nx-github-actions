import { context as Context } from '@actions/github';

import { debug, group } from '@e-square/utils/logger';
import { restoreNxCache, saveNxCache } from '@e-square/utils/cache';

import type { Task } from '@e-square/utils/task';
import type { TaskGraph } from '@nrwl/tao/src/shared/tasks';

export function restoreCache(context: typeof Context, tasks: Task[], taskGraph: TaskGraph): Promise<void> {
  const seenDeps = new Set<string>();

  const restoreTaskCache = async (task: Task) => {
    const deps = taskGraph.dependencies[task.id];
    const key = await restoreNxCache(context, task);

    if (key || !deps?.length) return;

    while (deps.length > 0) {
      const nextDepTask = taskGraph.tasks[deps.shift()];
      if (seenDeps.has(nextDepTask.id)) continue;
      seenDeps.add(nextDepTask.id);

      debug(`Couldn't restore the cache of ${task.id}, will try to restore its deps. next dep is ${nextDepTask.id}`);
      await restoreTaskCache(nextDepTask);
    }
  };

  return group('🚀 Retrieving NX cache', async () => {
    for (const task of tasks) {
      await restoreTaskCache(task);
    }
  });
}

export function saveCache(context: typeof Context, tasks: Task[], taskGraph: TaskGraph): Promise<void> {
  return group('🚀 Saving NX cache', () => Promise.all(tasks.map((task) => saveNxCache(context, task))).then());
}
