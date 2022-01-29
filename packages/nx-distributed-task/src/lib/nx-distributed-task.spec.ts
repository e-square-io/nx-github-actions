import { restoreCache, saveCache } from '@actions/cache';

jest.mock('../../../utils/src', () => ({
  ...(jest.requireActual('../../../utils/src') as any),
  assertNxInstalled: jest.fn().mockResolvedValue(true),
  nxRunMany: jest.fn().mockResolvedValue(true),
  getWorkspaceProjects: jest.fn(),
  getProjectOutputs: jest.fn().mockReturnValue('dist/test'),
  uploadArtifact: jest.fn().mockResolvedValue('test'),
  nxPrintAffected: jest.fn().mockResolvedValue(['project1', 'project2', 'project3', 'project4']),
}));

jest.mock('@actions/cache');

import { assertNxInstalled, nxRunMany, uploadArtifact } from '../../../utils/src';
import { main } from './nx-distributed-task';

describe('nxDistributedTask', () => {
  beforeEach(() => {
    const env = {
      INPUT_TARGET: 'test',
      INPUT_BUCKET: '1',
      INPUT_NXCLOUD: 'false',
      INPUT_PROJECTS: 'project1,project2',
      INPUT_DEBUG: 'false',
      INPUT_UPLOADOUTPUTS: 'true',
    };

    process.env = { ...process.env, ...env };
  });

  it('should run nx target for projects', async () => {
    await main();

    expect(assertNxInstalled).toHaveBeenCalled();
    expect(restoreCache).toHaveBeenCalled();
    expect(nxRunMany).toHaveBeenCalledWith(
      'test',
      expect.any(Object),
      expect.objectContaining({ args: ['--projects=project1,project2'] })
    );
    expect(uploadArtifact).toHaveBeenCalledTimes(2);
    expect(uploadArtifact).toHaveBeenNthCalledWith(1, 'test', 'dist/test');
  });

  it('should save cache in post job if key is available', async () => {
    process.env = { ...process.env, [`STATE_isPostJob`]: 'true', STATE_cacheKey: 'test' };

    (saveCache as jest.Mock).mockClear();
    (assertNxInstalled as jest.Mock).mockClear();
    (nxRunMany as jest.Mock).mockClear();
    (uploadArtifact as jest.Mock).mockClear();

    await main();

    expect(saveCache).toHaveBeenCalled();
    expect(assertNxInstalled).not.toHaveBeenCalled();
    expect(nxRunMany).not.toHaveBeenCalled();
    expect(uploadArtifact).not.toHaveBeenCalled();
  });
});
