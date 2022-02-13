import { restoreCache, saveCache } from '@actions/cache';
import { logger } from '../../../utils/src/lib/__mocks__/logger';

jest.mock('@e-square/utils', () => ({
  ...(jest.requireActual('@e-square/utils') as any),
  assertNxInstalled: jest.fn().mockResolvedValue(true),
  nxRunMany: jest.fn().mockResolvedValue(true),
  getWorkspaceProjects: jest.fn(),
  getProjectOutputs: jest.fn().mockReturnValue('dist/test'),
  uploadArtifact: jest.fn().mockResolvedValue('test'),
  nxPrintAffected: jest.fn().mockResolvedValue(['project1', 'project2', 'project3', 'project4']),
  logger,
}));

jest.mock('@actions/cache');

import { assertNxInstalled, nxRunMany, PRIMARY_KEY, uploadArtifact } from '@e-square/utils';
import { main } from './nx-distributed-task';
import * as core from '@actions/core';

describe('nxDistributedTask', () => {
  beforeEach(() => {
    jest.clearAllMocks();

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

  it('should exit if no projects to run', async () => {
    process.env['INPUT_PROJECTS'] = undefined;

    await main();

    expect(assertNxInstalled).not.toHaveBeenCalled();
  });

  it('should not upload artifacts', async () => {
    process.env['INPUT_UPLOADOUTPUTS'] = 'false';

    await main();

    expect(assertNxInstalled).toHaveBeenCalled();
    expect(uploadArtifact).not.toHaveBeenCalled();
  });

  it('should set job as failed if any unhandled error occurs', async () => {
    (assertNxInstalled as jest.Mock).mockRejectedValue('test');
    const spy = jest.spyOn(core, 'setFailed');
    await main();

    expect(spy).toHaveBeenCalledWith('test');
  });

  describe('post job', () => {
    it('should save cache if key is available', async () => {
      process.env = { ...process.env, [`STATE_isPostJob`]: 'true', [`STATE_${PRIMARY_KEY}`]: 'test' };

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
});
