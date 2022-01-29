import { workspaceMock, mergedWorkspaceMock } from './__mocks__/fs';

jest.mock('./fs');
jest.mock('@actions/core', () => ({
  ...(jest.requireActual('@actions/core') as any),
  getInput: jest.fn(),
}));

import { getInput } from '@actions/core';
import { getMaxDistribution, getStringArrayInput } from './inputs';

describe('inputs', () => {
  describe('getStringArrayInput', () => {
    beforeEach(() => {
      (getInput as jest.Mock).mockReturnValue('test1,test2,test3');
    });

    it('should return an array of strings from a string input', () => {
      expect(getStringArrayInput('test', ',')).toEqual(['test1', 'test2', 'test3']);
    });
  });

  describe('getMaxDistribution', () => {
    it('should return an object of targets distribution from a string input', () => {
      (getInput as jest.Mock).mockReturnValue(2);
      expect(getMaxDistribution('test')).toEqual({ test: 2 });
    });

    it('should return an object of targets distribution from a JSON object', () => {
      (getInput as jest.Mock).mockReturnValue('{ "test1": 1, "test2": 2 }');
      expect(getMaxDistribution(['test1', 'test2'])).toEqual({ test1: 1, test2: 2 });
    });

    it('should return an object of targets distribution from a JSON array', () => {
      (getInput as jest.Mock).mockReturnValue('[1,2]');
      expect(getMaxDistribution(['test1', 'test2'])).toEqual({ test1: 1, test2: 2 });
    });

    it('should return an object of targets distribution from a partial JSON object/array', () => {
      (getInput as jest.Mock).mockReturnValue('{ "test1": 1 }');
      expect(getMaxDistribution(['test1', 'test2'])).toEqual({ test1: 1, test2: 3 });

      (getInput as jest.Mock).mockReturnValue('[1]');
      expect(getMaxDistribution(['test1', 'test2'])).toEqual({ test1: 1, test2: 3 });
    });
  });
});
