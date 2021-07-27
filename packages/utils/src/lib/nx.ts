import { context } from '@actions/github';
import { Exec } from './exec';
import * as which from 'which';
import { debug, getInput, InputOptions, warning } from '@actions/core';
import type { ProjectConfiguration } from '@nrwl/devkit';
import { tree } from './fs';

export const NX_BIN_PATH = 'node_modules/.bin/nx';

export interface BaseInputs {
  nxCloud?: boolean;
  args?: string[];
}

export type BaseInputsWithParallel = { maxParallel: number } & BaseInputs;

export interface WorkspaceJsonConfiguration {
  projects: Record<string, ProjectConfiguration | string>;
}

export type WorkspaceProjects = Record<string, ProjectConfiguration>;

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

export function getWorkspaceProjects(): WorkspaceProjects {
  const workspaceFile = tree.exists('angular.json') ? 'angular.json' : 'workspace.json';
  debug(`🐞 Found ${workspaceFile} as nx workspace`);

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
      warning(
        new Error(
          `Couldn't find output value for ${project}. full path: project.${project}.targets.${target}.${scope}.${prop}`
        )
      );
      return '';
    }

    return projectTarget?.[scope]?.[prop] ?? '';
  };

  const resolvedOutputs = outputs.map(replaceExpressions);
  debug(`🐞 Found ${resolvedOutputs} as outputs for ${target}`);

  return resolvedOutputs;
}

export async function assertNxInstalled() {
  try {
    debug(`🐞 Checking existence of nx`);

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
  debug(`🐞 Affected project for ${target}: ${projects}`);

  return projects.split(', ');
}

export async function nxRunMany(target: string, inputs: BaseInputsWithParallel, exec: Exec): Promise<string> {
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

  return nxCommand('run-many', target, exec, args);
}
