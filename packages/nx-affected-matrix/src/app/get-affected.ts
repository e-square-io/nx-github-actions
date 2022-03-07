import type { Task, ProjectGraphProjectNode, ProjectGraph } from '@nrwl/devkit';
import type { NxArgs } from '@nrwl/workspace/src/command-line/utils';
import { projectHasTarget } from '@nrwl/workspace/src/utilities/project-graph-utils';
import { createProjectGraphAsync } from '@nrwl/workspace/src/core/project-graph/project-graph';
import { withDeps } from '@nrwl/workspace/src/core/project-graph/operators';

import { getAffectedProjectGraph } from './project-graph';
import { targetToTargetString } from '@nrwl/devkit/src/executors/parse-target-string';
import { debug } from '@e-square/utils/logger';

function createTasks(
  affectedProjectsWithTargetAndConfig: ProjectGraphProjectNode[],
  projectGraph: ProjectGraph,
  nxArgs: NxArgs
): Task[] {
  return affectedProjectsWithTargetAndConfig.map((affectedProject) => ({
    id: targetToTargetString({
      project: affectedProject.name,
      target: nxArgs.target,
      configuration: nxArgs.configuration,
    }),
    target: { project: affectedProject.name, target: nxArgs.target, configuration: nxArgs.configuration },
    overrides: {},
  }));
}

function projectsToRun(nxArgs: NxArgs, projectGraph: ProjectGraph): ProjectGraphProjectNode[] {
  debug(`nxArgs:`);
  debug(JSON.stringify(nxArgs, null, 2));
  let affectedGraph = nxArgs.all ? projectGraph : getAffectedProjectGraph(projectGraph);
  if (!nxArgs.all && nxArgs.withDeps) {
    affectedGraph = withDeps(projectGraph, Object.values(affectedGraph.nodes) as ProjectGraphProjectNode[]);
  }

  if (nxArgs.exclude) {
    const excludedProjects = new Set(nxArgs.exclude);
    return Object.entries(affectedGraph.nodes as Record<string, ProjectGraphProjectNode>)
      .filter(([projectName]) => !excludedProjects.has(projectName))
      .map(([, project]) => project);
  }

  return Object.values(affectedGraph.nodes) as ProjectGraphProjectNode[];
}

function allProjectsWithTarget(projects: ProjectGraphProjectNode[], target: string): ProjectGraphProjectNode[] {
  return projects.filter((p) => projectHasTarget(p, target));
}

function mapToProjectName(project: ProjectGraphProjectNode): string {
  return project.name;
}

export async function getAffected(
  target: string,
  args: NxArgs
): Promise<{
  tasks: Task[];
  projects: string[];
  apps: string[];
  libs: string[];
  e2e: string[];
  projectGraph: ProjectGraph;
}> {
  const projectGraph = await createProjectGraphAsync();

  const projectNodes = allProjectsWithTarget(projectsToRun(args, projectGraph), target);
  const tasks = createTasks(projectNodes, projectGraph, args);
  const apps: string[] = [],
    libs: string[] = [],
    e2e: string[] = [];

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
    projects: projectNodes.map(mapToProjectName),
    apps,
    libs,
    e2e,
    projectGraph,
  };
}
