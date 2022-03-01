import { workspaceMock, mergedWorkspaceMock } from './__mocks__/fs';

import {
  assertNxInstalled,
  getProjectOutputs,
  getWorkspaceProjects,
  nxCommand,
  nxPrintAffected,
  nxRunMany,
} from './nx';
import * as npm from './npm';
import { tree } from './fs';
import { Exec } from './exec';
import { context } from '@actions/github';

jest.mock('./fs');
jest.mock('./logger');
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

  describe('getWorkspaceProjects', () => {
    it('should get workspace from angular.json or workspace.json', () => {
      getWorkspaceProjects();
      expect(tree.read).toHaveBeenCalledWith('angular.json');

      (tree.exists as jest.Mock).mockReturnValueOnce(false);
      getWorkspaceProjects();
      expect(tree.read).toHaveBeenCalledWith('workspace.json');
    });

    it('should get projects from workspace configuration', () => {
      const projects = getWorkspaceProjects();
      expect(projects).toEqual(mergedWorkspaceMock.projects);
    });

    it('should replace architect with targets', () => {
      const angularWorkspace = {
        ...workspaceMock,
        projects: { ...workspaceMock.projects },
      };
      angularWorkspace.projects.test = { ...workspaceMock.projects.test };

      angularWorkspace.projects.test['architect'] = angularWorkspace.projects.test.targets;
      delete angularWorkspace.projects.test.targets;

      (tree.read as jest.Mock).mockReturnValueOnce(JSON.stringify(angularWorkspace));

      const projects = getWorkspaceProjects();
      expect(projects).toEqual(expect.objectContaining(mergedWorkspaceMock.projects));
    });
  });

  describe('getProjectOutputs', () => {
    it('should parse project outputs with options ref', () => {
      expect(getProjectOutputs(mergedWorkspaceMock.projects, 'test', 'build')).toEqual([
        workspaceMock.projects.test.targets.build.options.outputPath,
      ]);
    });

    it('should not parse project outputs that dont match the format', () => {
      const org = workspaceMock.projects.test.targets.build.outputs;
      workspaceMock.projects.test.targets.build.outputs = ['should not be parsed'];

      expect(getProjectOutputs(mergedWorkspaceMock.projects, 'test', 'build')).toEqual(['should not be parsed']);

      workspaceMock.projects.test.targets.build.outputs = org;
    });

    it('should return empty path when project output cannot be parsed', () => {
      const org = workspaceMock.projects.test.targets.build.options.outputPath;
      delete workspaceMock.projects.test.targets.build.options.outputPath;

      expect(getProjectOutputs(mergedWorkspaceMock.projects, 'test', 'build')).toEqual(['']);

      workspaceMock.projects.test.targets.build.options.outputPath = org;
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

    it('should call nxPrintAffected', async () => {
      await expect(nxPrintAffected('test', exec)).resolves.toEqual(['']);
      expect(exec.withCommand).toHaveBeenCalledWith(`npx -p @nrwl/cli nx print-affected`);
      expect(exec.withArgs).toHaveBeenCalledWith('--target=test', '--select=tasks.target.project');
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
