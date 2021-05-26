import { Inputs } from './inputs';
import {
  getInput,
  info,
  setFailed,
  startGroup,
  endGroup,
  setOutput,
} from '@actions/core';
import {
  runNxCommand,
  Exec,
  retrieveGitBoundaries,
  assertHasNxPackageScript,
} from '../../../utils/src';

interface NxAffectedMatrix {
  target: string[];
  bucket: number[];
  include: { target: string; bucket: number; projects: string }[];
}

function chunkify<T>(arr: T[], numberOfChunks: number): T[][] {
  if (numberOfChunks < 2) return [arr];

  const len = arr.length;
  const result = [];
  let i = 0;
  let size;

  if (len % numberOfChunks === 0) {
    size = Math.floor(len / numberOfChunks);
    while (i < len) {
      result.push(arr.slice(i, (i += size)));
    }
  } else {
    while (i < len) {
      size = Math.ceil((len - i) / numberOfChunks--);
      result.push(arr.slice(i, (i += size)));
    }
  }

  return result;
}

async function getAffectedProjectsForTarget(
  target: string,
  exec: Exec
): Promise<string[]> {
  let projects = '';
  exec.withOptions({
    listeners: { stdout: (data) => (projects += data.toString()) },
  });
  await runNxCommand('print-affected', target, exec, [
    '--select=tasks.target.project',
  ]);

  info(`✅ Affected project for ${target}: ${projects}`);

  return projects.split(', ');
}

async function generateAffectedMatrix(
  { targets, maxParallel }: Inputs,
  exec: Exec
): Promise<NxAffectedMatrix> {
  startGroup(`⚙️ Generating affected matrix for ${targets}`);
  const matrix = {
    target: targets,
    bucket: [...new Array(maxParallel)].map((_, idx) => idx + 1),
    include: [],
  };

  for (const target of targets) {
    info(`⚙️ Calculating affected for ${target} target`);
    matrix.include.push(
      ...chunkify(
        await getAffectedProjectsForTarget(target, exec),
        maxParallel
      ).map((projects, idx) => ({
        target,
        bucket: idx + 1,
        projects: projects.join(','),
      }))
    );
  }

  info(`✅ Generated affected matrix`);
  endGroup();

  return matrix;
}

async function main(): Promise<void> {
  const inputs: Inputs = {
    targets: getInput('targets', { required: true })
      .split(',')
      .filter((target) => target.length > 0),
    maxParallel: isNaN(parseInt(getInput('maxParallel')))
      ? 3
      : parseInt(getInput('maxParallel')),
    workingDirectory: getInput('workingDirectory'),
  };

  if (inputs.workingDirectory && inputs.workingDirectory.length > 0) {
    info(`🏃 Working in custom directory: ${inputs.workingDirectory}`);
    process.chdir(inputs.workingDirectory);
  }

  try {
    await assertHasNxPackageScript();
    const exec = await Exec.init();
    await retrieveGitBoundaries(exec);
    const matrix = await generateAffectedMatrix(inputs, exec);
    setOutput('matrix', matrix);
    setOutput(
      'hasChanges',
      matrix.include.find((target) => target.projects.length)
    );
  } catch (e) {
    setFailed(e);
  }
}

void main();
