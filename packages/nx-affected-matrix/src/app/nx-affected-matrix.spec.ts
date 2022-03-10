import { chunkify, generateAffectedMatrix } from './nx-affected-matrix';

jest.mock('./get-affected');
jest.mock('@e-square/utils/logger');
jest.mock('@e-square/utils/cache');

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
            args: {},
          },
          require
        )
      ).resolves.toEqual({
        apps: 'project1,project2',
        libs: 'project3,project4',
        matrix: {
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
        },
      });
    });
  });
});
