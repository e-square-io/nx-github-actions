import { getBooleanInput, getInput, InputOptions } from '@actions/core';

import { logger } from './logger';

export interface BaseInputs {
  args: string[];
  debug: boolean;
  workingDirectory: string;
}

export function getStringArrayInput(name: string, separator = ' ', options?: InputOptions): string[] {
  return getInput(name, options)
    .split(separator)
    .filter((value) => value.length > 0);
}

export function getMaxDistribution(targets: string | string[], name?: string): Record<string, number> {
  const value = name ? getInput(name) : getInput('maxDistribution') || getInput('maxParallel');
  const coercedTargets = [].concat(targets);
  const maybeNumberValue = parseInt(value);

  const reduceTargetsDistribution = (source: number | number[] | Record<string, number>) =>
    coercedTargets.reduce((acc, curr, idx) => {
      let targetVal = typeof source === 'object' ? (Array.isArray(source) ? source[idx] : source[curr]) : source;
      if (targetVal === null || targetVal === undefined || isNaN(targetVal) || targetVal <= 0) {
        logger.warning(
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
      logger.warning(new Error(`Couldn't parse '${value}' as a valid JSON object, using default value for ${name}`));
    }
  }

  return reduceTargetsDistribution(maybeNumberValue);
}

export function getBaseInputs(): BaseInputs {
  const debug = getBooleanInput('debug');
  const workingDirectory = getInput('workingDirectory');

  logger.debugMode = debug;

  if (workingDirectory?.length > 0) {
    logger.log(`🏃 Working in custom directory: ${workingDirectory}`);
    process.chdir(workingDirectory);
  }

  return {
    args: getStringArrayInput('args'),
    debug,
    workingDirectory,
  };
}
