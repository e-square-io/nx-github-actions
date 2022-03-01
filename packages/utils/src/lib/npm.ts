import { Exec } from './exec';

export function getNpmVersion(exec: Exec): Promise<string> {
  return new Exec(exec).withCommand('npm -v').build()();
}
