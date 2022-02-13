import { getBooleanInput, getInput } from '@actions/core';

import { BaseInputs, getBaseInputs, getStringArrayInput, getMaxDistribution } from '@e-square/utils';

export interface Inputs extends BaseInputs {
  target: string;
  distribution: number;
  projects: string[];
  maxParallel: number;
  uploadOutputs: boolean;
  nxCloud: boolean;
}

function getDistribution(): number {
  return parseInt(getInput('distribution') || getInput('bucket') || '0');
}

export function getInputs(): Inputs {
  const target = getInput('target', { required: true });

  return {
    ...getBaseInputs(),
    target,
    distribution: getDistribution(),
    projects: getStringArrayInput('projects', ','),
    maxParallel: getMaxDistribution(target, 'maxParallel')[target],
    nxCloud: getBooleanInput('nxCloud'),
    uploadOutputs: getBooleanInput('uploadOutputs'),
  };
}
