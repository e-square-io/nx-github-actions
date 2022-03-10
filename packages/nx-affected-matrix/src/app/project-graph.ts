import { execSync } from 'child_process';

import type { ProjectGraph } from '@nrwl/workspace/src/core/project-graph';
import { filterAffected } from '@nrwl/workspace/src/core/affected-project-graph';
import { calculateFileChanges, TEN_MEGABYTES } from '@nrwl/workspace/src/core/file-utils';

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

  return getFilesUsingBaseAndHead(base, head);
}

export function getAffectedProjectGraph(graph: ProjectGraph): ProjectGraph {
  return filterAffected(graph, calculateFileChanges(getAffectedFiles(), graph.allWorkspaceFiles));
}
