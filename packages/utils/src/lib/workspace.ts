/* eslint-disable @typescript-eslint/ban-ts-comment */
import { dirname, join } from 'path';

import {
  buildWorkspaceConfigurationFromGlobs,
  globForProjectFiles,
  resolveNewFormatWithInlineProjects,
  workspaceConfigName,
  Workspaces as NxWorkspaces,
} from '@nrwl/tao/src/shared/workspace';
import { NxJsonConfiguration } from '@nrwl/tao/src/shared/nx';
import {
  readJsonFile,
  readProjectConfiguration,
  readWorkspaceConfiguration,
  WorkspaceJsonConfiguration,
} from '@nrwl/devkit';

import { tree } from './fs';
import type { Task } from './task';
import type { NxPlugin } from '@nrwl/devkit';
import { readNxJson } from 'nx/src/generators/utils/project-configuration';
import { mergeNpmScriptsWithTargets } from 'nx/src/utils/project-graph-utils';
import { mergePluginTargetsWithNxTargets } from 'nx/src/utils/nx-plugin';

function findFullGeneratorName(
  name: string,
  generators: {
    [name: string]: { aliases?: string[] };
  }
): string | void {
  if (generators) {
    for (const [key, data] of Object.entries<{ aliases?: string[] }>(generators)) {
      if (key === name || (data.aliases && (data.aliases as string[]).includes(name))) {
        return key;
      }
    }
  }
}

function resolveRoots(): string[] {
  return tree.root ? [tree.root, __dirname] : [__dirname];
}

export class Workspaces extends NxWorkspaces {
  constructor(public readonly _require: typeof require) {
    super(tree.root);

    // accessing private methods and overriding them
    // @ts-ignore
    super.readGeneratorsJson = this._readGeneratorsJson.bind(this);
    // @ts-ignore
    super.readExecutorsJson = this._readExecutorsJson.bind(this);
    // @ts-ignore
    super.getImplementationFactory = this._getImplementationFactory.bind(this);
  }

  private _readGeneratorsJson(
    collectionName: string,
    generator: string
  ): { generatorsFilePath: string; generatorsJson: any; normalizedGeneratorName: string } | void {
    let generatorsFilePath: string;
    if (!collectionName) return;
    if (collectionName.endsWith('.json')) {
      generatorsFilePath = this._require.resolve(collectionName, {
        paths: resolveRoots(),
      });
    } else {
      const packageJsonPath = this._require.resolve(`${collectionName}/package.json`, {
        paths: resolveRoots(),
      });
      const packageJson = readJsonFile(packageJsonPath);
      const generatorsFile = packageJson.generators ?? packageJson.schematics;

      if (!generatorsFile) {
        throw new Error(`The "${collectionName}" package does not support Nx generators.`);
      }

      generatorsFilePath = this._require.resolve(join(dirname(packageJsonPath), generatorsFile));
    }
    const generatorsJson = readJsonFile(generatorsFilePath);

    const normalizedGeneratorName =
      findFullGeneratorName(generator, generatorsJson.generators) ||
      findFullGeneratorName(generator, generatorsJson.schematics);

    if (!normalizedGeneratorName) {
      for (const parent of generatorsJson.extends || []) {
        try {
          return this._readGeneratorsJson(parent, generator);
          // eslint-disable-next-line no-empty
        } catch (e) {}
      }

      throw new Error(`Cannot find generator '${generator}' in ${generatorsFilePath}.`);
    }

    return { generatorsFilePath, generatorsJson, normalizedGeneratorName };
  }

