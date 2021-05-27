import { Exec, nxRunMany } from '../../../utils/src';
import { Inputs } from './inputs';
import { getInput, info, setFailed } from '@actions/core';

async function main(): Promise<void> {
  const inputs: Inputs = {
    target: getInput('target', { required: true }),
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
    const exec = new Exec();
    exec.withArgs(`--projects=${inputs.projects}`);
    await nxRunMany(inputs.target, inputs, exec);
  } catch (e) {
    setFailed(e);
  }
}

void main();
