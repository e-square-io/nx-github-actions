import { context } from '@actions/github';
import { Exec } from './exec';
import * as which from 'which';
import { debug } from '@actions/core';
import type { WorkspaceJsonConfiguration } from '@nrwl/devkit';
import { tree } from './fs';

export const NX_BIN_PATH = 'node_modules/.bin/nx';

export interface BaseInputs {
  maxParallel: number;
  nxCloud?: boolean;
  args?: string[];
}

export type WorkspaceProjects = WorkspaceJsonConfiguration['projects'];

export function getWorkspaceProjects(): WorkspaceProjects {
  const workspaceFile = tree.exists('angular.json')
    ? 'angular.json'
    : 'workspace.json';
  debug(`🐞 Found ${workspaceFile} as nx workspace`);

  const workspaceContent: WorkspaceJsonConfiguration = JSON.parse(
    tree
      .read(workspaceFile)
      .toString()
      .replace(/architect/g, 'targets')
  );

  return workspaceContent.projects;
}

export function getProjectOutputs(
  projects: WorkspaceProjects,
  project: string,
  target: string
): string[] {
  const projectTarget = projects[project].targets[target];
  let outputs = projectTarget.outputs ?? [];

  const replaceExpressions = (path: string) => {
    if (!path.includes('{') || !path.includes('}')) return path;

    const [scope, prop] = path.replace(/[{}]/g, '').split('.');
    return projectTarget?.[scope]?.[prop] ?? '';
  };

  outputs = outputs.map(replaceExpressions);

  debug(`🐞 Found ${outputs} as outputs for ${target}`);

  return outputs;
}

export async function assertNxInstalled() {
  try {
    debug(`🐞 Checking existence of nx`);
    await which(NX_BIN_PATH);
  } catch {
    throw new Error("Couldn't find Nx binary, Have you run npm/yarn install?");
  }
}

export async function nxCommand(
  command: string,
  target: string,
  exec: Exec,
  args: string[]
): Promise<string> {
  const wrapper = exec
    .withCommand(`${NX_BIN_PATH} ${command}`)
    .withArgs(`--target=${target}`, ...args)
    .build();

  return wrapper();
}

export async function nxPrintAffected(
  target: string,
  exec: Exec
): Promise<string[]> {
  const projects = (
    await nxCommand('print-affected', target, exec, [
      '--select=tasks.target.project',
    ])
  ).trim();

  debug(`🐞 Affected project for ${target}: ${projects}`);

  return projects.split(', ');
}

export async function nxRunMany(
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

    exec.withOptions({ env: { ...process.env, ...env } });
  }

  args.push('--parallel', `--maxParallel=${inputs.maxParallel}`);

  return nxCommand('run-many', target, exec, args);
}
