import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as glob from '@actions/glob';
import * as io from '@actions/io';

import { context } from '@actions/github';
import { restoreCache, saveCache } from '@actions/cache';

import { PRIMARY_KEY } from '@e-square/utils/cache';
import { uploadArtifact } from '@e-square/utils/artifact';
import { assertNxInstalled, nxRunMany } from '@e-square/utils/nx';

import { main } from './nx-distributed-task';

jest.mock('@e-square/utils/nx');
jest.mock('@e-square/utils/artifact');
jest.mock('@e-square/utils/logger');

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
    process.env = { ...process.env, [`STATE_${PRIMARY_KEY}`]: 'test' };

    await main(context, core, exec, glob, io);

    expect(assertNxInstalled).toHaveBeenCalled();
    expect(restoreCache).toHaveBeenCalled();
    expect(saveCache).toHaveBeenCalled();
    expect(nxRunMany).toHaveBeenCalledWith(
      context,
      'test',
      expect.any(Object),
      expect.objectContaining({ args: ['--projects=project1,project2'] })
    );
    expect(uploadArtifact).toHaveBeenCalledTimes(2);
    expect(uploadArtifact).toHaveBeenNthCalledWith(1, glob, 'test', 'dist/test');
  });

  it('should exit if no projects to run', async () => {
    process.env['INPUT_PROJECTS'] = undefined;

    await main(context, core, exec, glob, io);

    expect(assertNxInstalled).not.toHaveBeenCalled();
  });

  it('should not upload artifacts', async () => {
    process.env['INPUT_UPLOADOUTPUTS'] = 'false';

    await main(context, core, exec, glob, io);

    expect(assertNxInstalled).toHaveBeenCalled();
    expect(uploadArtifact).not.toHaveBeenCalled();
  });

  it('should set job as failed if any unhandled error occurs', async () => {
    (assertNxInstalled as jest.Mock).mockRejectedValue('test');
    await main(context, core, exec, glob, io);

    expect(core.setFailed).toHaveBeenCalledWith('test');
  });
});
