export const logger = {
  log: jest.fn(),
  info: jest.fn(),
  success: jest.fn(),
  debug: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
  notice: jest.fn(),
  group: jest.fn().mockImplementation(async (title, cb) => await cb()),
};
