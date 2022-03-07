import type * as _core from '@actions/core';
import type { context as Context } from '@actions/github';

import { generateAffectedMatrix } from './app/nx-affected-matrix';
import { getInputs } from './app/inputs';

export default async function (context: typeof Context, core: typeof _core) {
  try {
    const parsedInputs = getInputs(core);
    const { matrix, apps, libs } = await generateAffectedMatrix(parsedInputs);

    core.setOutput('matrix', matrix);
    core.setOutput('apps', apps);
    core.setOutput('libs', libs);
    core.setOutput('hasChanges', apps.length > 0 || libs.length > 0);
  } catch (e) {
    core.setFailed(e);
  }
}
