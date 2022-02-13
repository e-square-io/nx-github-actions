import { getState, saveState, setFailed } from '@actions/core';

import {
  assertNxInstalled,
  Exec,
  getProjectOutputs,
  getWorkspaceProjects,
  nxRunMany,
  restoreNxCache,
  saveNxCache,
  uploadArtifact,
  logger,
} from '@e-square/utils';
import { getInputs, Inputs } from './inputs';

const IS_POST_JOB = 'isPostJob';

function uploadProjectsOutputs(inputs: Inputs): Promise<void> {
  if (!inputs.uploadOutputs) return;

  return logger.group('⬆️ Uploading artifacts', async () => {
    const projects = getWorkspaceProjects();
    const artifactName = inputs.target;

    await Promise.all(
      inputs.projects.map((project) =>
        uploadArtifact(artifactName, getProjectOutputs(projects, project, inputs.target))
      )
    );
  });
}

function runNxTask(inputs: Inputs): Promise<void> {
  return logger.group('🏃 Running NX target', async () => {
    const exec = new Exec();
    exec.withArgs(`--projects=${inputs.projects}`);
    await nxRunMany(inputs.target, inputs, exec);
  });
}

function restoreCache({ target, distribution, nxCloud }: Inputs): Promise<void> {
  if (nxCloud) return;

  return logger.group('🚀 Retrieving NX cache', () => restoreNxCache(target, distribution));
}

export async function main(): Promise<void> {
  /* post-job execution */
  if (getState(IS_POST_JOB) === 'true') {
    await saveNxCache();
    return;
  }

  const inputs = getInputs();

  if (inputs.projects.length === 0) {
    logger.info('There are no projects to run, completing');
    return;
  }

  try {
    await assertNxInstalled();
    await restoreCache(inputs);
    await runNxTask(inputs);
    await uploadProjectsOutputs(inputs);
  } catch (e) {
    setFailed(e);
  }

  saveState(IS_POST_JOB, true);
}
