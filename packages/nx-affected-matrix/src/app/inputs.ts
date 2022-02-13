import { BaseInputs, getBaseInputs, getMaxDistribution, getStringArrayInput } from '@e-square/utils';

export interface Inputs extends BaseInputs {
  targets: string[];
  maxDistribution: Record<string, number>;
  /** @deprecated use maxDistribution instead */
  maxParallel?: number;
}

export function getInputs(): Inputs {
  const targets = getStringArrayInput('targets', ',');

  return {
    ...getBaseInputs(),
    targets,
    maxDistribution: getMaxDistribution(targets),
  };
}
