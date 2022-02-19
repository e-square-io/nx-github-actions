import * as which from 'which';

import { context } from '@actions/github';
import type { ProjectConfiguration } from '@nrwl/devkit';

import { Exec } from './exec';
import { BaseInputs } from './inputs';
import { tree } from './fs';
import { logger } from './logger';

export const NX_BIN_PATH = 'node_modules/.bin/nx';

export interface WorkspaceJsonConfiguration {
  projects: Record<string, ProjectConfiguration | string>;
}

export type WorkspaceProjects = Record<string, ProjectConfiguration>;

export function getWorkspaceProjects(): WorkspaceProjects {
  const workspaceFile = tree.exists('angular.json') ? 'angular.json' : 'workspace.json';
  logger.debug(`Found ${workspaceFile} as nx workspace`);

  const workspaceContent: WorkspaceJsonConfiguration = JSON.parse(
    tree
      .read(workspaceFile)
      .toString()
      .replace(/architect/g, 'targets')
  );

  const projectKeys = Object.keys(workspaceContent.projects || {});
  const projects: WorkspaceProjects = {};

  for (const key of projectKeys) {
    const project = workspaceContent.projects[key];
    if (typeof project === 'string') {
      projects[key] = JSON.parse(
        tree
          .read(`${project}/project.json`)
          .toString()
          .replace(/architect/g, 'targets')
      );
    } else {
      projects[key] = project;
    }
  }

  return projects;
}

export function getProjectOutputs(projects: WorkspaceProjects, project: string, target: string): string[] {
  const projectTarget = projects[project].targets[target];
  const outputs = projectTarget.outputs ?? [];

  const replaceExpressions = (path: string) => {
    if (!path.includes('{') || !path.includes('}')) return path;

    const [scope, prop] = path.replace(/[{}]/g, '').split('.');

    if (!projectTarget?.[scope]?.[prop]) {
      logger.warning(
        new Error(
          `Couldn't find output value for ${project}. full path: project.${project}.targets.${target}.${scope}.${prop}`
        )
      );
      return '';
    }

    return projectTarget?.[scope]?.[prop] ?? '';
  };

  const resolvedOutputs = outputs.map(replaceExpressions);
  logger.debug(`Found ${resolvedOutputs} as outputs for ${target}`);

  return resolvedOutputs;
}

export async function assertNxInstalled() {
  try {
    logger.debug(`Checking existence of nx`);

    await which(NX_BIN_PATH);
  } catch {
    throw new Error("Couldn't find Nx binary, Have you run npm/yarn install?");
  }
}

export async function nxCommand(command: string, target: string, exec: Exec, args: string[]): Promise<string> {
  const wrapper = exec
    .withCommand(`${NX_BIN_PATH} ${command}`)
    .withArgs(`--target=${target}`, ...args)
    .build();

  return wrapper();
}

export async function nxPrintAffected(target: string, exec: Exec): Promise<string[]> {
  const projects = (await nxCommand('print-affected', target, exec, ['--select=tasks.target.project'])).trim();
  logger.debug(`Affected project for ${target}: ${projects}`);

  return projects.split(', ');
}

export async function nxRunMany(
  target: string,
  inputs: BaseInputs & { nxCloud?: boolean; maxParallel?: number },
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

  args.push('--parallel', `--maxParallel=${inputs.maxParallel || 3}`);

  if (logger.debugMode) {
    logger.debug(`Debug mode is on, skipping target execution`);
    return Promise.resolve('[DEBUG MODE] skipping execution');
  }

  return nxCommand('run-many', target, exec, args);
}
