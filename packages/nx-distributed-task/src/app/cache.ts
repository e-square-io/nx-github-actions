import { context as Context } from '@actions/github';
import type { Hash } from '@nrwl/workspace/src/core/hasher/hasher';
import { Workspaces } from '@nrwl/tao/src/shared/workspace';
import { createProjectGraphAsync } from '@nrwl/workspace/src/core/project-graph';
import { readNxJson } from '@nrwl/devkit/src/generators/project-configuration';
import { createTasksForProjectToRun } from '@nrwl/workspace/src/tasks-runner/run-command';

import { debug, group } from '@e-square/utils/logger';
import { createHasher, hashTask } from '@e-square/utils/hasher';
import { restoreNxCache, saveNxCache } from '@e-square/utils/cache';
import { createTaskGraph } from '@e-square/utils/task-graph';

import { Inputs } from './inputs';
import { tree } from '@e-square/utils/fs';

export async function createProjectsHash(inputs: Inputs): Promise<Hash[]> {
  const workspace = new Workspaces(tree.root);
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

  debug('Project Graph:');
  debug(JSON.stringify(projectGraph, null, 2));
  debug('NX json:');
  debug(JSON.stringify(nxJson, null, 2));
  debug('Tasks:');
  debug(JSON.stringify(tasks, null, 2));
  debug('Task Graph:');
  debug(JSON.stringify(taskGraph, null, 2));

  return Promise.all(tasks?.map(async (task) => await hashTask(task, taskGraph, hasher, workspace)));
}

export function restoreCache(context: typeof Context, projectsHash?: Hash[], nxCloud?: boolean): Promise<void> {
  if (nxCloud) return;

  debug('Project Hashes:');
  debug(JSON.stringify(projectsHash, null, 2));

  return group('🚀 Retrieving NX cache', () =>
    Promise.all(projectsHash?.map(({ value }) => restoreNxCache(context, value))).then()
  );
}

export function saveCache(context: typeof Context, projectsHash?: Hash[], nxCloud?: boolean): Promise<void> {
  if (nxCloud) return;

  return group('🚀 Saving NX cache', () =>
    Promise.all(projectsHash?.map(({ value }) => saveNxCache(context, value))).then()
  );
}
