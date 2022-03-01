import * as core from '@actions/core';

import { debug, error, group, info, initializeLogger, log, logger, notice, success, warning } from './logger';

const expectLogging = (
  method: (arg: string) => void,
  spy: (arg: string) => void,
  expectedPrefix: string,
  ...expectedParams: any
) => {
  (spy as jest.Mock).mockClear();

  method('test');
  expect(spy).toHaveBeenCalledWith(`${expectedPrefix ? `${expectedPrefix} ` : ''}test`, ...expectedParams);
};

describe('logger', () => {
  let instance: ReturnType<typeof logger>;

  beforeEach(() => {
    initializeLogger(core);

    instance = logger();
  });

  describe('use the underlying core package', () => {
    it('should use info', () => {
      expectLogging(log, core.info, '');
      expectLogging(info, core.info, '❕');
      expectLogging(success, core.info, '✅');

      instance.debugMode = true;
      expectLogging(debug, core.info, '🐞');
    });

    it('should use debug', () => {
      (core.isDebug as jest.Mock).mockReturnValueOnce(true);

      expectLogging(debug, core.debug, '🐞');
    });

    it('should use notice', () => {
      expectLogging(notice, core.notice, '', undefined);
    });

    it('should use warning', () => {
      expectLogging(warning, core.warning, '', undefined);
    });

    it('should use error', () => {
      expectLogging(error, core.error, '', undefined);
    });

    it('should use group', async () => {
      const cb = jest.fn();
      await group('test', cb);

      expect(core.group).toHaveBeenCalledWith('test', cb);
    });
  });
});
