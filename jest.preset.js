const nxPreset = require('@nrwl/jest/preset');

module.exports = {
  ...nxPreset,
  roots: ['<rootDir>', `${__dirname}/__mocks__`],
  clearMocks: true,
  coverageReporters: ['json-summary', 'text', 'lcovonly'],
  testEnvironment: 'node',
};
