import type { context as Context } from '@actions/github';
import { getPackageManagerCommand, getPackageManagerVersion } from '@nrwl/tao/src/shared/package-manager';
import { NxArgs } from '@nrwl/workspace/src/command-line/utils';
import { names } from '@nrwl/devkit/src/utils/names';

import { Exec } from '@e-square/utils/exec';
import { debug, group, logger, warning } from '@e-square/utils/logger';

export async function assertNxInstalled(exec: Exec) {
  const command = getPackageManagerCommand().list;

  debug(`Checking existence of nx`);

  const path = await exec.withCommand(`${command} @nrwl/cli -p --depth 1`).build()();
  debug(`NX bin path: ${path}`);

  if (!path) throw new Error("Couldn't find Nx binary, Have you run npm/yarn install?");
}

export async function getNxVersion(exec: Exec): Promise<string> {
  return await exec.withCommand(`nx --version`).build()();
}

export async function nxCommand(nxCommand: string, args: NxArgs, exec: Exec): Promise<string> {
  const [nxMajorVersion] = (await getNxVersion(exec)).split('.');
  // override with-deps because it was removed in NX 14
  if (nxMajorVersion < '14' && args.withDeps) {
    warning(`with-deps was removed in NX 14. Please replace its usage with 'targetDefaults'`);
    args.withDeps = undefined;
    args['with-deps'] = undefined;
  }

  const [pmMajorVersion] = getPackageManagerVersion().split('.');
  let command = getPackageManagerCommand().exec;
  const isNpx = command === 'npx';
  const isYarn = command === 'yarn';
  if (isNpx && Number(pmMajorVersion) > 6) {
    command += ' --no';
  }
  if (isNpx || isYarn) {
    command += ` -p @nrwl/cli`;
  }

  const wrapper = exec
    .withCommand(`${command} nx ${nxCommand}`)
    .withArgs(
      ...Object.entries(args).map(([k, v]) =>
        typeof v === 'boolean' && v ? `--${names(k).fileName}` : `--${names(k).fileName}=${v}`
      )
    )
    .build();

  return wrapper();
}

export function nxRunMany(context: typeof Context, args: NxArgs, exec: Exec): Promise<string> {
  return group(`🏃 Running NX target`, async () => {
    if (args.scan) {
      const env: Record<string, string> = {};
      env.NX_RUN_GROUP = context.runId.toString();

      if (context.eventName === 'pull_request') {
        env.NX_BRANCH = context.payload.pull_request.number.toString();
      }

      exec.withOptions({ env: { ...process.env, ...env } });
    }

    if (logger().debugMode) {
      debug(`Debug mode is on, skipping target execution`);
      return Promise.resolve('[DEBUG MODE] skipping execution');
    }

    return nxCommand('run-many', args, exec);
  });
}