  private _readExecutorsJson(
    moduleName: string,
    executor: string
  ): {
    executorsFilePath: string;
    executorConfig: {
      implementation: string;
      batchImplementation?: string;
      schema: string;
      hasher?: string;
    };
  } {
    const packageJsonPath = this._require.resolve(`${moduleName}/package.json`, {
      paths: resolveRoots(),
    });
    const packageJson = readJsonFile(packageJsonPath);
    const executorsFile = packageJson.executors ?? packageJson.builders;

    if (!executorsFile) {
      throw new Error(`The "${moduleName}" package does not support Nx executors.`);
    }

    const executorsFilePath = this._require.resolve(join(dirname(packageJsonPath), executorsFile));
    const executorsJson = readJsonFile(executorsFilePath);
    const executorConfig: {
      implementation: string;
      batchImplementation?: string;
      schema: string;
      hasher?: string;
    } = executorsJson.executors?.[executor] || executorsJson.builders?.[executor];
    if (!executorConfig) {
      throw new Error(`Cannot find executor '${executor}' in ${executorsFilePath}.`);
    }
    return { executorsFilePath, executorConfig };
  }

  private _getImplementationFactory(impl: string, dir: string) {
    const [implementationModulePath, implementationExportName] = impl.split('#');
    return () => {
      const module = this._require(join(dir, implementationModulePath));
      return module[implementationExportName || 'default'];
    };
  }

  override readWorkspaceConfiguration(): WorkspaceJsonConfiguration & NxJsonConfiguration {
    // const nxJsonPath = join(tree.root, 'nx.json');
    const nxJson = readNxJson(tree) ?? {};
    const workspaceFile = workspaceConfigName(tree.root);
    const workspacePath = workspaceFile ? join(tree.root, workspaceFile) : null;
    const workspace =
      workspacePath && tree.exists(workspacePath)
        ? resolveNewFormatWithInlineProjects(
            readJsonFile(join(tree.root, workspaceConfigName(tree.root) ?? '')),
            tree.root
          )
        : buildWorkspaceConfigurationFromGlobs(nxJson, globForProjectFiles(tree.root, nxJson), (path) =>
            readJsonFile(join(tree.root, path))
          );
    // const workspace = readWorkspaceConfiguration(tree);
    // const projects = getProjects(tree);

    return {
      ...workspace,
      ...nxJson,
      // npmScope: workspace.npmScope ?? '',
      // projects: Object.fromEntries(projects.entries()),
    };
  }
}

function findPluginPackageJson(path: string, plugin: string) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (!path.startsWith(tree.root)) {
      throw new Error("Couldn't find a package.json for Nx plugin:" + plugin);
    }
    if (tree.exists(join(path, 'package.json'))) {
      return join(path, 'package.json');
    }
    path = dirname(path);
  }
}

let nxPluginCache: NxPlugin[];

export function loadNxPlugins(plugins: string[] = [], _require: typeof require): NxPlugin[] {
  return plugins.length
    ? nxPluginCache ||
        (nxPluginCache = plugins.map((path) => {
          const pluginPath = _require.resolve(path, {
            paths: resolveRoots(),
          });

          const { name } = readJsonFile(findPluginPackageJson(pluginPath, path));
          const plugin = _require(pluginPath) as NxPlugin;
          plugin.name = name;

          return plugin;
        }))
    : [];
}

export function getExecutorNameForTask(task: Task, _require: typeof require) {
  const workspaceConfiguration = readWorkspaceConfiguration(tree);
  const project = readProjectConfiguration(tree, task.target.project);

  if (tree.exists(join(project.root, 'package.json'))) {
    project.targets = mergeNpmScriptsWithTargets(join(tree.root, project.root), project.targets);
  }
  project.targets = mergePluginTargetsWithNxTargets(
    join(tree.root, project.root),
    project.targets ?? {},
    loadNxPlugins(workspaceConfiguration.plugins, _require)
  );

  if (!project.targets[task.target.target]) {
    throw new Error(`Cannot find configuration for task ${task.target.project}:${task.target.target}`);
  }

  return project.targets[task.target.target].executor;
}

export function getExecutorForTask(task: Task, workspace: Workspaces) {
  const executor = getExecutorNameForTask(task, workspace._require);
  const [nodeModule, executorName] = executor.split(':');

  return workspace.readExecutor(nodeModule, executorName);
}
