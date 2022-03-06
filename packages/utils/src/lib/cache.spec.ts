import { resolve } from 'path';
import { tree } from './fs';

import { saveCache, restoreCache, ReserveCacheError } from '@actions/cache';
import * as core from '@actions/core';
import * as glob from '@actions/glob';
import { context } from '@actions/github';

import { NX_CACHE_PATH, restoreNxCache, saveNxCache, keys } from './cache';
import { info, logger, warning } from './logger';

jest.mock('./logger');

describe('cache', () => {
  beforeAll(() => {
    process.env.RUNNER_OS = process.env.RUNNER_OS || process.platform;
    process.env.RUNNER_ARCH = process.env.RUNNER_ARCH || process.arch;
  });

  beforeEach(() => {
    jest.spyOn(tree, 'getLockFilePath').mockReturnValue('package-lock.json');
  });

  describe('restoreNxCache', () => {
    it('should restore cache with primary key and restoreKeys', async () => {
      await restoreNxCache(context, glob, 'test', 2);
      expect(restoreCache).toHaveBeenCalledWith(
        [resolve(NX_CACHE_PATH)],
        expect.stringContaining('test-2'),
        expect.arrayContaining([expect.stringContaining('test')])
      );
    });

    it('should fail silently', async () => {
      (restoreCache as jest.Mock).mockRejectedValueOnce('');
      await restoreNxCache(context, glob, 'test', 2);

      expect(warning).toHaveBeenCalledWith('');
    });

    it('should report cache miss', async () => {
      (restoreCache as jest.Mock).mockResolvedValueOnce('');
      await restoreNxCache(context, glob, 'test', 2);

      expect(info).toHaveBeenCalledWith('Cache miss');
    });

    it('should not restore cache if in debug mode', async () => {
      logger(core).debugMode = true;

      await restoreNxCache(context, glob, 'test', 2);

      expect(restoreCache).not.toHaveBeenCalled();

      logger().debugMode = false;
    });
  });

  describe('saveNxCache', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      keys = ['test'];
    });

    it('should save cache with primary key', async () => {
      await saveNxCache();
      expect(saveCache).toHaveBeenCalledWith([resolve(NX_CACHE_PATH)], 'test');
    });

    it('should fail silently for ReserveCacheError', async () => {
      (saveCache as jest.Mock).mockRejectedValueOnce(new ReserveCacheError('test'));
      await expect(saveNxCache()).resolves.toBeUndefined();
    });

    it('should fail for not ReserveCacheError', async () => {
      (saveCache as jest.Mock).mockRejectedValueOnce(new Error('test'));
      await expect(saveNxCache()).rejects.toThrowError('test');
    });

    it('should not save cache if in debug mode', async () => {
      logger(core).debugMode = true;

      await saveNxCache();

      expect(saveCache).not.toHaveBeenCalled();

      logger().debugMode = false;
    });

    it('should not save if no primary key is provided', async () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      keys = [''];

      await saveNxCache();

      expect(saveCache).not.toHaveBeenCalled();
    });

    it('should not save if cache hit occurred on primary key', async () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      keys = ['test', 'test'];

      await saveNxCache();
    });
    expect(saveCache).not.toHaveBeenCalled();
  });
});
