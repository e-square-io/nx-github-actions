import { retrieveGitBoundaries } from './git';

describe('git', () => {
  it('retrieveGitBoundaries', () => {
    expect(retrieveGitBoundaries).toEqual('git');
  });
});
