import * as glob from '@actions/glob';

import { uploadProjectsOutputs } from './upload';
import { uploadArtifact } from '@e-square/utils/artifact';

jest.mock('@e-square/utils/artifact');
jest.mock('@e-square/utils/logger');

describe('upload', () => {
  describe('uploadProjectsOutputs', () => {
    it('should skip upload if uploadOutputs is false', async () => {
      await uploadProjectsOutputs(glob, []);

      expect(uploadArtifact).not.toHaveBeenCalled();
    });

    it('should call the uploader per each task', async () => {
      await uploadProjectsOutputs(
        glob,
        [
          { id: 'test:build', overrides: {}, outputs: ['test'], target: { target: 'build', project: 'test' } },
          { id: 'test:build', overrides: {}, outputs: ['test'], target: { target: 'build', project: 'test' } },
        ],
        true
      );

      expect(uploadArtifact).toHaveBeenNthCalledWith(1, glob, 'build', ['test']);
      expect(uploadArtifact).toHaveBeenNthCalledWith(2, glob, 'build', ['test']);
    });
  });
});
