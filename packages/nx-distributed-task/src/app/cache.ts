import { context as Context } from '@actions/github';
import type { Hash } from '@nrwl/workspace/src/core/hasher/hasher';
import { createProjectGraphAsync } from '@nrwl/workspace/src/core/project-graph';
import { readNxJson } from '@nrwl/devkit/src/generators/project-configuration';
import { createTasksForProjectToRun } from '@nrwl/workspace/src/tasks-runner/run-command';

import { group } from '@e-square/utils/logger';
import { createHasher, hashTask } from '@e-square/utils/hasher';
import { restoreNxCache, saveNxCache } from '@e-square/utils/cache';
import { createTaskGraph } from '@e-square/utils/task-graph';
import { tree } from '@e-square/utils/fs';

import { Inputs } from './inputs';
import { Workspaces } from './workspace';

export async function createProjectsHash(inputs: Inputs, _require: typeof require): Promise<Hash[]> {
  const workspace = new Workspaces(_require);
  const projectGraph = await createProjectGraphAsync();
  const nxJson = readNxJson(tree);
  const hasher = createHasher(projectGraph, nxJson);
  const tasks = createTasksForProjectToRun(
    inputs.projects.map((p) => projectGraph.nodes[p] ?? null).filter((node) => node !== null),
    { target: inputs.target, configuration: inputs.args.configuration, overrides: {} },
    projectGraph,
    null
  );
  const taskGraph = await createTaskGraph(projectGraph, nxJson, tasks);

  return Promise.all(tasks?.map(async (task) => await hashTask(task, taskGraph, hasher, workspace)));
}

export function restoreCache(context: typeof Context, projectsHash?: Hash[], nxCloud?: boolean): Promise<void> {
  if (nxCloud) return;

  return group('🚀 Retrieving NX cache', () =>
    Promise.all(projectsHash?.map((hash) => restoreNxCache(context, hash))).then()
  );
}

export function saveCache(context: typeof Context, projectsHash?: Hash[], nxCloud?: boolean): Promise<void> {
  if (nxCloud) return;

  return group('🚀 Saving NX cache', () => Promise.all(projectsHash?.map((hash) => saveNxCache(context, hash))).then());
}
