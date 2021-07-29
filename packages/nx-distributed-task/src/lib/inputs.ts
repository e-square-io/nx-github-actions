import type { BaseInputsWithParallel } from '../../../utils/src/lib/nx';
import { getInput } from '@actions/core';

export interface Inputs extends BaseInputsWithParallel {
  target: string;
  distribution: number;
  projects: string[];
  uploadOutputs: boolean;
}

export function getDistribution(): number {
  return parseInt(getInput('distribution') || getInput('bucket') || '0');
}
