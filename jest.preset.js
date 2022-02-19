const nxPreset = require('@nrwl/jest/preset');

module.exports = {
  ...nxPreset,
  clearMocks: true,
  coverageReporters: ['json-summary', 'text', 'lcovonly'],
};
