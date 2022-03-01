import type { ExecOptions, exec as __exec } from '@actions/exec';

import { debug } from './logger';

export type ExecWrapper = (args?: string[], options?: ExecOptions) => Promise<string>;

export class Exec {
  private command = '';
  private options: ExecOptions = {};
  private args: string[] = [];

  private get exec(): typeof __exec {
    return this._exec instanceof Exec ? this._exec.exec : this._exec;
  }

  constructor(private _exec: typeof __exec | Exec) {}

  build(): ExecWrapper {
    const command = this.command;
    const coercedArgs = [...this.args];
    const coercedOptions = { ...this.options };

    if (!command) {
      throw new Error('No command given to Exec');
    }

    this.command = '';
    this.args = [];
    this.options = {};

    return async (args?: string[], options?: ExecOptions) => {
      let stdout = '',
        stderr = '';
      const finalArgs = [...coercedArgs, ...(args ?? [])].filter((arg) => arg.length > 0).map((arg) => arg.trim());
      const finalOpts = {
        ...coercedOptions,
        ...options,
        listeners: {
          stdout: (data) => (stdout += data.toString()),
          stderr: (data) => (stderr += data.toString()),
        },
      };

      debug(`Running command ${command} - args: ${finalArgs.join(' ')}", options: ${finalOpts}`);

      return this.exec(command, finalArgs, finalOpts).then((code) => {
        if (code !== 0) throw stderr;
        return stdout;
      });
    };
  }

  withCommand(command: string): this {
    this.command = command;
    return this;
  }

  withArgs(...args: string[]): this {
    this.args.push(...args);
    return this;
  }

  withOptions(options: ExecOptions): this {
    this.options = { ...this.options, ...options };
    return this;
  }
}
