import { context } from '@actions/github';
import { Exec } from './exec';
import { retrieveGitBoundaries } from './git';
import * as which from 'which';
import { debug } from '@actions/core';

export interface BaseInputs {
  targets: string[];
  maxParallel: number;
  nxCloud?: boolean;
  args?: string[];
}

export async function runNxCommand(
  command: string,
  target: string,
  exec: Exec,
  args: string[]
): Promise<string> {
  const [base, head] = await retrieveGitBoundaries(exec);
  let binPath = '';

  try {
    debug(`🐞 Checking existence of nx`);
    binPath = `${await which('node_modules/.bin/nx')}`;
  } catch {
    throw new Error("Couldn't find Nx binary, Have you run npm/yarn install?");
  }

  const wrapper = exec
    .withCommand(`${binPath} ${command}`)
    .withArgs(`--target=${target}`, ...args)
    .build();

  return wrapper();
}

export async function runNx(
  command: string,
  target: string,
  inputs: BaseInputs,
  exec: Exec
): Promise<string> {
  const args = inputs.args ?? [];

  if (inputs.nxCloud) {
    args.push('--scan');
    const env: Record<string, string> = {};
    env.NX_RUN_GROUP = context.runId.toString();

    if (context.eventName === 'pull_request') {
      env.NX_BRANCH = context.payload.pull_request.number.toString();
    }

    exec.withOptions({ env });
  }

  args.push('--parallel', `--maxParallel=${inputs.maxParallel}`);

  return runNxCommand(command, target, exec, args);
}
