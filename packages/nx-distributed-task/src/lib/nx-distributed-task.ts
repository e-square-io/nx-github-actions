import { endGroup, getInput, info, setFailed, startGroup } from '@actions/core';
import { getDistribution, Inputs } from './inputs';
import {
  assertNxInstalled,
  Exec,
  getMaxDistribution,
  getProjectOutputs,
  getStringArrayInput,
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

export async function main(): Promise<void> {
  const target = getInput('target', { required: true });

  const inputs: Inputs = {
    target,
    distribution: getDistribution(),
    projects: getStringArrayInput('projects', ',', { required: true }),
    maxParallel: getMaxDistribution(target, 'maxParallel')[target],
    args: getStringArrayInput('args'),
    nxCloud: getInput('nxCloud') === 'true',
    uploadOutputs: getInput('uploadOutputs') === '' || getInput('uploadOutputs') === 'true',
  };

  if (inputs.projects.length === 0) {
    info('❕ There are no projects to run, completing');
    return;
  }

  try {
    await assertNxInstalled();

    if (!inputs.nxCloud) {
      await withCache(inputs.target, inputs.distribution, () => runNxTask(inputs));
    } else {
      info('❕ Skipped cache due to NX Cloud usage');
      await runNxTask(inputs);
    }

    await uploadProjectsOutputs(inputs);
  } catch (e) {
    setFailed(e);
  }
}
