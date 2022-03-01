import type * as Core from '@actions/core';
import type * as _Exec from '@actions/exec';
import type * as Glob from '@actions/glob';
import type * as Io from '@actions/io';
import type { context as Context } from '@actions/github';

import { uploadArtifact } from '@e-square/utils/artifact';
import { restoreNxCache, saveNxCache } from '@e-square/utils/cache';
import { Exec } from '@e-square/utils/exec';
import { group, info } from '@e-square/utils/logger';
import { assertNxInstalled, getProjectOutputs, getWorkspaceProjects, nxRunMany } from '@e-square/utils/nx';

import { getInputs, Inputs } from './inputs';

function uploadProjectsOutputs(glob: typeof Glob, inputs: Inputs): Promise<void> {
  if (!inputs.uploadOutputs) return;

  return group('⬆️ Uploading artifacts', async () => {
    const projects = getWorkspaceProjects();
    const artifactName = inputs.target;

    await Promise.all(
      inputs.projects.map((project) =>
        uploadArtifact(glob, artifactName, getProjectOutputs(projects, project, inputs.target))
      )
    );
  });
}

function runNxTask(context: typeof Context, exec: typeof _Exec, inputs: Inputs): Promise<void> {
  return group('🏃 Running NX target', async () => {
    const _exec = new Exec(exec.exec);
    _exec.withArgs(`--projects=${inputs.projects}`);
    await nxRunMany(context, inputs.target, inputs, _exec);
  });
}

function restoreCache(
  context: typeof Context,
  glob: typeof Glob,
  core: typeof Core,
  { target, distribution, nxCloud }: Inputs
): Promise<void> {
  if (nxCloud) return;

  return group('🚀 Retrieving NX cache', () => restoreNxCache(context, glob, core, target, distribution));
}

function saveCache(core: typeof Core, { nxCloud }: Inputs): Promise<void> {
  if (nxCloud) return;

  return group('🚀 Saving NX cache', () => saveNxCache(core));
}

export async function main(
  context: typeof Context,
  core: typeof Core,
  exec: typeof _Exec,
  glob: typeof Glob,
  io: typeof Io,
  require?
): Promise<void> {
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
