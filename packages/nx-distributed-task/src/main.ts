import type * as _core from '@actions/core';
import type * as _exec from '@actions/exec';
import type * as _glob from '@actions/glob';
import type { context as Context } from '@actions/github';
import { createProjectGraphAsync } from '@nrwl/workspace/src/core/project-graph';

import { Exec } from '@e-square/utils/exec';
import { info } from '@e-square/utils/logger';
import { projectsToRun } from '@e-square/utils/project-graph';
import { tree } from '@e-square/utils/fs';

import { getInputs } from './app/inputs';
import { assertNxInstalled, nxRunMany } from './app/nx';
import { uploadProjectsOutputs } from './app/upload';
import { restoreCache, saveCache } from './app/cache';
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

export default async function (
  context: typeof Context,
  core: typeof _core,
  exec: typeof _exec,
  glob: typeof _glob,
  _require: typeof require
) {
  const parsedInputs = getInputs(core);

  if (parsedInputs.projects.length === 0) {
    info('There are no projects to run, completing');
    return;
  }

  try {
    const projectGraph = await createProjectGraphAsync();
    const projectNodes = projectsToRun(parsedInputs.args, projectGraph);
    const nxJson = readNxJsonInTree(tree);
    const defaultDependencyConfigs = mapTargetDefaultsToDependencies(nxJson.targetDefaults);
    const taskGraph = await createTaskGraph(
      projectGraph,
      defaultDependencyConfigs,
      projectNodes,
      [parsedInputs.target],
      undefined,
      {}
    );

    const tasks = Object.values(taskGraph.tasks);

    await assertNxInstalled(new Exec(exec.exec));
    !parsedInputs.nxCloud && (await restoreCache(context, tasks, taskGraph));
    await nxRunMany(context, parsedInputs.args, new Exec(exec.exec));
    parsedInputs.uploadOutputs && (await uploadProjectsOutputs(glob, tasks, taskGraph));
    !parsedInputs.nxCloud && (await saveCache(context, tasks, taskGraph));
  } catch (e) {
    core.setFailed(e);
  }
}
