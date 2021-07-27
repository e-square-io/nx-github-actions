import type { BaseInputsWithParallel } from '../../../utils/src/lib/nx';

export interface Inputs extends BaseInputsWithParallel {
  target: string;
  bucket: number;
  projects: string[];
  uploadOutputs: boolean;
}
