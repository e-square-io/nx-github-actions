import { workspaceMock } from '../../__mocks__/fs';

jest.mock('./fs');

import {
  assertNxInstalled,
  getProjectOutputs,
  getWorkspaceProjects,
  NX_BIN_PATH,
  nxCommand,
  nxPrintAffected,
  nxRunMany,
} from './nx';
import * as which from 'which';
import { tree } from './fs';
import { Exec } from './exec';

describe('nx', () => {
  describe('assertNxInstalled', () => {
    it('should fail to assert and throw error', async () => {
      (which as jest.Mock).mockReturnValueOnce(Promise.reject());
      await expect(assertNxInstalled()).rejects.toThrow("Couldn't find Nx binary, Have you run npm/yarn install?");
    });

    it('should success assertion', async () => {
      (which as jest.Mock).mockReturnValueOnce(Promise.resolve());
      await expect(assertNxInstalled()).resolves.toBeUndefined();
    });
  });

  describe('getWorkspaceProjects', () => {
    (tree.exists as jest.Mock).mockReturnValue(true);
    (tree.read as jest.Mock).mockReturnValue(JSON.stringify(workspaceMock));

    it('should get workspace from angular.json or workspace.json', () => {
      getWorkspaceProjects();
      expect(tree.read).toHaveBeenCalledWith('angular.json');

      (tree.exists as jest.Mock).mockReturnValueOnce(false);
      getWorkspaceProjects();
      expect(tree.read).toHaveBeenCalledWith('workspace.json');
    });

    it('should get projects from workspace configurations', () => {
      const projects = getWorkspaceProjects();
      expect(projects).toEqual(workspaceMock.projects);
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
      expect(projects).toEqual(jasmine.objectContaining(workspaceMock.projects));
    });
  });

  describe('getProjectOutputs', () => {
    it('should parse project outputs with options ref', () => {
      expect(getProjectOutputs(workspaceMock.projects, 'test', 'build')).toEqual([
        workspaceMock.projects.test.targets.build.options.outputPath,
      ]);
    });

    it('should not parse project outputs that dont match the format', () => {
      const org = workspaceMock.projects.test.targets.build.outputs;
      workspaceMock.projects.test.targets.build.outputs = ['should not be parsed'];

      expect(getProjectOutputs(workspaceMock.projects, 'test', 'build')).toEqual(['should not be parsed']);

      workspaceMock.projects.test.targets.build.outputs = org;
    });

    it('should return empty path when project output cannot be parsed', () => {
      const org = workspaceMock.projects.test.targets.build.options.outputPath;
      delete workspaceMock.projects.test.targets.build.options.outputPath;

      expect(getProjectOutputs(workspaceMock.projects, 'test', 'build')).toEqual(['']);

      workspaceMock.projects.test.targets.build.options.outputPath = org;
    });
  });

  describe('exec nx', () => {
    let exec: Exec;

    beforeEach(() => {
      exec = new Exec();
      spyOn(exec, 'build').and.returnValue(() => Promise.resolve(''));
      spyOn(exec, 'withCommand').and.callThrough();
      spyOn(exec, 'withArgs').and.callThrough();
      spyOn(exec, 'withOptions').and.callThrough();
    });

    it('should call nxCommand', async () => {
      await expect(nxCommand('test', 'build', exec, [])).resolves.toBe('');
      expect(exec.withCommand).toHaveBeenCalledWith(`${NX_BIN_PATH} test`);
      expect(exec.withArgs).toHaveBeenCalledWith('--target=build');
    });

    it('should call nxPrintAffected', async () => {
      await expect(nxPrintAffected('test', exec)).resolves.toEqual(['']);
      expect(exec.withCommand).toHaveBeenCalledWith(`${NX_BIN_PATH} print-affected`);
      expect(exec.withArgs).toHaveBeenCalledWith('--target=test', '--select=tasks.target.project');
    });

    it('should call nxRunMany', async () => {
      await expect(nxRunMany('test', { nxCloud: true, maxParallel: 3 }, exec)).resolves.toBe('');
      expect(exec.withCommand).toHaveBeenCalledWith(`${NX_BIN_PATH} run-many`);
      expect(exec.withArgs).toHaveBeenCalledWith('--target=test', '--scan', '--parallel', '--maxParallel=3');
      expect(exec.withOptions).toHaveBeenCalledWith(
        jasmine.objectContaining({
          env: jasmine.objectContaining({
            NX_BRANCH: '0',
            NX_RUN_GROUP: '0',
          }),
        })
      );
    });
  });
});
