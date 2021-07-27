import type { BaseInputs } from '../../../utils/src/lib/nx';

export interface Inputs extends BaseInputs {
  targets: string[];
  maxDistribution: Record<string, number>;
  workingDirectory: string;
  /** @deprecated use maxDistribution instead */
  maxParallel?: number;
}
