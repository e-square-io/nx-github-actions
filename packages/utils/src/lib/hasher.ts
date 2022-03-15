import { Hasher } from '@nrwl/workspace/src/core/hasher/hasher';

import { warning } from './logger';
import { getExecutorForTask } from './workspace';

import type { ProjectGraph, NxJsonConfiguration, TaskGraph } from '@nrwl/devkit';
import type { Task } from './task';
import type { Workspaces } from './workspace';

export function getCustomHasher(task: Task, workspace: Workspaces) {
  try {
    const factory = getExecutorForTask(task, workspace).hasherFactory;
    return factory ? factory() : null;
  } catch (e) {
    throw new Error(`Unable to load hasher for task "${task.id}"`);
  }
}

export function createHasher(graph: ProjectGraph, nxJson: NxJsonConfiguration): Hasher {
  const { options } = nxJson?.tasksRunnerOptions?.['default'] ?? { options: {} };
  return new Hasher(graph, nxJson, options);
}

export async function hashTask(
  task: Task,
  projectGraph: ProjectGraph,
  taskGraph: TaskGraph,
  defaultHasher: Hasher,
  workspace: Workspaces
): Promise<void> {
  let customHasher = null;
  try {
    customHasher = getCustomHasher(task, workspace);
  } catch (e) {
    const unableToFindError = `Unable to load hasher for task ${task.id}`;
    if ((typeof e === 'string' ? e : (e as Error).message) === unableToFindError) {
      warning(`${unableToFindError}, fallbacks to default hasher`);
    }
  }

  const { value, details } = await (customHasher
    ? customHasher(task, {
        hasher: defaultHasher,
        projectGraph,
        taskGraph,
        workspaceConfig: workspace.readWorkspaceConfiguration(),
      })
    : defaultHasher.hashTaskWithDepsAndContext(task));

  task.hash = value;
  task.hashDetails = details;
}
