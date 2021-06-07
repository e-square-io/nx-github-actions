import { Tree } from '@nrwl/devkit';
import { cp, rmRF } from '@actions/io';
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'fs';
import { resolve } from 'path';

export class GHTree implements Tree {
  root: string;

  constructor() {
    this.root = process.cwd();
  }

  children(dirPath: string): string[] {
    if (statSync(resolve(this.root, dirPath)).isDirectory()) {
      return readdirSync(resolve(this.root, dirPath));
    }
    return [];
  }

  delete(filePath: string): void {
    void rmRF(resolve(this.root, filePath));
  }

  exists(filePath: string): boolean {
    return existsSync(resolve(this.root, filePath));
  }

  isFile(filePath: string): boolean {
    return statSync(resolve(this.root, filePath)).isFile();
  }

  listChanges() {
    return [];
  }

  read(filePath: string): Buffer | null {
    return readFileSync(resolve(this.root, filePath));
  }

  async rename(from: string, to: string): Promise<void> {
    await cp(resolve(this.root, from), resolve(this.root, to));
  }

  write(filePath: string, content: Buffer | string): void {
    writeFileSync(resolve(this.root, filePath), content);
  }
}

export const tree = new GHTree();
