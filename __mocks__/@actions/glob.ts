const create = jest.fn(() =>
  Promise.resolve({
    glob: jest.fn().mockResolvedValue([]),
  })
);

module.exports = {
  ...jest.requireActual('@actions/glob'),
  create,
};
