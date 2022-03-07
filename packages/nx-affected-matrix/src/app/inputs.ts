import type * as Core from '@actions/core';
import { BaseInputs, getBaseInputs, getMaxDistribution, getStringArrayInput } from '@e-square/utils/inputs';

export interface Inputs extends BaseInputs {
  targets: string[];
  maxDistribution: Record<string, number>;
  /** @deprecated use maxDistribution instead */
  maxParallel?: number;
}

export function getInputs(core: typeof Core): Inputs {
  const targets = getStringArrayInput(core, 'targets', ',');

  return {
    ...getBaseInputs(core, 'print-affected'),
    targets,
    maxDistribution: getMaxDistribution(core, targets),
  };
}
