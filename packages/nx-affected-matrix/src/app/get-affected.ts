import { projectHasTarget } from '@nrwl/workspace/src/utilities/project-graph-utils';
import { createProjectGraphAsync } from '@nrwl/workspace/src/core/project-graph/project-graph';
import { withDeps } from '@nrwl/workspace/src/core/project-graph/operators';

import { getAffectedProjectGraph } from './project-graph';
import { createTaskGraph } from '@e-square/utils/task-graph';

import type { ProjectGraphProjectNode, ProjectGraph, TaskGraph } from '@nrwl/devkit';
import type { NxArgs } from '@nrwl/workspace/src/command-line/utils';
import type { Task } from '@e-square/utils/task';

function projectsToRun(nxArgs: NxArgs, projectGraph: ProjectGraph, target: string): ProjectGraphProjectNode[] {
  let affectedGraph = nxArgs.all ? projectGraph : getAffectedProjectGraph(projectGraph);
  if (!nxArgs.all && nxArgs.withDeps) {
    affectedGraph = withDeps(projectGraph, Object.values(affectedGraph.nodes) as ProjectGraphProjectNode[]);
  }

  let graphNodes = Object.values(affectedGraph.nodes);

  if (nxArgs.exclude) {
    const excludedProjects = new Set(nxArgs.exclude);
    graphNodes = graphNodes.filter((project) => !excludedProjects.has(project.name));
  }

  return allProjectsWithTarget(graphNodes, target);
}

function allProjectsWithTarget(projects: ProjectGraphProjectNode[], target: string): ProjectGraphProjectNode[] {
  return projects.filter((p) => projectHasTarget(p, target));
}

function mapToProjectName(project: ProjectGraphProjectNode): string {
  return project.name;
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
  e2e: string[];
  projectGraph: ProjectGraph;
}> {
  const projectGraph = await createProjectGraphAsync();

  const projectNodes = projectsToRun(args, projectGraph, target);
  const { tasks, graph } = await createTaskGraph(
    projectNodes.map(mapToProjectName),
    target,
    args.configuration,
    _require
  );
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
    taskGraph: graph,
    projects: projectNodes.map(mapToProjectName),
    apps,
    libs,
    e2e,
    projectGraph,
  };
}
