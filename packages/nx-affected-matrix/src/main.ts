import type * as _core from '@actions/core';
import type * as _exec from '@actions/exec';
import type { context as Context } from '@actions/github';
import type * as _io from '@actions/io';

import { generateAffectedMatrix } from './app/nx-affected-matrix';
import { getInputs } from './app/inputs';

export default async function (context: typeof Context, core: typeof _core) {
  try {
    const parsedInputs = getInputs(core);
    const matrix = await generateAffectedMatrix(parsedInputs);

    core.setOutput('matrix', matrix);
    core.setOutput('hasChanges', !!matrix.include.find((target) => target.projects.length));
  } catch (e) {
    core.setFailed(e);
  }
}
