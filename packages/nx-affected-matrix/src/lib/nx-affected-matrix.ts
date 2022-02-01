import { setFailed, setOutput } from '@actions/core';

import { Exec, retrieveGitBoundaries, nxPrintAffected, assertNxInstalled, logger } from '../../../utils/src';
import { getInputs, Inputs } from './inputs';

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

export function generateAffectedMatrix(
  { targets, maxDistribution, args = [] }: Pick<Inputs, 'targets' | 'maxDistribution' | 'args'>,
  exec: Exec
): Promise<NxAffectedMatrix> {
  return logger.group(`⚙️ Generating affected matrix for ${targets}`, async () => {
    const matrix: NxAffectedMatrix = {
      include: [],
    };

    const [base, head] = await retrieveGitBoundaries(exec);

    for (const target of targets) {
      exec.withArgs(`--base=${base}`, `--head=${head}`, ...args);

      logger.debug(`Calculating affected for "${target}" target`);

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

    logger.debug(`matrix: ${matrix}`);
    logger.success(`Generated affected matrix`);

    return matrix;
  });
}

export async function main(): Promise<void> {
  const inputs = getInputs();

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
