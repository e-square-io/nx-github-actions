import { assertNxInstalled, nxCommand, nxRunMany } from './nx';
import * as npm from '@e-square/utils/npm';
import { Exec } from '@e-square/utils/exec';
import { context } from '@actions/github';

jest.mock('@e-square/utils/fs');
jest.mock('@e-square/utils/logger');
jest.mock('@actions/github');

describe('nx', () => {
  describe('assertNxInstalled', () => {
    it('should fail to assert and throw error', async () => {
      const exec = new Exec(jest.fn().mockResolvedValueOnce(0));
      await expect(assertNxInstalled(exec)).rejects.toThrow("Couldn't find Nx binary, Have you run npm/yarn install?");
    });

    it('should success assertion', async () => {
      const exec = new Exec(
        jest.fn().mockImplementation(async (_, __, opts) => {
          opts.listeners.stdout('test');
          return Promise.resolve(0);
        })
      );
      await expect(assertNxInstalled(exec)).resolves.toBeUndefined();
    });
  });

  describe('exec nx', () => {
    let exec: Exec;

    beforeEach(() => {
      exec = new Exec(jest.fn());
      jest.spyOn(exec, 'build').mockReturnValue(() => Promise.resolve(''));
      jest.spyOn(exec, 'withCommand');
      jest.spyOn(exec, 'withArgs');
      jest.spyOn(exec, 'withOptions');
      jest.spyOn(npm, 'getNpmVersion').mockResolvedValue('6.8.0');
    });

    it('should call nxCommand', async () => {
      await expect(nxCommand('test', 'build', exec, [])).resolves.toBe('');
      expect(exec.withCommand).toHaveBeenCalledWith(`npx -p @nrwl/cli nx test`);
      expect(exec.withArgs).toHaveBeenCalledWith('--target=build');

      jest.spyOn(npm, 'getNpmVersion').mockResolvedValueOnce('7.0.0');
      await expect(nxCommand('test', 'build', exec, [])).resolves.toBe('');
      expect(exec.withCommand).toHaveBeenCalledWith(`npx --no -p @nrwl/cli nx test`);
    });

    it('should call nxRunMany', async () => {
      await expect(
        nxRunMany(
          context,
          'test',
          { args: [], debug: false, workingDirectory: '', nxCloud: true, maxParallel: 3 },
          exec
        )
      ).resolves.toBe('');
      expect(exec.withCommand).toHaveBeenCalledWith(`npx -p @nrwl/cli nx run-many`);
      expect(exec.withArgs).toHaveBeenCalledWith('--target=test', '--scan', '--parallel', '--maxParallel=3');
      expect(exec.withOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          env: expect.objectContaining({
            NX_BRANCH: '0',
            NX_RUN_GROUP: '0',
          }),
        })
      );
    });
  });
});
