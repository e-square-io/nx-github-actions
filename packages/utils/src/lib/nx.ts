import { getState } from '@actions/core';
import { context } from '@actions/github';
import { Exec } from './exec';
import { BOUNDARIES_STATE_KEY } from './state';

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
): Promise<number> {
  const [base, head] = JSON.parse(getState(BOUNDARIES_STATE_KEY));

  const wrapper = exec
    .withCommand(command)
    .withArgs(`--target=${target}`, `--base=${base}`, `--head=${head}`, ...args)
    .build();

  return wrapper();
}

export async function runNx(
  command: string,
  target: string,
  inputs: BaseInputs,
  exec: Exec
): Promise<number> {
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
