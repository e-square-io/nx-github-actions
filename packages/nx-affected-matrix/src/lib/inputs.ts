import { BaseInputs, getBaseInputs, getMaxDistribution, getStringArrayInput } from '../../../utils/src/lib/inputs';

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
