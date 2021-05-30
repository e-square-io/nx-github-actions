import type { BaseInputs } from '../../../utils/src/lib/nx';

export interface Inputs extends BaseInputs {
  target: string;
  bucket: number;
  projects: string[];
  uploadOutputs: boolean;
}
