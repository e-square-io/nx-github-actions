/* eslint-disable @typescript-eslint/ban-ts-comment */
import { join } from 'path';

import {
  buildWorkspaceConfigurationFromGlobs,
  globForProjectFiles,
  resolveNewFormatWithInlineProjects,
  workspaceConfigName,
  WorkspaceJsonConfiguration,
  Workspaces as NxWorkspaces,
} from '@nrwl/tao/src/shared/workspace';
import { tree } from '@e-square/utils/fs';
import { readNxJson } from '@nrwl/workspace/src/core/file-utils';
import { readJsonFile } from '@nrwl/devkit';
import { NxJsonConfiguration } from '@nrwl/tao/src/shared/nx';
import { dirname } from '@actions/glob/lib/internal-path-helper';

export class Workspaces extends NxWorkspaces {
  constructor(private _require: typeof require) {
    super(tree.root);

    // accessing private methods and overriding them
    // @ts-ignore
    super.readGeneratorsJson = this._readGeneratorsJson.bind(this);
    // @ts-ignore
    super.readExecutorsJson = this._readExecutorsJson.bind(this);
    // @ts-ignore
    super.getImplementationFactory = this._getImplementationFactory.bind(this);
  }

  private resolveRoots(): string[] {
    return tree.root ? [tree.root, __dirname] : [__dirname];
  }

  private _readGeneratorsJson(collectionName: string, generator: string) {
    let generatorsFilePath;
    if (collectionName.endsWith('.json')) {
      generatorsFilePath = this._require.resolve(collectionName, {
        paths: this.resolveRoots(),
      });
    } else {
      const packageJsonPath = this._require.resolve(`${collectionName}/package.json`, {
        paths: this.resolveRoots(),
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

  private _readExecutorsJson(moduleName: string, executor: string) {
    const packageJsonPath = this._require.resolve(`${moduleName}/package.json`, {
      paths: this.resolveRoots(),
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

  readWorkspaceConfiguration(): WorkspaceJsonConfiguration & NxJsonConfiguration {
    const nxJsonPath = join(tree.root, 'nx.json');
    const nxJson = readNxJson(nxJsonPath);
    const workspaceFile = workspaceConfigName(tree.root);
    const workspacePath = workspaceFile ? join(tree.root, workspaceFile) : null;
    const workspace =
      workspacePath && tree.exists(workspacePath)
        ? resolveNewFormatWithInlineProjects(readJsonFile(join(tree.root, workspaceConfigName(tree.root))), tree.root)
        : buildWorkspaceConfigurationFromGlobs(nxJson, globForProjectFiles(tree.root, nxJson), (path) =>
            readJsonFile(join(tree.root, path))
          );

    return { ...workspace, ...nxJson };
  }
}

function findFullGeneratorName(
  name: string,
  generators: {
    [name: string]: { aliases?: string[] };
  }
) {
  if (generators) {
    for (const [key, data] of Object.entries<{ aliases?: string[] }>(generators)) {
      if (key === name || (data.aliases && (data.aliases as string[]).includes(name))) {
        return key;
      }
    }
  }
}
