import * as core from '@actions/core';
import * as glob from '@actions/glob';

import { restoreNxCache, saveNxCache } from '@e-square/utils/cache';

import { Inputs } from './inputs';
import { restoreCache, saveCache } from './cache';
import { context } from '@actions/github';

jest.mock('@e-square/utils/cache');

describe('cache', () => {
  it('should not use cache if nx cloud is used', async () => {
    await restoreCache(context, glob, core, { target: 'build', distribution: 1, nxCloud: true } as Inputs);
    await saveCache(core, { nxCloud: true } as Inputs);

    expect(saveNxCache).not.toHaveBeenCalled();
    expect(restoreNxCache).not.toHaveBeenCalled();
  });
});
