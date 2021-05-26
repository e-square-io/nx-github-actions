import { packageJson } from './package-json';

describe('packageJson', () => {
  it('should work', () => {
    expect(packageJson()).toEqual('packageJson');
  });
});
