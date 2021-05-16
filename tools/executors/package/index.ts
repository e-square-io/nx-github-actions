import { ExecutorContext, logger, ProjectGraph } from '@nrwl/devkit';
import { exec } from 'child_process';
import { existsSync, copyFileSync } from 'fs';
import { createPackageJson } from '@nrwl/workspace/src/utilities/create-package-json';
import { BuildBuilderOptions } from '@nrwl/node/src/utils/types';
import { writeJsonFile } from '@nrwl/workspace/src/utilities/fileutils';
import { basename, resolve } from 'path';
import { createProjectGraph } from '@nrwl/workspace/src/core/project-graph';

export interface GHActionPackageBuilderOptions {
  actionPath: string;
  main: string;
  outputPath: string;
  watch: boolean;
  sourceMap: boolean;
}

export type NormalizedOptions = GHActionPackageBuilderOptions &
  BuildBuilderOptions;

function normalizeOptions(
  opts: GHActionPackageBuilderOptions,
  context: ExecutorContext
): NormalizedOptions {
  return {
    ...opts,
    fileReplacements: [],
    root: context.root,
    sourceRoot: resolve(context.root, 'src'),
    projectRoot: context.root,
    tsConfig: resolve(context.root, 'tsconfig.lib.ts'),
    main: resolve(opts.main),
    actionPath: resolve(opts.actionPath),
    outputPath: resolve(opts.outputPath),
  };
}

export function generatePackageJson(
  projectName: string,
  graph: ProjectGraph,
  options: NormalizedOptions
) {
  const packageJson = createPackageJson(projectName, graph, options);
  packageJson.main = `./src/${basename(options.main, 'js')}`;
  delete packageJson.devDependencies;
  writeJsonFile(`${options.outputPath}/package.json`, packageJson);
  logger.info(`Done writing package.json to dist`);
}

function copyActionYaml(opts: NormalizedOptions) {
  if (existsSync(opts.actionPath) && existsSync(opts.outputPath)) {
    copyFileSync(opts.actionPath, `${opts.outputPath}/action.yml`);
    logger.info(`Done copying action.yml to ${opts.outputPath}`);
  }
}

async function runNccCommand(
  opts: NormalizedOptions
): Promise<{ success: boolean }> {
  const args = [`-o ${opts.outputPath}/src`];
  if (opts.watch) {
    args.push(`-w`);
  }
  if (opts.sourceMap) {
    args.push(`-s --no-source-map-register`);
  }

  const pack = exec(`npx ncc build ${opts.main} ${args.join(' ')}`);
  const processExitListener = () => pack.kill();
  process.on('exit', processExitListener);
  process.on('SIGTERM', processExitListener);
  pack.stdout.on('data', (chunk) => {
    logger.info(chunk);
  });
  pack.stderr.on('data', (chunk) => {
    logger.fatal(chunk);
  });

  return new Promise<{ success: boolean }>((res) => {
    pack.on('exit', (code) => {
      if (code == 0) {
        res({ success: true });
      } else {
        res({ success: false });
      }
    });
  });
}

async function* packageExecutor(
  options: GHActionPackageBuilderOptions,
  context: ExecutorContext
) {
  const opts = normalizeOptions(options, context);

  logger.info(JSON.stringify(opts));

  try {
    const promise = runNccCommand(opts);

    copyActionYaml(opts);
    generatePackageJson(context.projectName, createProjectGraph(), opts);

    yield { success: true };
    return promise;
  } catch (e) {
    logger.error(e);
    yield { success: false };
  }
}

export default packageExecutor;
