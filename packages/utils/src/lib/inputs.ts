import type * as Core from '@actions/core';
import { NxArgs, splitArgsIntoNxArgsAndOverrides } from '@nrwl/workspace/src/command-line/utils';

import { debug, log, logger, warning } from './logger';

export interface BaseInputs {
  args: NxArgs;
  debug: boolean;
  workingDirectory: string;
}

export function getStringArrayInput(
  core: typeof Core,
  name: string,
  separator: string | RegExp = ' ',
  options?: Core.InputOptions
): string[] {
  return core
    .getInput(name, options)
    .split(separator)
    .filter((value) => value.length > 0)
    .map((value) => value.trim());
}

export function parseNxArgs(args: Record<string, unknown>): NxArgs {
  const parsedArgs = { ...args };
  if (parsedArgs.skipNxCache === 'false') delete parsedArgs.skipNxCache;

  if (parsedArgs.exclude) {
    parsedArgs.exclude =
      typeof parsedArgs.exclude === 'string'
        ? (parsedArgs.exclude as string).split(',')
        : (parsedArgs.exclude as string[]).reduce((acc, curr) => [...acc, ...curr.split(',')], []);
  }

  debug(`parsed args: ${JSON.stringify(parsedArgs, null, 2)}`);
  return parsedArgs;
}

export function getArgsInput(
  core: typeof Core,
  mode: Parameters<typeof splitArgsIntoNxArgsAndOverrides>[1] = 'print-affected',
  options?: Core.InputOptions
): NxArgs {
  const args = getStringArrayInput(core, 'args', /[= ]/g, options).map((arg) =>
    arg === '-c' ? '--configuration' : arg
  );
  const { nxArgs, overrides } = splitArgsIntoNxArgsAndOverrides({ _: args, $0: '' }, mode, {
    printWarnings: false,
  }) ?? { nxArgs: {}, overrides: {} };

  return parseNxArgs({ ...nxArgs, ...overrides });
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

export function getBaseInputs(
  core: typeof Core,
  mode: Parameters<typeof splitArgsIntoNxArgsAndOverrides>[1]
): BaseInputs {
  const debug = core.getBooleanInput('debug');
  const workingDirectory = core.getInput('workingDirectory');

  logger(core).debugMode = debug;

  if (workingDirectory?.length > 0) {
    log(`🏃 Working in custom directory: ${workingDirectory}`);
    process.chdir(workingDirectory);
  }

  return {
    args: getArgsInput(core, mode),
    debug,
    workingDirectory,
  };
}
