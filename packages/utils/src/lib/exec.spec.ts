import { exec as ghExec } from '@actions/exec';

import { Exec } from './exec';

jest.mock('@actions/exec');
jest.mock('./logger');

describe('exec', () => {
  let exec: Exec;

  beforeEach(() => {
    exec = new Exec(ghExec);

    exec.withCommand('test');

    jest.spyOn(exec, 'build');
  });

  it('should be possible to create new instance from another one', async () => {
    const newExec = new Exec(exec);

    await newExec.withCommand('test').build()();

    expect(ghExec).toHaveBeenCalledWith('test', expect.anything(), expect.anything());
  });

  it('should add command', async () => {
    await exec.build()();
    expect(ghExec).toHaveBeenCalledWith('test', expect.anything(), expect.anything());
  });

  it('should add args and trim them', async () => {
    await exec.withArgs('1 ').withArgs(' 2').build()();
    expect(ghExec).toHaveBeenCalledWith(expect.anything(), ['1', '2'], expect.anything());
  });

  it('should add options and merge with defaults', async () => {
    await exec.withOptions({ env: {} }).withOptions({ cwd: '' }).build()();
    expect(ghExec).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      env: {},
      cwd: '',
      listeners: { stdout: expect.any(Function), stderr: expect.any(Function) },
    });
  });

  it('should throw if no command is specified', async () => {
    exec = new Exec(ghExec);

    try {
      exec.build();
    } catch (e) {
      expect((e as Error).message).toBe('No command given to Exec');
    }
  });
});
