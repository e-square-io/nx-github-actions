import { exec, ExecOptions } from '@actions/exec';
import { debug, setFailed } from '@actions/core';

export type ExecWrapper = (
  args?: string[],
  options?: ExecOptions
) => Promise<string>;

export class Exec {
  private command = '';
  private options: ExecOptions = {};
  private args: string[] = [];

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
      const finalArgs = [...coercedArgs, ...(args ?? [])]
        .filter((arg) => arg.length > 0)
        .map((arg) => arg.trim());
      const finalOpts = {
        ...coercedOptions,
        ...options,
        listeners: {
          stdout: (data) => (stdout += data.toString()),
          stderr: (data) => (stderr += data.toString()),
        },
      };

      debug(
        `🐞 Running command ${command} - args: ${finalArgs.join(
          ' '
        )}", options: ${finalOpts}`
      );

      return exec(command, finalArgs, finalOpts).then((code) => {
        if (code !== 0) setFailed(stderr);
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
