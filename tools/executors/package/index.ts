import { ExecutorContext, logger, ProjectGraph } from '@nrwl/devkit';
import { exec } from 'child_process';
import { createPackageJson } from '@nrwl/workspace/src/utilities/create-package-json';
import { BuildBuilderOptions } from '@nrwl/node/src/utils/types';
import { writeJsonFile } from '@nrwl/workspace/src/utilities/fileutils';
import { basename, resolve } from 'path';
import { createProjectGraph } from '@nrwl/workspace/src/core/project-graph';
import {
  AssetGlob,
  assetGlobsToFiles,
  copyAssetFiles,
} from '@nrwl/workspace/src/utilities/assets';

export interface GHActionPackageBuilderOptions {
  actionPath: string;
  main: string;
  outputPath: string;
  watch: boolean;
  sourceMap: boolean;
  assets: (string | AssetGlob)[];
}

function normalizeOptions(
  opts: GHActionPackageBuilderOptions,
  context: ExecutorContext
): BuildBuilderOptions {
  const projectRoot = resolve(
    context.workspace.projects[context.projectName].root
  );
  return {
    ...opts,
    fileReplacements: [],
    assets: [...(opts.assets ?? []), opts.actionPath],
    root: resolve(context.root),
    projectRoot,
    sourceRoot: resolve(projectRoot, 'src'),
    tsConfig: resolve(projectRoot, 'tsconfig.lib.ts'),
    main: resolve(opts.main),
    outputPath: resolve(opts.outputPath),
  };
}

export function generatePackageJson(
  projectName: string,
  graph: ProjectGraph,
  options: BuildBuilderOptions
) {
  const packageJson = createPackageJson(projectName, graph, options);
  packageJson.main = `./${basename(options.main, '.ts')}.js`;
  delete packageJson.devDependencies;
  writeJsonFile(`${options.outputPath}/package.json`, packageJson);
  logger.info(`Done writing package.json to dist`);
}

async function runNccCommand(
  opts: BuildBuilderOptions
): Promise<{ success: boolean }> {
  const args = [`-o ${opts.outputPath}`];
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

  try {
    const promise = runNccCommand(opts);

    await copyAssetFiles(
      assetGlobsToFiles(opts.assets, opts.root, opts.outputPath)
    );
    generatePackageJson(context.projectName, createProjectGraph(), opts);

    yield { success: true };
    return promise;
  } catch (e) {
    logger.error(e);
    yield { success: false };
  }
}

export default packageExecutor;
