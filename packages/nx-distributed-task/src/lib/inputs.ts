import type { BaseInputs } from '../../../utils/src/lib/nx';

export interface Inputs extends BaseInputs {
  target: string;
  projects: string[];
  deployArtifacts: boolean;
}
