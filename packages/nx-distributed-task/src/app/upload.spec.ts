import * as glob from '@actions/glob';

import { getProjectOutputs, uploadProjectsOutputs } from './upload';
import { uploadArtifact } from '@e-square/utils/artifact';
import { Inputs } from './inputs';

jest.mock('@e-square/utils/artifact');
jest.mock('@e-square/utils/logger');
jest.mock('@nrwl/devkit/src/generators/project-configuration', () => ({
  readProjectConfiguration: jest.fn().mockReturnValue({
    name: 'test',
    root: 'packages/nx-distributed-task',
    sourceRoot: 'packages/nx-distributed-task/src',
    projectType: 'application',
    targets: {
      build: {
        outputs: ['{options.outputPath}'],
        options: {
          outputPath: 'test',
        },
      },
      lint: {
        executor: '@nrwl/linter:eslint',
        outputs: ['{options.outputFile}'],
      },
    },
    tags: [],
  }),
}));

describe('upload', () => {
  describe('getProjectOutputs', () => {
    it('should get the resolved outputs paths of a project', () => {
      expect(getProjectOutputs('test', 'build')).toEqual(['test']);
    });

    it('should not return if the path was not resolved', () => {
      expect(getProjectOutputs('test', 'lint')).toEqual([]);
    });
  });

  describe('uploadProjectsOutputs', () => {
    let inputs: Inputs;

    beforeEach(() => {
      inputs = {
        target: 'build',
        projects: ['test', 'test2'],
        nxCloud: false,
        uploadOutputs: true,
        args: [],
        debug: false,
        distribution: 1,
        maxParallel: 1,
        workingDirectory: '',
      };
    });

    it('should skip upload if uploadOutputs is false', async () => {
      inputs.uploadOutputs = false;
      await uploadProjectsOutputs(glob, inputs);

      expect(uploadArtifact).not.toHaveBeenCalled();
    });

    it('should call the uploader per each project', async () => {
      await uploadProjectsOutputs(glob, inputs);

      expect(uploadArtifact).toHaveBeenNthCalledWith(1, glob, 'build', ['test']);
      expect(uploadArtifact).toHaveBeenNthCalledWith(2, glob, 'build', ['test']);
    });
  });
});
