import { Exec } from './exec';
import { exec as ghExec } from '@actions/exec';

describe('exec', () => {
  let exec: Exec;

  beforeEach(() => {
    exec = new Exec();

    exec.withCommand('test');

    jest.spyOn(exec, 'build');
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
    exec = new Exec();

    try {
      exec.build();
    } catch (e) {
      expect(e.message).toBe('No command given to Exec');
    }
  });
});
