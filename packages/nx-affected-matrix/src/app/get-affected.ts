import { createProjectGraphAsync, readNxJson } from '@nrwl/devkit';

import { mapToProjectName, projectsToRun } from '@e-square/utils/project-graph';
import { createTaskGraph } from '@e-square/utils/task-graph';
import { Workspaces } from '@e-square/utils/workspace';

import type { ProjectGraph, TaskGraph } from '@nrwl/devkit';
import type { NxArgs } from 'nx/src/utils/command-line-utils';
import type { Task } from '@e-square/utils/task';
import { tree } from '@e-square/utils/fs';
import { join } from 'path';

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
  projectGraph: ProjectGraph;
}> {
  args = { ...args, target };
  const apps: string[] = [],
    libs: string[] = [];

  const projectGraph = await createProjectGraphAsync();
  const projectNodes = projectsToRun(args, projectGraph);
  const nxJsonPath = join(tree.root, 'nx.json');
  const { tasks, taskGraph } = await createTaskGraph(
    args,
    projectNodes,
    projectGraph,
    readNxJson(nxJsonPath),
    new Workspaces(_require)
  );

  for (const project of projectNodes) {
    switch (project.type) {
      case 'e2e':
      case 'app':
        apps.push(mapToProjectName(project));
        break;
      case 'lib':
        libs.push(mapToProjectName(project));
        break;
    }
  }

  return {
    tasks,
    taskGraph,
    projects: projectNodes.map(mapToProjectName),
    apps,
    libs,
    projectGraph,
  };
}
