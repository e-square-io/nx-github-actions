import { debug, group, success } from '@e-square/utils/logger';

import { Inputs } from './inputs';
import { getAffected } from './get-affected';

interface NxAffectedTarget {
  target: string;
  /** @deprecated not needed anymore */
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
  { targets, maxDistribution, args = {} }: Pick<Inputs, 'targets' | 'maxDistribution' | 'args'>,
  _require: typeof require
): Promise<{
  matrix: NxAffectedMatrix;
  apps: string;
  libs: string;
}> {
  return group(`⚙️ Generating affected matrix for ${targets}`, async () => {
    const affectedApps = [];
    const affectedLibs = [];
    const matrix: NxAffectedMatrix = {
      include: [],
    };

    for (const target of targets) {
      debug(`Calculating affected for "${target}" target`);

      const { projects, apps, libs } = await getAffected(target, args, _require);

      affectedApps.push(...apps);
      affectedLibs.push(...libs);

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

    debug(`matrix: ${JSON.stringify(matrix, null, 2)}`);
    success(`Generated affected matrix`);

    return {
      matrix,
      apps: Array.from(new Set(affectedApps)).join(','),
      libs: Array.from(new Set(affectedLibs)).join(','),
    };
  });
}
