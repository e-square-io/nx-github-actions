import { restoreNxCache, saveNxCache } from '@e-square/utils/cache';

import { restoreCache, saveCache } from './cache';
import { context } from '@actions/github';

jest.mock('@e-square/utils/cache');
jest.mock('@e-square/utils/logger');

describe('cache', () => {
  it('should call cache utils', async () => {
    await restoreCache(
      context,
      [
        {
          id: 'test:build',
          overrides: {},
          outputs: ['test'],
          target: { target: 'build', project: 'test' },
          hash: 'test',
        },
      ],
      {
        tasks: {},
        roots: [],
        dependencies: {},
      }
    );
    await saveCache(
      context,
      [
        {
          id: 'test:build',
          overrides: {},
          outputs: ['test'],
          target: { target: 'build', project: 'test' },
          hash: 'test',
        },
      ],
      {
        tasks: {
          'test:build': {
            id: 'test:build',
            overrides: {},
            target: { target: 'build', project: 'test' },
            hash: 'test',
          },
        },
        roots: [],
        dependencies: {},
      }
    );

    expect(saveNxCache).toHaveBeenCalled();
    expect(restoreNxCache).toHaveBeenCalled();
  });
});
