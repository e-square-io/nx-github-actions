import { mapToProjectName, projectsToRun } from '@e-square/utils/project-graph';
import { tree } from '@e-square/utils/fs';

import type { ProjectGraph, TaskGraph } from '@nrwl/devkit';
import type { Task } from '@e-square/utils/task';
import { NxArgs } from 'nx/src/utils/command-line-utils';
import { createProjectGraphAsync } from '@nrwl/devkit';
import { createTaskGraph } from 'nx/src/tasks-runner/create-task-graph';
import { readNxJsonInTree } from '@nrwl/workspace';
import { TargetDefaults, TargetDependencies } from 'nx/src/config/nx-json';

// TODO: daniel - from nx
function mapTargetDefaultsToDependencies(defaults: TargetDefaults): TargetDependencies {
  const res = {};
  Object.keys(defaults).forEach((k) => {
    res[k] = defaults[k].dependsOn;
  });

  return res;
}

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
  const nxJson = readNxJsonInTree(tree);
  const defaultDependencyConfigs = mapTargetDefaultsToDependencies(nxJson.targetDefaults);
  const taskGraph = await createTaskGraph(
    projectGraph,
    defaultDependencyConfigs,
    projectNodes,
    [target],
    undefined,
    {}
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
    tasks: Object.values(taskGraph.tasks),
    taskGraph,
    projects: projectNodes.map(mapToProjectName),
    apps,
    libs,
    projectGraph,
  };
}
