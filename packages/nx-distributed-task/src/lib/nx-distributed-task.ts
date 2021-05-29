import { endGroup, getInput, info, setFailed, startGroup } from '@actions/core';
import { Inputs } from './inputs';
import {
  assertNxInstalled,
  Exec,
  getCacheKeys,
  nxRunMany,
  restoreNxCache,
  saveNxCache,
} from '../../../utils/src';

async function main(): Promise<void> {
  const inputs: Inputs = {
    target: getInput('target', { required: true }),
    bucket: parseInt(getInput('bucket', { required: true })),
    projects: getInput('projects', { required: true })
      .split(',')
      .filter((arg) => arg.length > 0),
    maxParallel: isNaN(parseInt(getInput('maxParallel')))
      ? 3
      : parseInt(getInput('maxParallel')),
    args: getInput('args')
      .split(' ')
      .filter((arg) => arg.length > 0),
    nxCloud: getInput('nxCloud') === 'true',
    deployArtifacts: getInput('deployArtifacts') === 'true',
  };

  if (inputs.projects.length === 0) {
    info('❗️ There are no projects to run, completing');
    return;
  }

  try {
    await assertNxInstalled();

    startGroup('🚀 Retrieving NX cache');
    const cacheParams = getCacheKeys(inputs.target, inputs.bucket);
    await restoreNxCache(...cacheParams);
    endGroup();

    startGroup('🏃 Running NX target');
    const exec = new Exec();
    exec.withArgs(`--projects=${inputs.projects}`);
    await nxRunMany(inputs.target, inputs, exec);
    endGroup();

    startGroup('✅ Saving NX cache');
    await saveNxCache(cacheParams[0]);
    endGroup();

    //  TODO: add upload artifact
  } catch (e) {
    setFailed(e);
  }
}

void main();
