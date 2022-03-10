import type * as _core from '@actions/core';
import type * as _exec from '@actions/exec';
import type * as _glob from '@actions/glob';
import type { context as Context } from '@actions/github';

import { Exec } from '@e-square/utils/exec';
import { info } from '@e-square/utils/logger';

import { getInputs } from './app/inputs';
import { assertNxInstalled, nxRunMany } from './app/nx';
import { uploadProjectsOutputs } from './app/upload';
import { createProjectsHash, restoreCache, saveCache } from './app/cache';

export default async function (
  context: typeof Context,
  core: typeof _core,
  exec: typeof _exec,
  glob: typeof _glob,
  _require: typeof require
) {
  let projectHashes;
  const parsedInputs = getInputs(core);

  if (parsedInputs.projects.length === 0) {
    info('There are no projects to run, completing');
    return;
  }

  try {
    if (!parsedInputs.nxCloud) {
      projectHashes = await createProjectsHash(parsedInputs, _require);
    }

    await assertNxInstalled(new Exec(exec.exec));
    await restoreCache(context, projectHashes, parsedInputs.nxCloud);
    await nxRunMany(context, parsedInputs.args, new Exec(exec.exec));
    await uploadProjectsOutputs(glob, parsedInputs);
    await saveCache(context, projectHashes, parsedInputs.nxCloud);
  } catch (e) {
    core.setFailed(e);
  }
}
