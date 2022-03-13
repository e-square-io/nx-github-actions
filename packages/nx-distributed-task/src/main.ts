import type * as _core from '@actions/core';
import type * as _exec from '@actions/exec';
import type * as _glob from '@actions/glob';
import type { context as Context } from '@actions/github';
import { readNxJson } from '@nrwl/devkit/src/generators/project-configuration';
import { createProjectGraphAsync } from '@nrwl/workspace/src/core/project-graph';

import { Exec } from '@e-square/utils/exec';
import { info } from '@e-square/utils/logger';
import { createTaskGraph } from '@e-square/utils/task-graph';
import { projectsToRun } from '@e-square/utils/project-graph';
import { tree } from '@e-square/utils/fs';

import { getInputs } from './app/inputs';
import { assertNxInstalled, nxRunMany } from './app/nx';
import { uploadProjectsOutputs } from './app/upload';
import { restoreCache, saveCache } from './app/cache';
import { Workspaces } from '@e-square/utils/workspace';

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

    const { tasks, taskGraph } = await createTaskGraph(
      parsedInputs.args,
      projectNodes,
      projectGraph,
      readNxJson(tree),
      new Workspaces(_require)
    );

    await assertNxInstalled(new Exec(exec.exec));
    !parsedInputs.nxCloud && (await restoreCache(context, tasks, taskGraph));
    await nxRunMany(context, parsedInputs.args, new Exec(exec.exec));
    parsedInputs.uploadOutputs && (await uploadProjectsOutputs(glob, tasks, taskGraph));
    !parsedInputs.nxCloud && (await saveCache(context, tasks, taskGraph));
  } catch (e) {
    core.setFailed(e);
  }
}
