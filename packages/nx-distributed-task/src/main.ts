import type * as _core from '@actions/core';
import type * as _exec from '@actions/exec';
import type * as _glob from '@actions/glob';
import type * as _io from '@actions/io';
import type { context as Context } from '@actions/github';

import { Exec } from '@e-square/utils/exec';
import { info } from '@e-square/utils/logger';

import { getInputs } from './app/inputs';
import { assertNxInstalled, runNxTask } from './app/nx';
import { uploadProjectsOutputs } from './app/upload';
import { restoreCache, saveCache } from './app/cache';

export default async function (
  context: typeof Context,
  core: typeof _core,
  exec: typeof _exec,
  glob: typeof _glob,
  io: typeof _io,
  require?
) {
  const parsedInputs = getInputs(core);

  if (parsedInputs.projects.length === 0) {
    info('There are no projects to run, completing');
    return;
  }

  try {
    await assertNxInstalled(new Exec(exec.exec));
    await restoreCache(context, glob, core, parsedInputs);
    await runNxTask(context, exec, parsedInputs);
    await uploadProjectsOutputs(glob, parsedInputs);
    await saveCache(core, parsedInputs);
  } catch (e) {
    core.setFailed(e);
  }
}
