import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as glob from '@actions/glob';
import { context } from '@actions/github';

import * as cache from '@e-square/utils/cache';

import { assertNxInstalled, nxRunMany } from './app/nx';
import { restoreCache, saveCache } from './app/cache';
import { uploadProjectsOutputs } from './app/upload';
import main from './main';

jest.mock('./app/nx');
jest.mock('./app/upload');
jest.mock('./app/cache');
jest.mock('@e-square/utils/logger');

describe('main', () => {
  beforeEach(() => {
    const env = {
      INPUT_TARGET: 'test',
      INPUT_DISTRIBUTION: '1',
      INPUT_NXCLOUD: 'false',
      INPUT_PROJECTS: 'project1,project2',
      INPUT_DEBUG: 'false',
      INPUT_UPLOADOUTPUTS: 'true',
    };

    process.env = { ...process.env, ...env };
  });

  it('should run nx target for projects', async () => {
    jest.spyOn(cache, 'getCacheKeys').mockReturnValue(['test', ['test']]);

    await main(context, core, exec, glob);

    expect(assertNxInstalled).toHaveBeenCalled();
    expect(restoreCache).toHaveBeenCalled();
    expect(nxRunMany).toHaveBeenCalledWith(
      context,
      expect.objectContaining({ target: 'test', projects: ['project1', 'project2'] }),
      expect.objectContaining({ exec: exec.exec })
    );
    expect(uploadProjectsOutputs).toHaveBeenCalled();
    expect(saveCache).toHaveBeenCalled();
  });

  it('should exit if no projects to run', async () => {
    process.env['INPUT_PROJECTS'] = undefined;

    await main(context, core, exec, glob);

    expect(assertNxInstalled).not.toHaveBeenCalled();
  });

  it('should set job as failed if any unhandled error occurs', async () => {
    (assertNxInstalled as jest.Mock).mockRejectedValue('test');
    await main(context, core, exec, glob);

    expect(core.setFailed).toHaveBeenCalledWith('test');
  });
});
