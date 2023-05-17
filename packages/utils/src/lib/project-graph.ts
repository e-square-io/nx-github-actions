import { execSync } from 'child_process';

import { filterAffected } from 'nx/src/project-graph/affected/affected-project-graph';
import { calculateFileChanges, TEN_MEGABYTES } from 'nx/src/project-graph/file-utils';
import { filterNodes, withDeps } from 'nx/src/project-graph/operators';
import { projectHasTarget } from 'nx/src/utils/project-graph-utils';

import type { ProjectGraph, ProjectGraphProjectNode } from '@nrwl/devkit';
import type { NxArgs } from 'nx/src/utils/command-line-utils';

function filterByPredicate(
  list: Set<string>,
  graph: ProjectGraph,
  predicate: (exists: boolean) => boolean = (exists) => exists
): ProjectGraph {
  return filterNodes((node) => predicate(list.has(node.name)))(graph);
}

export function projectsToRun(nxArgs: NxArgs, projectGraph: ProjectGraph): ProjectGraphProjectNode[] {
  if (!nxArgs.target) {
    throw new Error('Could not find target in nxArgs');
  }

  let affectedGraph = nxArgs.all || nxArgs.projects?.length ? projectGraph : getAffectedProjectGraph(projectGraph);
  if (nxArgs.projects) {
    affectedGraph = filterByPredicate(new Set(nxArgs.projects), affectedGraph);
  }

  if (nxArgs.exclude) {
    affectedGraph = filterByPredicate(new Set(nxArgs.projects), affectedGraph, (exists) => !exists);
  }

  if (!nxArgs.all && nxArgs.withDeps) {
    affectedGraph = withDeps(projectGraph, Object.values(affectedGraph.nodes) as ProjectGraphProjectNode[]);
  }

  return allProjectsWithTarget(Object.values(affectedGraph.nodes), nxArgs.target);
}

export function allProjectsWithTarget(projects: ProjectGraphProjectNode[], target: string): ProjectGraphProjectNode[] {
  return projects.filter((p) => projectHasTarget(p, target));
}

export function mapToProjectName(project: ProjectGraphProjectNode): string {
  return project.name;
}

function getFilesUsingBaseAndHead(base: string, head: string): string[] {
  let mergeBase: string;
  try {
    mergeBase = execSync(`git merge-base "${base}" "${head}"`, {
      maxBuffer: TEN_MEGABYTES,
    })
      .toString()
      .trim();
  } catch {
    mergeBase = execSync(`git merge-base --fork-point "${base}" "${head}"`, {
      maxBuffer: TEN_MEGABYTES,
    })
      .toString()
      .trim();
  }
  return parseGitOutput(`git diff --name-only --relative "${mergeBase}" "${head}"`);
}

function parseGitOutput(command: string): string[] {
  return execSync(command, { maxBuffer: TEN_MEGABYTES })
    .toString('utf-8')
    .split('\n')
    .map((a) => a.trim())
    .filter((a) => a.length > 0);
}

export function getAffectedFiles(): string[] {
  const base = process.env.NX_BASE;
  const head = process.env.NX_HEAD;

  if (!base || !head) {
    throw new Error('Could not find NX_BASE or NX_HEAD variables in environment');
  }

  return getFilesUsingBaseAndHead(base, head);
}

export function getAffectedProjectGraph(graph: ProjectGraph): ProjectGraph {
  return filterAffected(graph, calculateFileChanges(getAffectedFiles(), graph.allWorkspaceFiles ?? []));
}
