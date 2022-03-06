import * as _Exec from '@actions/exec';
import type { context as Context } from '@actions/github';
import { getPackageManagerCommand, getPackageManagerVersion } from '@nrwl/tao/src/shared/package-manager';
import { NxArgs } from '@nrwl/workspace/src/command-line/utils';
import { names } from '@nrwl/devkit/src/utils/names';

import { Exec } from '@e-square/utils/exec';
import { BaseInputs } from '@e-square/utils/inputs';
import { debug, group, logger } from '@e-square/utils/logger';

import { Inputs } from './inputs';

export async function assertNxInstalled(exec: Exec) {
  debug(`Checking existence of nx`);

  const path = await exec.withCommand('npm ls @nrwl/cli -p --depth 1').build()();
  debug(`NX bin path: ${path}`);

  if (!path) throw new Error("Couldn't find Nx binary, Have you run npm/yarn install?");
}

export async function nxCommand(nxCommand: string, target: string, exec: Exec, args: NxArgs): Promise<string> {
  const pmVersion = getPackageManagerVersion().split('.');
  let command = getPackageManagerCommand().exec;
  if (command === 'npx' && Number(pmVersion[0]) > 6) command += ' --no';

  const wrapper = exec
    .withCommand(`${command} -p @nrwl/cli nx ${nxCommand}`)
    .withArgs(
      `--target=${target}`,
      ...Object.entries(args).map(([k, v]) =>
        typeof v === 'boolean' && v ? `--${names(k).fileName}` : `--${names(k).fileName}=${v}`
      )
    )
    .build();

  return wrapper();
}

export async function nxRunMany(
  context: typeof Context,
  target: string,
  inputs: BaseInputs & { nxCloud?: boolean; maxParallel?: number },
  exec: Exec
): Promise<string> {
  const args = inputs.args;

  if (inputs.nxCloud) {
    args.scan = true;
    const env: Record<string, string> = {};
    env.NX_RUN_GROUP = context.runId.toString();

    if (context.eventName === 'pull_request') {
      env.NX_BRANCH = context.payload.pull_request.number.toString();
    }

    exec.withOptions({ env: { ...process.env, ...env } });
  }

  args.parallel = inputs.maxParallel || 3;

  if (logger().debugMode) {
    debug(`Debug mode is on, skipping target execution`);
    return Promise.resolve('[DEBUG MODE] skipping execution');
  }

  return nxCommand('run-many', target, exec, args);
}

export function runNxTask(context: typeof Context, exec: typeof _Exec, inputs: Inputs): Promise<void> {
  return group('🏃 Running NX target', async () => {
    const _exec = new Exec(exec.exec);
    _exec.withArgs(`--projects=${inputs.projects}`);
    await nxRunMany(context, inputs.target, inputs, _exec);
  });
}
