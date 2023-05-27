import { saveCache, restoreCache } from '@actions/cache';
import * as core from '@actions/core';
import { context } from '@actions/github';

import { getNxCachePaths, restoreNxCache, saveNxCache } from './cache';
import { info, logger, warning } from './logger';

import { Task } from './task';

jest.mock('./logger');

describe('cache', () => {
  let task: Task;

  beforeAll(() => {
    process.env.RUNNER_OS = process.env.RUNNER_OS || process.platform;
    process.env.RUNNER_ARCH = process.env.RUNNER_ARCH || process.arch;
  });

  beforeEach(() => {
    task = {
      id: 'test:build',
      overrides: {},
      outputs: ['test'],
      target: { target: 'build', project: 'test' },
      hash: 'test',
    };
  });

  describe('restoreNxCache', () => {
    it('should restore cache with primary key and restoreKeys', async () => {
      await restoreNxCache(context, task);
      expect(restoreCache).toHaveBeenCalledWith(getNxCachePaths(task), expect.stringContaining('test'), [
        'nx-cache-test',
      ]);
    });

    it('should fail silently', async () => {
      (restoreCache as jest.Mock).mockRejectedValueOnce('');
      await restoreNxCache(context, task);

      expect(warning).toHaveBeenCalledWith('');
    });

    it('should report cache miss', async () => {
      (restoreCache as jest.Mock).mockResolvedValueOnce('');
      await restoreNxCache(context, task);

      expect(info).toHaveBeenCalledWith('Cache miss');
    });

    it('should not restore cache if in debug mode', async () => {
      logger(core).debugMode = true;

      await restoreNxCache(context, task);

      expect(restoreCache).not.toHaveBeenCalled();

      logger().debugMode = false;
    });

    it('should not restore cache if hash is missing', async () => {
      await restoreNxCache(context, { ...task, hash: undefined });

      expect(restoreCache).not.toHaveBeenCalled();
    });
  });

  describe('saveNxCache', () => {
    it('should save cache with primary key', async () => {
      await saveNxCache(context, task);
      expect(saveCache).toHaveBeenCalledWith(getNxCachePaths(task), 'nx-cache-test-0');
    });

    it('should fail silently', async () => {
      (saveCache as jest.Mock).mockRejectedValueOnce(new Error('test'));
      await expect(saveNxCache(context, task)).resolves.toBeUndefined();
    });

    it('should not save cache if in debug mode', async () => {
      logger(core).debugMode = true;

      await saveNxCache(context, task);

      expect(saveCache).not.toHaveBeenCalled();

      logger().debugMode = false;
    });

    it('should not save cache if hash is missing', async () => {
      await saveNxCache(context, { ...task, hash: undefined });

      expect(saveCache).not.toHaveBeenCalled();
    });

    it('should not save if cache hit occurred on primary key', async () => {
      await saveNxCache(context, { ...task, cacheKey: 'nx-cache-test-0' });
    });
  });
});
