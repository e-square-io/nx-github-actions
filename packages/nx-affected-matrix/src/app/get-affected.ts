import { createProjectGraphAsync } from '@nrwl/workspace/src/core/project-graph/project-graph';
import { readNxJson } from '@nrwl/devkit/src/generators/project-configuration';

import { mapToProjectName, projectsToRun } from '@e-square/utils/project-graph';
import { createTaskGraph } from '@e-square/utils/task-graph';
import { Workspaces } from '@e-square/utils/workspace';
import { tree } from '@e-square/utils/fs';

import type { ProjectGraph, TaskGraph } from '@nrwl/devkit';
import type { NxArgs } from '@nrwl/workspace/src/command-line/utils';
import type { Task } from '@e-square/utils/task';

export async function getAffected(
  target: string,
  args: NxArgs,
  _require: typeof require
): Promise<{
  tasks: Task[];
  taskGraph: TaskGraph;
  projects: string[];
  apps: string[];
  libs: string[];
  e2e: string[];
  projectGraph: ProjectGraph;
}> {
  args = { ...args, target };
  const apps: string[] = [],
    libs: string[] = [],
    e2e: string[] = [];

  const projectGraph = await createProjectGraphAsync();
  const projectNodes = projectsToRun(args, projectGraph);
  const { tasks, taskGraph } = await createTaskGraph(
    args,
    projectNodes,
    projectGraph,
    readNxJson(tree),
    new Workspaces(_require)
  );

  for (const project of projectNodes) {
    switch (project.type) {
      case 'app':
        apps.push(mapToProjectName(project));
        break;
      case 'lib':
        libs.push(mapToProjectName(project));
        break;
      case 'e2e':
        e2e.push(mapToProjectName(project));
    }
  }

  return {
    tasks,
    taskGraph,
    projects: projectNodes.map(mapToProjectName),
    apps,
    libs,
    e2e,
    projectGraph,
  };
}
