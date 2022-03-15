import type { ExecOptions, exec as __exec } from '@actions/exec';

import { debug } from './logger';

export type ExecWrapper = (args?: string[], options?: ExecOptions) => Promise<string>;

export class Exec {
  private command = '';
  private options: ExecOptions = {};
  private args: string[] = [];
  private readonly _exec: typeof __exec;

  private get exec(): typeof __exec {
    return this._exec;
  }

  constructor(exec: typeof __exec | Exec) {
    if ((exec as Exec).exec && typeof (exec as Exec).exec === 'function') {
      this._exec = (exec as Exec).exec;
    } else {
      this._exec = exec as typeof __exec;
    }
  }

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
          stdout: (data: Buffer) => (stdout += data.toString()),
          stderr: (data: Buffer) => (stderr += data.toString()),
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
