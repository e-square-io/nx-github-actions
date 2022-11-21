import * as pm from '@nrwl/tao/src/shared/package-manager';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import { context } from '@actions/github';
import { Exec } from '@e-square/utils/exec';
import { logger } from '@e-square/utils/logger';
import { assertNxInstalled, nxCommand, nxRunMany } from './nx';

jest.mock('child_process');
jest.mock('fs');
jest.mock('@e-square/utils/logger');

describe('nx', () => {
  let exec: Exec;

  beforeEach(() => {
    exec = new Exec(jest.fn());
    jest.spyOn(exec, 'build').mockReturnValue(() => Promise.resolve(''));
    jest.spyOn(exec, 'withCommand');
    jest.spyOn(exec, 'withArgs');
    jest.spyOn(exec, 'withOptions');
  });

  describe('assertNxInstalled', () => {
    it('should fail to assert and throw error', async () => {
      await expect(assertNxInstalled(exec)).rejects.toThrow("Couldn't find Nx binary, Have you run npm/yarn install?");
    });

    it('should success assertion', async () => {
      jest.spyOn(exec, 'build').mockReturnValue(() => Promise.resolve('test'));

      await expect(assertNxInstalled(exec)).resolves.toBeUndefined();
    });
  });

  describe('exec nx', () => {
    const cases: [pm.PackageManager, string, string][] = [
      ['npm', '6.8.0', 'npx -p @nrwl/cli'],
      ['npm', '7.0.0', 'npx --no -p @nrwl/cli'],
      ['pnpm', '6.12.0', 'pnpx'],
      ['pnpm', '6.13.0', 'pnpm exec'],
      ['yarn', '1.22.16', 'yarn -p @nrwl/cli'],
    ];

    describe.each(cases)('%s %s', (packageManager, pmVersion, expectedCommand) => {
      // pretend lockfile exists for the specific package manager
      beforeEach(() => {
        jest
          .spyOn(fs, 'existsSync')
          .mockImplementation(
            (file: string) =>
              (file.endsWith('yarn.lock') && packageManager === 'yarn') ||
              (file.endsWith('pnpm-lock.yaml') && packageManager === 'pnpm')
          );
        // mock return value for [packageManager] --version
        jest.spyOn(childProcess, 'execSync').mockReturnValue(Buffer.from(pmVersion, 'utf-8'));
      });

      it('should call nxCommand', async () => {
        await expect(nxCommand('test', { target: 'build' }, exec)).resolves.toBe('');
        expect(exec.withCommand).toHaveBeenCalledWith(`${expectedCommand} nx test`);
        expect(exec.withArgs).toHaveBeenCalledWith('--target=build');
      });

      it('should not parse withDeps when nx version is >= 14', async () => {
        jest.spyOn(exec, 'build').mockReturnValueOnce(() => Promise.resolve('14.0.0'));

        await expect(
          nxCommand(
            'test',
            {
              target: 'build',
              // withDeps: true,
              // 'with-deps': true,
            },
            exec
          )
        ).resolves.toBe('');
        expect(exec.withArgs).toHaveBeenCalledWith('--target=build');
      });

      it('should call nxRunMany', async () => {
        await expect(
          nxRunMany(
            context,
            {
              target: 'test',
              projects: ['test'],
              // scan: true,
              parallel: 3,
            },
            exec
          )
        ).resolves.toBe('');
        expect(exec.withCommand).toHaveBeenCalledWith(`${expectedCommand} nx run-many`);
        expect(exec.withArgs).toHaveBeenCalledWith('--target=test', '--projects=test', '--scan', '--parallel=3');
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

    it('should not call nxCommand when in debug mode', async () => {
      logger().debugMode = true;

      await expect(
        nxRunMany(
          context,
          {
            target: 'test',
            projects: ['test'],
            // scan: true,
            parallel: 3,
          },
          exec
        )
      ).resolves.toBe('[DEBUG MODE] skipping execution');
      expect(exec.build).not.toHaveBeenCalled();
    });
  });
});
