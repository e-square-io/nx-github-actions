import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, chmodSync, renameSync, rmSync } from 'fs';
import { resolve } from 'path';

import type { Tree } from 'nx/src/generators/tree';
import { workspaceRoot } from 'nx/src/utils/app-root';

export class GHTree implements Tree {
  readonly root: string;

  constructor(root?: string) {
    this.root = root ?? workspaceRoot;
  }

  children(dirPath: string): string[] {
    if (statSync(this.resolve(dirPath)).isDirectory()) {
      return readdirSync(this.resolve(dirPath));
    }
    return [];
  }

  delete(filePath: string): void {
    void rmSync(this.resolve(filePath), { recursive: true });
  }

  exists(filePath: string): boolean {
    return existsSync(this.resolve(filePath));
  }

  isFile(filePath: string): boolean {
    return statSync(this.resolve(filePath)).isFile();
  }

  listChanges() {
    return [];
  }

  read(filePath: string): Buffer | null;
  read(filePath: string, encoding: BufferEncoding): string | null;
  read(filePath: string, encoding?: BufferEncoding): string | Buffer | null {
    return readFileSync(this.resolve(filePath), { encoding });
  }

  async rename(from: string, to: string): Promise<void> {
    renameSync(this.resolve(from), this.resolve(to));
  }

  write(filePath: string, content: Buffer | string): void {
    writeFileSync(this.resolve(filePath), content);
  }

  resolve(path: string): string {
    return resolve(this.root, path.startsWith('/') ? path.slice(1) : path);
  }

  changePermissions(filePath: string, mode: string | number): void {
    chmodSync(tree.resolve(filePath), mode);
  }
}

export const tree = new GHTree();
