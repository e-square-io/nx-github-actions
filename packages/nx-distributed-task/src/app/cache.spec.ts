import * as glob from '@actions/glob';

import { restoreNxCache, saveNxCache } from '@e-square/utils/cache';

import { Inputs } from './inputs';
import { restoreCache, saveCache } from './cache';
import { context } from '@actions/github';

jest.mock('@e-square/utils/cache');
jest.mock('@e-square/utils/logger');

describe('cache', () => {
  it('should not use cache if nx cloud is used', async () => {
    await restoreCache(context, undefined, true);
    await saveCache(context, undefined, true);

    expect(saveNxCache).not.toHaveBeenCalled();
    expect(restoreNxCache).not.toHaveBeenCalled();
  });

  it('should call cache utils', async () => {
    await restoreCache(context, [{ value: 'test', details: {} as any }], false);
    await saveCache(context, [{ value: 'test', details: {} as any }], false);

    expect(saveNxCache).toHaveBeenCalled();
    expect(restoreNxCache).toHaveBeenCalled();
  });
});
