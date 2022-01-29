import { getState, saveState, setFailed } from '@actions/core';
import { getInputs, Inputs } from './inputs';
import {
  assertNxInstalled,
  CACHE_KEY,
  Exec,
  getCacheKeys,
  getProjectOutputs,
  getWorkspaceProjects,
  nxRunMany,
  restoreNxCache,
  saveNxCache,
  uploadArtifact,
  logger,
} from '../../../utils/src';

const IS_POST_JOB = 'isPostJob';

async function uploadProjectsOutputs(inputs: Inputs): Promise<void> {
  if (!inputs.uploadOutputs) return;

  await logger.group('⬆️ Uploading artifacts', async () => {
    const projects = getWorkspaceProjects();
    const artifactName = inputs.target;

    await Promise.all(
      inputs.projects.map((project) =>
        uploadArtifact(artifactName, getProjectOutputs(projects, project, inputs.target))
      )
    );
  });
}

async function runNxTask(inputs: Inputs): Promise<void> {
  await logger.group('🏃 Running NX target', async () => {
    const exec = new Exec();
    exec.withArgs(`--projects=${inputs.projects}`);
    await nxRunMany(inputs.target, inputs, exec);
  });
}

async function restoreCache(inputs: Inputs) {
  if (inputs.nxCloud) return;

  const [primary, restoreKeys] = await getCacheKeys(inputs.target, inputs.distribution);

  await logger.group('🚀 Retrieving NX cache', () => restoreNxCache(primary, restoreKeys));

  if (logger.debugMode) return;

  saveState(CACHE_KEY, primary);
}

async function saveCache() {
  const primary = getState(CACHE_KEY);
  if (!primary) {
    logger.debug(`Couldn't find primary key in state`);
  } else {
    await saveNxCache(primary);
  }
}

export async function main(): Promise<void> {
  const inputs = getInputs();

  /* post-job execution */
  if (getState(IS_POST_JOB) === 'true') {
    await saveCache();
    return;
  }

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
