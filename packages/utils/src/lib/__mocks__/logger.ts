const _logger = {
  _debugMode: jest.fn<boolean, []>().mockReturnValue(false),
  set debugMode(value: boolean) {
    this._debugMode.mockReturnValue(value);
  },
  get debugMode() {
    return this._debugMode();
  },
};

export const logger = jest.fn().mockReturnValue(_logger);
export const log = jest.fn();
export const info = jest.fn();
export const success = jest.fn();
export const debug = jest.fn();
export const warning = jest.fn();
export const error = jest.fn();
export const notice = jest.fn();
export const group = jest.fn().mockImplementation(async (title, cb) => await cb());
