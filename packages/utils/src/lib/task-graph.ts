import { TaskGraphCreator } from 'nx/src/tasks-runner/task-graph-creator';
import { createTasksForProjectToRun } from 'nx/src/tasks-runner/run-command';
import { getOutputs } from 'nx/src/tasks-runner/utils';

import { createHasher, hashTask } from './hasher';
import { Workspaces } from './workspace';

import type { ProjectGraphProjectNode, NxJsonConfiguration, ProjectGraph, TaskGraph } from '@nrwl/devkit';
import type { Task } from './task';
import type { NxArgs } from 'nx/src/utils/command-line-utils';

export async function createTaskGraph(
  { target, configuration, projects }: NxArgs,
  projectNodes: ProjectGraphProjectNode[],
  projectGraph: ProjectGraph,
  nxJson: NxJsonConfiguration,
  workspace: Workspaces
): Promise<{ tasks: Task[]; taskGraph: TaskGraph }> {
  const defaultTargetDependencies = nxJson.targetDependencies ?? {};

  const hasher = createHasher(projectGraph, nxJson);

  const taskGraphCreator = new TaskGraphCreator(projectGraph, defaultTargetDependencies);

  let tasks: Task[] = createTasksForProjectToRun(
    projectNodes,
    { target: target ?? '', configuration: configuration ?? '', overrides: {} },
    projectGraph,
    null
  );

  let taskGraph = taskGraphCreator.createTaskGraph(tasks);

  // enrich tasks
  for (const task of tasks) {
    // add interpolated outputs to tasks
    task.outputs = getOutputs(projectGraph.nodes, task);
    // add hash details to tasks
    await hashTask(task, projectGraph, taskGraph, hasher, workspace);
  }

  // create a fresh TaskGraph with the enriched tasks
  taskGraph = taskGraphCreator.createTaskGraph(tasks);

  if (projects) {
    // keep only specified project's tasks
    tasks = tasks.filter((task) => projects.includes(task.target.project));
  }

  return { tasks, taskGraph };
}
