import type * as _core from '@actions/core';
import type * as _exec from '@actions/exec';
import type * as _glob from '@actions/glob';
import type { context as Context } from '@actions/github';
import { createProjectGraphAsync } from 'nx/src/project-graph/project-graph';

import { Exec } from '@e-square/utils/exec';
import { info, log } from '@e-square/utils/logger';
import { projectsToRun } from '@e-square/utils/project-graph';
import { tree } from '@e-square/utils/fs';

import { getInputs } from './app/inputs';
import { assertNxInstalled, nxRunMany } from './app/nx';
import { uploadProjectsOutputs } from './app/upload';
import { restoreCache, saveCache } from './app/cache';
import { createTaskGraph } from 'nx/src/tasks-runner/create-task-graph';
import { readNxJson } from 'nx/src/generators/utils/project-configuration';
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
  log('inputs: ' + JSON.stringify(parsedInputs));
  log('core: ' + JSON.stringify(core));
  if (parsedInputs.projects.length === 0) {
    info('There are no projects to run, completing');
    return;
  }

  try {
    const projectGraph = await createProjectGraphAsync();
    const projectNames = projectsToRun(parsedInputs.args, projectGraph).map((project) => project.name);
    const nxJson = readNxJson(tree);
    const defaultDependencyConfigs = mapTargetDefaultsToDependencies(nxJson.targetDefaults);
    const taskGraph = await createTaskGraph(
      projectGraph,
      defaultDependencyConfigs,
      projectNames,
      [parsedInputs.target],
      undefined,
      {}
    );
    log('taskGraph: ' + JSON.stringify(taskGraph));

    const tasks = Object.values(taskGraph.tasks);
    log('tasks: ' + JSON.stringify(tasks));

    await assertNxInstalled(new Exec(exec.exec));
    !parsedInputs.nxCloud && (await restoreCache(context, tasks, taskGraph));
    await nxRunMany(context, parsedInputs.args, new Exec(exec.exec));
    parsedInputs.uploadOutputs && (await uploadProjectsOutputs(glob, tasks));
    !parsedInputs.nxCloud && (await saveCache(context, tasks, taskGraph));
  } catch (e) {
    core.setFailed(e);
  }
}
