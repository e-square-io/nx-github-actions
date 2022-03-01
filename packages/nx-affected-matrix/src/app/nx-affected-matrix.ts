import type * as Core from '@actions/core';
import type * as _Exec from '@actions/exec';
import * as Io from '@actions/io';
import type { context as Context } from '@actions/github';

import { Exec } from '@e-square/utils/exec';
import { assertNxInstalled, nxPrintAffected } from '@e-square/utils/nx';
import { debug, group, success } from '@e-square/utils/logger';

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
  return group(`⚙️ Generating affected matrix for ${targets}`, async () => {
    const matrix: NxAffectedMatrix = {
      include: [],
    };

    for (const target of targets) {
      exec.withArgs(...args);

      debug(`Calculating affected for "${target}" target`);

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

    debug(`matrix: ${matrix}`);
    success(`Generated affected matrix`);

    return matrix;
  });
}

export async function main(
  context: typeof Context,
  core: typeof Core,
  exec: typeof _Exec,
  io: typeof Io,
  require?
): Promise<void> {
  try {
    const parsedInputs = getInputs(core);

    await assertNxInstalled(new Exec(exec.exec));
    const matrix = await generateAffectedMatrix(parsedInputs, new Exec(exec.exec));

    core.setOutput('matrix', matrix);
    core.setOutput('hasChanges', !!matrix.include.find((target) => target.projects.length));
  } catch (e) {
    core.setFailed(e);
  }
}
