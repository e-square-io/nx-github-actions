import type * as Core from '@actions/core';

import { log, logger, warning } from './logger';

export interface BaseInputs {
  args: string[];
  debug: boolean;
  workingDirectory: string;
}

export function getStringArrayInput(
  core: typeof Core,
  name: string,
  separator = ' ',
  options?: Core.InputOptions
): string[] {
  return core
    .getInput(name, options)
    .split(separator)
    .filter((value) => value.length > 0);
}

export function getMaxDistribution(
  core: typeof Core,
  targets: string | string[],
  name?: string
): Record<string, number> {
  const value = name ? core.getInput(name) : core.getInput('maxDistribution') || core.getInput('maxParallel');
  const coercedTargets = [].concat(targets);
  const maybeNumberValue = parseInt(value);

  const reduceTargetsDistribution = (source: number | number[] | Record<string, number>) =>
    coercedTargets.reduce((acc, curr, idx) => {
      let targetVal = typeof source === 'object' ? (Array.isArray(source) ? source[idx] : source[curr]) : source;
      if (targetVal === null || targetVal === undefined || isNaN(targetVal) || targetVal <= 0) {
        warning(
          new Error(
            `Received invalid value for ${name} input: '${targetVal}' for target '${curr}', using the default instead`
          )
        );
        targetVal = 3;
      }

      return { ...acc, [curr]: targetVal };
    }, {});

  if (isNaN(maybeNumberValue)) {
    // maybe an object, parse JSON
    try {
      return reduceTargetsDistribution(JSON.parse(value));
    } catch {
      warning(new Error(`Couldn't parse '${value}' as a valid JSON object, using default value for ${name}`));
    }
  }

  return reduceTargetsDistribution(maybeNumberValue);
}

export function getBaseInputs(core: typeof Core): BaseInputs {
  const debug = core.getBooleanInput('debug');
  const workingDirectory = core.getInput('workingDirectory');

  logger(core).debugMode = debug;

  if (workingDirectory?.length > 0) {
    log(`🏃 Working in custom directory: ${workingDirectory}`);
    process.chdir(workingDirectory);
  }

  return {
    args: getStringArrayInput(core, 'args'),
    debug,
    workingDirectory,
  };
}
