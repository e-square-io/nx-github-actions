export const create = jest.fn(() =>
  Promise.resolve({
    glob: jest.fn().mockResolvedValue([]),
  })
);
