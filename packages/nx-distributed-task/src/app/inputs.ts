import type * as Core from '@actions/core';

import { BaseInputs, getBaseInputs, getMaxDistribution, getStringArrayInput } from '@e-square/utils/inputs';

export interface Inputs extends BaseInputs {
  target: string;
  distribution: number;
  projects: string[];
  maxParallel: number;
  uploadOutputs: boolean;
  nxCloud: boolean;
}

function getDistribution(core: typeof Core): number {
  return parseInt(core.getInput('distribution') || core.getInput('bucket') || '0');
}

export function getInputs(core: typeof Core): Inputs {
  const target = core.getInput('target', { required: true });

  return {
    ...getBaseInputs(core),
    target,
    distribution: getDistribution(core),
    projects: getStringArrayInput(core, 'projects', ','),
    maxParallel: getMaxDistribution(core, target, 'maxParallel')[target],
    nxCloud: core.getBooleanInput('nxCloud'),
    uploadOutputs: core.getBooleanInput('uploadOutputs'),
  };
}
