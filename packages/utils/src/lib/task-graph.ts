import type { NxJsonConfiguration, ProjectGraph, Task, TaskGraph } from '@nrwl/devkit';
import { TaskGraphCreator } from '@nrwl/workspace/src/tasks-runner/task-graph-creator';

export async function createTaskGraph(
  projectGraph: ProjectGraph,
  nxJson: NxJsonConfiguration,
  tasks: Task[]
): Promise<TaskGraph> {
  const defaultTargetDependencies = nxJson.targetDependencies ?? {};

  const taskGraphCreator = new TaskGraphCreator(projectGraph, defaultTargetDependencies);

  return taskGraphCreator.createTaskGraph(tasks);
}
