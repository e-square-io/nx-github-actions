import { retrieveGitBoundaries, retrieveGitSHA } from './git';
import { Exec } from './exec';
import * as core from '@actions/core';

describe('git', () => {
  let exec: Exec;
  let buildSpy: jasmine.Spy;
  let execWrapper: jest.Mock;

  beforeEach(() => {
    exec = new Exec();
    execWrapper = jest.fn().mockReturnValue(Promise.resolve(''));
    buildSpy = spyOn(exec, 'build').and.returnValue(execWrapper);
    spyOn(exec, 'withCommand').and.callThrough();
    spyOn(exec, 'withArgs').and.callThrough();
    spyOn(exec, 'withOptions').and.callThrough();
  });

  describe('retrieveGitSHA', () => {
    it('should get SHA', async () => {
      buildSpy.and.callThrough();
      await expect(retrieveGitSHA(exec.withCommand('git rev-parse').build(), 'HEAD')).resolves.toBeTruthy();
    });

    it('should format result', async () => {
      execWrapper.mockReturnValueOnce(Promise.resolve(`with\nline\nbreaks`));

      await expect(retrieveGitSHA(exec.build(), '')).resolves.toEqual('withlinebreaks');
    });
  });

  describe('retrieveGitBoundaries', () => {
    it('should fail pipeline if throws', async () => {
      execWrapper.mockReturnValueOnce(Promise.reject());
      jest.spyOn(core, 'setFailed');

      await retrieveGitBoundaries(exec);
      expect(core.setFailed).toHaveBeenCalled();
    });

    it('should use git to get base & head SHA', async () => {
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
