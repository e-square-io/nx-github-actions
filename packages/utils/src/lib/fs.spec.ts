import { GHTree } from './fs';

describe('fs', () => {
  describe('tree', () => {
    let tree: GHTree;

    beforeEach(() => {
      tree = new GHTree();
    });

    it('should create tree with cwd as root', () => {
      expect(tree.root).toEqual(process.cwd());
    });

    it('should create tree with custom path as root', () => {
      tree = new GHTree('test');
      expect(tree.root).toEqual('test');
    });
  });
});
