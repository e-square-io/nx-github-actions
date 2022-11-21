import { mapToProjectName, projectsToRun } from '@e-square/utils/project-graph';
import { tree } from '@e-square/utils/fs';

import type { Task } from '@e-square/utils/task';
import type { ProjectGraph } from 'nx/src/config/project-graph';
import { NxArgs } from 'nx/src/utils/command-line-utils';
import { createTaskGraph } from 'nx/src/tasks-runner/create-task-graph';
import { readNxJson } from 'nx/src/generators/utils/project-configuration';
import { TargetDefaults, TargetDependencies } from 'nx/src/config/nx-json';
import { createProjectGraphAsync } from 'nx/src/project-graph/project-graph';
import { TaskGraph } from 'nx/src/config/task-graph';

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
  const nxJson = readNxJson(tree);
  const defaultDependencyConfigs = mapTargetDefaultsToDependencies(nxJson.targetDefaults);
  const taskGraph = await createTaskGraph(
    projectGraph,
    defaultDependencyConfigs,
    projectNodes.map(({ name }) => name),
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
