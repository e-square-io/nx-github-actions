import { exec, ExecOptions } from '@actions/exec';
import { stat } from 'fs/promises';
import { info } from '@actions/core';

export type ExecWrapper = (
  args?: string[],
  options?: ExecOptions
) => Promise<number>;

export type ManagerEntry = [
  name: string,
  filePath: string,
  command: string,
  argsSeparator: string
];

async function locateManager(
  entries: ManagerEntry[]
): Promise<{ command: string; argsSeparator: string }> {
  if (entries.length === 0) {
    throw new Error(
      'Failed to detect your package manager, are you using npm or yarn?'
    );
  }

  const [[name, filePath, command, argsSeparator], ...rest] = entries;

  return stat(filePath)
    .then(() => {
      info(`✅ Found ${name} as your package manager`);
      return { command, argsSeparator };
    })
    .catch(() => locateManager(rest));
}

export class Exec {
  private readonly managerCommand?: string;
  private readonly argsSeparator?: string;
  private command = '';
  private options: ExecOptions = {};
  private args: string[] = [];

  constructor(managerCommand?: string, argsSeparator?: string) {
    this.managerCommand = managerCommand;
    this.argsSeparator = argsSeparator;
  }

  static async init(): Promise<Exec> {
    const entries: ManagerEntry[] = [
      ['npm', 'package-lock.json', 'npm run', '--'],
      ['yarn', 'yarn.lock', 'yarn', ''],
      ['pnpm', 'pnpm-lock.yaml', 'pnpm run', '--'],
    ];
    const { command, argsSeparator } = await locateManager(entries);
    return new Exec(command, argsSeparator);
  }

  build(skipManager?: boolean): ExecWrapper {
    let command = this.command;
    let coercedArgs = [...this.args];
    let coercedOptions = { ...this.options };

    if (!command) {
      throw new Error('No command given to Exec');
    }

    this.command = '';
    this.args = [];
    this.options = {};

    if (!skipManager) {
      if (this.argsSeparator?.length && coercedArgs[0] !== this.argsSeparator) {
        coercedArgs.unshift(this.argsSeparator);
      }

      if (this.managerCommand?.length) {
        command = `${this.managerCommand} ${command}`;
      }
    }

    return async (args?: string[], options?: ExecOptions) => {
      coercedArgs = [...this.args, ...(args ?? [])];
      coercedOptions = { ...options, ...options };

      return exec(
        command,
        coercedArgs.filter((arg) => arg.length > 0).map((arg) => arg.trim()),
        coercedOptions
      );
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
