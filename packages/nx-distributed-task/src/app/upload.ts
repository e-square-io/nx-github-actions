import type { ProjectGraphProjectNode } from '@nrwl/devkit';
import { tree } from '@e-square/utils/fs';
import { createTask } from '@nrwl/workspace/src/tasks-runner/run-command';
import * as Glob from '@actions/glob';
import { Inputs } from './inputs';
import { group } from '@e-square/utils/logger';
import { uploadArtifact } from '@e-square/utils/artifact';
import { getOutputsForTargetAndConfiguration } from '@nrwl/workspace/src/tasks-runner/utils';
import { readProjectConfiguration } from '@nrwl/devkit/src/generators/project-configuration';

export function getProjectOutputs(project: string, target: string, configuration?: string): string[] {
  const config = readProjectConfiguration(tree, project);
  const projectNode: ProjectGraphProjectNode = {
    name: config.name,
    type: config.projectType === 'application' ? (config.name.endsWith('-e2e') ? 'e2e' : 'app') : 'lib',
    data: {
      ...config,
    },
  };

  const task = createTask({
    project: projectNode,
    target,
    configuration,
    overrides: {},
    errorIfCannotFindConfiguration: false,
  });

  return [...getOutputsForTargetAndConfiguration(task, projectNode)].filter(
    (path) => path !== 'undefined' && path.length > 0
  );
}

export function uploadProjectsOutputs(glob: typeof Glob, inputs: Inputs): Promise<void> {
  if (!inputs.uploadOutputs) return;

  return group('⬆️ Uploading artifacts', async () => {
    const artifactName = inputs.target;
    const configuration = inputs.args.find((arg) => arg.search(/-c/))?.split('=')?.[1];

    await Promise.all(
      inputs.projects.map((project) =>
        uploadArtifact(glob, artifactName, getProjectOutputs(project, inputs.target, configuration))
      )
    );
  });
}
