import { TaskGraphCreator } from '@nrwl/workspace/src/tasks-runner/task-graph-creator';
import { createProjectGraphAsync } from '@nrwl/workspace/src/core/project-graph';
import { readNxJson } from '@nrwl/devkit/src/generators/project-configuration';
import { createTasksForProjectToRun } from '@nrwl/workspace/src/tasks-runner/run-command';

import { tree } from './fs';
import { createHasher, hashTasks } from './hasher';
import { Workspaces } from './workspace';

import type { TaskGraph } from '@nrwl/devkit';
import type { Task } from './task';
import { getOutputs } from '@nrwl/workspace/src/tasks-runner/utils';

export async function createTaskGraph(
  projects: string[],
  target: string,
  configuration: string = undefined,
  _require: typeof require
): Promise<{ tasks: Task[]; graph: TaskGraph }> {
  const projectGraph = await createProjectGraphAsync();
  const nxJson = readNxJson(tree);
  const defaultTargetDependencies = nxJson.targetDependencies ?? {};
  const taskGraphCreator = new TaskGraphCreator(projectGraph, defaultTargetDependencies);

  const workspace = new Workspaces(_require);

  const tasks: Task[] = createTasksForProjectToRun(
    projects.map((p) => projectGraph.nodes[p] ?? null).filter((node) => node !== null),
    { target, configuration, overrides: {} },
    projectGraph,
    null
  );

  // add interpolated outputs to tasks
  for (const task of tasks) {
    task.outputs = getOutputs(projectGraph.nodes, task);
  }

  const hasher = createHasher(projectGraph, nxJson);

  const taskGraph = taskGraphCreator.createTaskGraph(tasks);

  // add hash details to tasks
  await hashTasks(tasks, taskGraph, hasher, workspace);

  // return a fresh TaskGraph with the enriched tasks
  return { tasks, graph: taskGraphCreator.createTaskGraph(tasks) };
}
