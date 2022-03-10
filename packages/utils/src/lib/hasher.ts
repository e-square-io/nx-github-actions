import { Hasher } from '@nrwl/workspace/src/core/hasher/hasher';
import { getCustomHasher } from '@nrwl/workspace/src/tasks-runner/utils';

import { warning } from './logger';

import type { ProjectGraph, NxJsonConfiguration, TaskGraph } from '@nrwl/devkit';
import type { Task } from './task';
import type { Workspaces } from './workspace';

export function createHasher(graph: ProjectGraph, nxJson: NxJsonConfiguration): Hasher {
  const { options } = nxJson.tasksRunnerOptions.default ?? { options: {} };
  return new Hasher(graph, nxJson, options);
}

export async function hashTask(
  task: Task,
  taskGraph: TaskGraph,
  defaultHasher: Hasher,
  workspace: Workspaces
): Promise<void> {
  let customHasher = null;
  try {
    customHasher = getCustomHasher(task, workspace);
  } catch (e) {
    const unableToFindError = `Unable to load hasher for task ${task.id}`;
    if ((typeof e === 'string' ? e : e.message) === unableToFindError) {
      warning(`${unableToFindError}, fallbacks to default hasher`);
    }
  }

  const { value, details } = await (customHasher
    ? customHasher(task, taskGraph, defaultHasher)
    : defaultHasher.hashTaskWithDepsAndContext(task));

  task.hash = value;
  task.hashDetails = details;
}

export async function hashTasks(
  tasks: Task[],
  taskGraph: TaskGraph,
  defaultHasher: Hasher,
  workspace: Workspaces
): Promise<void> {
  await Promise.all(tasks.map((task) => hashTask(task, taskGraph, defaultHasher, workspace)));
}
