import * as core from '@actions/core';
import { splitArgsIntoNxArgsAndOverrides } from 'nx/src/utils/command-line-utils';

import { getArgsInput, getMaxDistribution, getStringArrayInput } from './inputs';

jest.mock('nx/src/utils/command-line-utils');
jest.mock('./fs');
jest.mock('./logger');

describe('inputs', () => {
  let spy: jest.SpyInstance;

  beforeEach(() => {
    spy = jest.spyOn(core, 'getInput');
  });

  describe('getStringArrayInput', () => {
    beforeEach(() => {
      spy.mockReturnValueOnce('test1,test2,test3');
    });

    it('should return an array of strings from a string input', () => {
      expect(getStringArrayInput(core, 'test', ',')).toEqual(['test1', 'test2', 'test3']);
    });
  });
  describe('getArgsInput', () => {
    beforeEach(() => {
      spy.mockReturnValueOnce('-f b --foo=bar --baz false');
    });

    it('should call splitArgsIntoNxArgsAndOverrides with array of raw args', () => {
      getArgsInput(core, 'print-affected');

      expect(splitArgsIntoNxArgsAndOverrides).toHaveBeenCalledWith(
        expect.objectContaining({ _: ['-f', 'b', '--foo', 'bar', '--baz', 'false'] }),
        'print-affected',
        expect.anything()
      );
    });
  });

  describe('getMaxDistribution', () => {
    it('should return an object of targets distribution from a string input', () => {
      spy.mockReturnValueOnce(2);
      expect(getMaxDistribution(core, 'test')).toEqual({ test: 2 });
    });

    it('should return an object of targets distribution from a JSON object', () => {
      spy.mockReturnValueOnce('{ "test1": 1, "test2": 2 }');
      expect(getMaxDistribution(core, ['test1', 'test2'])).toEqual({ test1: 1, test2: 2 });
    });

    it('should return an object of targets distribution from a JSON array', () => {
      spy.mockReturnValueOnce('[1,2]');
      expect(getMaxDistribution(core, ['test1', 'test2'])).toEqual({ test1: 1, test2: 2 });
    });

    it('should return an object of targets distribution from a partial JSON object/array', () => {
      spy.mockReturnValueOnce('{ "test1": 1 }');
      expect(getMaxDistribution(core, ['test1', 'test2'])).toEqual({ test1: 1, test2: 3 });

      spy.mockReturnValueOnce('[1]');
      expect(getMaxDistribution(core, ['test1', 'test2'])).toEqual({ test1: 1, test2: 3 });
    });
  });
});
