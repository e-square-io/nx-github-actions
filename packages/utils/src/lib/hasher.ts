import { Hash, Hasher } from '@nrwl/workspace/src/core/hasher/hasher';
import { getCustomHasher } from '@nrwl/workspace/src/tasks-runner/utils';
import { Workspaces } from '@nrwl/tao/src/shared/workspace';
import type { ProjectGraph, NxJsonConfiguration, Task, TaskGraph } from '@nrwl/devkit';

import { tree } from './fs';

export function createHasher(graph: ProjectGraph, nxJson: NxJsonConfiguration): Hasher {
  const { options } = nxJson.tasksRunnerOptions.default ?? { options: {} };
  return new Hasher(graph, nxJson, options);
}

export async function hashTask(task: Task, taskGraph: TaskGraph, defaultHasher: Hasher): Promise<Hash> {
  const customHasher = getCustomHasher(task, new Workspaces(tree.root));
  return await (customHasher
    ? customHasher(task, taskGraph, defaultHasher)
    : defaultHasher.hashTaskWithDepsAndContext(task));
}
