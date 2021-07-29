import { Inputs } from './inputs';
import { info, setFailed, startGroup, endGroup, setOutput, debug, getInput } from '@actions/core';
import {
  Exec,
  retrieveGitBoundaries,
  nxPrintAffected,
  assertNxInstalled,
  getStringArrayInput,
  getMaxDistribution,
} from '../../../utils/src';

interface NxAffectedTarget {
  target: string;
  distribution: number;
  projects: string;
}

interface NxAffectedMatrix {
  include: NxAffectedTarget[];
}

export function chunkify<T>(arr: T[], numberOfChunks: number): T[][] {
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

export async function generateAffectedMatrix(
  { targets, maxDistribution, args = [] }: Inputs,
  exec: Exec
): Promise<NxAffectedMatrix> {
  startGroup(`⚙️ Generating affected matrix for ${targets}`);
  const matrix: NxAffectedMatrix = {
    include: [],
  };

  const [base, head] = await retrieveGitBoundaries(exec);

  for (const target of targets) {
    exec.withArgs(`--base=${base}`, `--head=${head}`, ...args);
    debug(`🐞 Calculating affected for "${target}" target`);
    const projects = await nxPrintAffected(target, exec);
    const affectedTargets: NxAffectedTarget[] = chunkify(projects, maxDistribution[target])
      .map((projects, idx) => ({
        target,
        distribution: idx + 1,
        projects: projects.join(','),
      }))
      .filter((target) => target.projects !== '');

    if (affectedTargets.length) {
      matrix.include.push(...affectedTargets);
    }
  }

  debug(`🐞 matrix: ${matrix}`);
  info(`✅ Generated affected matrix`);
  endGroup();

  return matrix;
}

export async function main(): Promise<void> {
  const targets = getStringArrayInput('targets', ',');

  const inputs: Inputs = {
    targets,
    maxDistribution: getMaxDistribution(targets),
    workingDirectory: getInput('workingDirectory'),
    args: getStringArrayInput('args'),
  };

  if (inputs.workingDirectory && inputs.workingDirectory.length > 0) {
    info(`🏃 Working in custom directory: ${inputs.workingDirectory}`);
    process.chdir(inputs.workingDirectory);
  }

  try {
    await assertNxInstalled();

    const exec = new Exec();
    const matrix = await generateAffectedMatrix(inputs, exec);

    setOutput('matrix', matrix);
    setOutput('hasChanges', !!matrix.include.find((target) => target.projects.length));
  } catch (e) {
    setFailed(e);
  }
}
