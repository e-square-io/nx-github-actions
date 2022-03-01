module.exports = {
  ...jest.requireActual('@actions/io'),
  which: jest.fn(),
};
