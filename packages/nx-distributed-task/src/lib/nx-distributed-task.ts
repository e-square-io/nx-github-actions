import { endGroup, getInput, info, setFailed, setOutput, startGroup } from '@actions/core';
import { Inputs } from './inputs';
import {
  assertNxInstalled,
  Exec,
  getProjectOutputs,
  getWorkspaceProjects,
  nxRunMany,
  uploadArtifact,
  withCache,
} from '../../../utils/src';

async function uploadProjectsOutputs(inputs: Inputs): Promise<void> {
  if (!inputs.uploadOutputs) return;

  startGroup('⬆️ Uploading artifacts');
  const projects = getWorkspaceProjects();
  const artifactName = inputs.target;

  await Promise.all(
    inputs.projects.map((project) => uploadArtifact(artifactName, getProjectOutputs(projects, project, inputs.target)))
  );

  endGroup();
}

async function runNxTask(inputs: Inputs): Promise<void> {
  startGroup('🏃 Running NX target');
  const exec = new Exec();
  exec.withArgs(`--projects=${inputs.projects}`);
  await nxRunMany(inputs.target, inputs, exec);
  endGroup();
}

async function main(): Promise<void> {
  const inputs: Inputs = {
    target: getInput('target', { required: true }),
    bucket: parseInt(getInput('bucket', { required: true })),
    projects: getInput('projects', { required: true })
      .split(',')
      .filter((arg) => arg.length > 0),
    maxParallel: isNaN(parseInt(getInput('maxParallel'))) ? 3 : parseInt(getInput('maxParallel')),
    args: getInput('args')
      .split(' ')
      .filter((arg) => arg.length > 0),
    nxCloud: getInput('nxCloud') === 'true',
    uploadOutputs: getInput('uploadOutputs') === 'true',
  };

  if (inputs.projects.length === 0) {
    info('❕ There are no projects to run, completing');
    return;
  }

  try {
    await assertNxInstalled();

    if (!inputs.nxCloud) {
      await withCache(inputs.target, inputs.bucket, () => runNxTask(inputs));
    } else {
      info('❕ Skipped cache due to NX Cloud usage');
      await runNxTask(inputs);
    }

    await uploadProjectsOutputs(inputs);
  } catch (e) {
    setFailed(e);
  }
}

void main();
