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
  const { debug, workingDirectory, args } = getBaseInputs(core, 'run-many');

  args.target = target;
  args.projects = getStringArrayInput(core, 'projects', ',');
  args.parallel = getMaxDistribution(core, target, 'maxParallel')[target];
  args.scan = core.getBooleanInput('nxCloud');

  if (args.scan === false) delete args.scan;

  return {
    args,
    debug,
    workingDirectory,
    target,
    distribution: getDistribution(core),
    projects: args.projects,
    maxParallel: args.parallel,
    nxCloud: Boolean(args.scan),
    uploadOutputs: core.getBooleanInput('uploadOutputs'),
  };
}
