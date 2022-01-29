import { hashFiles } from '@actions/glob';

export { hashFiles };

export const create = jest.fn(() =>
  Promise.resolve({
    glob: jest.fn().mockResolvedValue([]),
  })
);
