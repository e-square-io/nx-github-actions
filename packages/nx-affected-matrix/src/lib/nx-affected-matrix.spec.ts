import { chunkify, generateAffectedMatrix, main } from './nx-affected-matrix';

jest.mock('../../../utils/src', () => ({
  ...(jest.requireActual('../../../utils/src') as any),
  retrieveGitBoundaries: jest.fn().mockResolvedValue(['1', '2']),
  assertNxInstalled: jest.fn().mockResolvedValue(true),
  nxPrintAffected: jest.fn().mockResolvedValue(['project1', 'project2', 'project3', 'project4']),
}));

jest.mock('@actions/core', () => ({
  ...(jest.requireActual('@actions/core') as any),
  setOutput: jest.fn(),
}));

import { assertNxInstalled, Exec, nxPrintAffected } from '../../../utils/src';
import { setOutput } from '@actions/core';

describe('nxAffectedMatrix', () => {
  describe('chunkify', () => {
    it('should slice an array into multiple chunks', () => {
      const arr = ['test1', 'test2', 'test3'];

      expect(chunkify(arr, 3)).toEqual([['test1'], ['test2'], ['test3']]);
      expect(chunkify(arr, 2)).toEqual([['test1', 'test2'], ['test3']]);
      expect(chunkify(arr, 1)).toEqual([['test1', 'test2', 'test3']]);
      expect(chunkify(arr, 0)).toEqual([['test1', 'test2', 'test3']]);
    });
  });

  describe('generateAffectedMatrix', () => {
    it('should generate a matrix', async () => {
      await expect(
        generateAffectedMatrix(
          {
            targets: ['test1', 'test2'],
            maxDistribution: { test1: 1, test2: 2 },
            args: [],
          },
          new Exec()
        )
      ).resolves.toEqual({
        include: [
          {
            distribution: 1,
            projects: 'project1,project2,project3,project4',
            target: 'test1',
          },
          {
            distribution: 1,
            projects: 'project1,project2',
            target: 'test2',
          },
          {
            distribution: 2,
            projects: 'project3,project4',
            target: 'test2',
          },
        ],
      });
    });
  });

  describe('main', () => {
    beforeEach(() => {
      const env = {
        INPUT_TARGETS: 'test,build',
        INPUT_MAXDISTRIBUTION: '2',
        INPUT_MAXPARALLEL: '3',
        INPUT_WORKINGDIRECTORY: '',
        INPUT_ARGS: 'arg1=true arg2=false',
        INPUT_DEBUG: 'false',
      };

      process.env = { ...process.env, ...env };
    });

    it('should output the generated matrix and if there are changes', async () => {
      await main();

      expect(assertNxInstalled).toHaveBeenCalled();
      expect(nxPrintAffected).toHaveBeenCalled();
      expect(setOutput).toHaveBeenCalledTimes(2);
      expect(setOutput).toHaveBeenNthCalledWith(1, 'matrix', {
        include: [
          { distribution: 1, projects: 'project1,project2', target: 'test' },
          { distribution: 2, projects: 'project3,project4', target: 'test' },
          { distribution: 1, projects: 'project1,project2', target: 'build' },
          { distribution: 2, projects: 'project3,project4', target: 'build' },
        ],
      });
      expect(setOutput).toHaveBeenNthCalledWith(2, 'hasChanges', true);

      process.env.INPUT_MAXDISTRIBUTION = '{"test": 2, "build": 1}';

      await main();

      expect(setOutput).toHaveBeenNthCalledWith(3, 'matrix', {
        include: [
          { distribution: 1, projects: 'project1,project2', target: 'test' },
          { distribution: 2, projects: 'project3,project4', target: 'test' },
          { distribution: 1, projects: 'project1,project2,project3,project4', target: 'build' },
        ],
      });
    });
  });
});
