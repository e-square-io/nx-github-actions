import { resolve } from 'path';

import { saveCache, restoreCache, ReserveCacheError } from '@actions/cache';
import * as core from '@actions/core';
import { context } from '@actions/github';

import { NX_CACHE_PATH, restoreNxCache, saveNxCache } from './cache';
import { info, logger, warning } from './logger';

jest.mock('./logger');

describe('cache', () => {
  beforeAll(() => {
    process.env.RUNNER_OS = process.env.RUNNER_OS || process.platform;
    process.env.RUNNER_ARCH = process.env.RUNNER_ARCH || process.arch;
  });

  describe('restoreNxCache', () => {
    it('should restore cache with primary key and restoreKeys', async () => {
      await restoreNxCache(context, 'test');
      expect(restoreCache).toHaveBeenCalledWith([resolve(`${NX_CACHE_PATH}/test`)], expect.stringContaining('test'), [
        'nx-cache-test',
      ]);
    });

    it('should fail silently', async () => {
      (restoreCache as jest.Mock).mockRejectedValueOnce('');
      await restoreNxCache(context, 'test');

      expect(warning).toHaveBeenCalledWith('');
    });

    it('should report cache miss', async () => {
      (restoreCache as jest.Mock).mockResolvedValueOnce('');
      await restoreNxCache(context, 'test');

      expect(info).toHaveBeenCalledWith('Cache miss');
    });

    it('should not restore cache if in debug mode', async () => {
      logger(core).debugMode = true;

      await restoreNxCache(context, 'test');

      expect(restoreCache).not.toHaveBeenCalled();

      logger().debugMode = false;
    });
  });

  describe('saveNxCache', () => {
    it('should save cache with primary key', async () => {
      await saveNxCache(context, 'test');
      expect(saveCache).toHaveBeenCalledWith([resolve(`${NX_CACHE_PATH}/test`)], 'nx-cache-test-0');
    });

    it('should fail silently for ReserveCacheError', async () => {
      (saveCache as jest.Mock).mockRejectedValueOnce(new ReserveCacheError('test'));
      await expect(saveNxCache(context, 'test')).resolves.toBeUndefined();
    });

    it('should fail for not ReserveCacheError', async () => {
      (saveCache as jest.Mock).mockRejectedValueOnce(new Error('test'));
      await expect(saveNxCache(context, 'test')).rejects.toThrowError('test');
    });

    it('should not save cache if in debug mode', async () => {
      logger(core).debugMode = true;

      await saveNxCache(context, 'test');

      expect(saveCache).not.toHaveBeenCalled();

      logger().debugMode = false;
    });
  });
});
