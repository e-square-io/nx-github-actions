import { restoreCache, saveCache } from '@actions/cache';

jest.mock('../../../utils/src', () => ({
  ...jest.requireActual('../../../utils/src'),
  assertNxInstalled: jest.fn().mockResolvedValue(true),
  nxRunMany: jest.fn().mockResolvedValue(true),
  getWorkspaceProjects: jest.fn(),
  getProjectOutputs: jest.fn().mockReturnValue('dist/test'),
  uploadArtifact: jest.fn().mockResolvedValue('test'),
  nxPrintAffected: jest.fn().mockResolvedValue(['project1', 'project2', 'project3', 'project4']),
}));

jest.mock('@actions/cache');

import { assertNxInstalled, nxRunMany, uploadArtifact, withCache } from '../../../utils/src';
import { main } from './nx-distributed-task';

describe('nxDistributedTask', () => {
  beforeEach(() => {
    const env = {
      INPUT_TARGET: 'test',
      INPUT_BUCKET: '1',
      INPUT_NXCLOUD: 'false',
      INPUT_PROJECTS: 'project1,project2',
    };

    process.env = { ...process.env, ...env };
  });

  it('should run nx target for projects', async () => {
    await main();

    expect(assertNxInstalled).toHaveBeenCalled();
    expect(restoreCache).toHaveBeenCalled();
    expect(saveCache).toHaveBeenCalled();
    expect(nxRunMany).toHaveBeenCalledWith(
      'test',
      expect.any(Object),
      expect.objectContaining({ args: ['--projects=project1,project2'] })
    );
    expect(uploadArtifact).toHaveBeenCalledTimes(2);
    expect(uploadArtifact).toHaveBeenNthCalledWith(1, 'test', 'dist/test');
  });
});
