import { retrieveGitBoundaries, retrieveGitSHA } from './git';
import { Exec } from './exec';
import { context } from '@actions/github';
import * as core from '@actions/core';

jest.mock('./logger');

describe('git', () => {
  let exec: Exec;
  let buildSpy: jest.SpyInstance;
  let execWrapper: jest.Mock;

  beforeEach(() => {
    exec = new Exec();
    execWrapper = jest.fn().mockReturnValue(Promise.resolve(''));
    buildSpy = jest.spyOn(exec, 'build').mockReturnValue(execWrapper);
    jest.spyOn(exec, 'withCommand');
    jest.spyOn(exec, 'withArgs');
    jest.spyOn(exec, 'withOptions');
  });

  describe('retrieveGitSHA', () => {
    it('should get SHA', async () => {
      buildSpy.mockRestore();
      await expect(retrieveGitSHA(exec.withCommand('git rev-parse').build(), 'HEAD')).resolves.toBeDefined();
    });

    it('should format result', async () => {
      execWrapper.mockReturnValueOnce(Promise.resolve(`with\nline\nbreaks`));

      await expect(retrieveGitSHA(exec.build(), '')).resolves.toEqual('withlinebreaks');
    });
  });

  describe('retrieveGitBoundaries', () => {
    it('should fail pipeline if throws', async () => {
      jest.spyOn(context, 'eventName', 'get').mockReturnValueOnce('push');
      execWrapper.mockReturnValueOnce(Promise.reject());

      await retrieveGitBoundaries(exec);
      expect(core.setFailed).toHaveBeenCalled();
    });

    it('should use git to get base & head SHA', async () => {
      jest.spyOn(context, 'eventName', 'get').mockReturnValueOnce('push');

      await expect(retrieveGitBoundaries(exec)).resolves.toEqual(['', '']);
      expect(execWrapper).toHaveBeenNthCalledWith(1, ['HEAD~1']);
      expect(execWrapper).toHaveBeenNthCalledWith(2, ['HEAD']);
    });

    it('should use PR payload to get base & head SHA', async () => {
      await expect(retrieveGitBoundaries(exec)).resolves.toEqual(['0', '0']);
      expect(buildSpy).not.toHaveBeenCalled();
      expect(execWrapper).not.toHaveBeenCalled();
    });
  });
});
