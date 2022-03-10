import { context } from '@actions/github';
import * as core from '@actions/core';
import main from './main';
import { getAffected } from './app/get-affected';

jest.mock('./app/get-affected');
jest.mock('@e-square/utils/logger');
jest.mock('@e-square/utils/cache');

describe('main', () => {
  beforeEach(() => {
    const env = {
      NX_BASE: 'main',
      NX_HEAD: 'HEAD~1',
      INPUT_TARGETS: 'test,build',
      INPUT_MAXDISTRIBUTION: '2',
      INPUT_MAXPARALLEL: '3',
      INPUT_WORKINGDIRECTORY: '',
      INPUT_ARGS: 'arg1=true arg2=false',
      INPUT_DEBUG: 'false',
    };

    process.env = { ...process.env, ...env };
  });

  it('should output the generated matrix and if there are changes', async () => {
    await main(context, core, require);

    expect(core.setOutput).toHaveBeenCalledTimes(4);
    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'matrix', {
      include: [
        { distribution: 1, projects: 'project1,project2', target: 'test' },
        { distribution: 2, projects: 'project3,project4', target: 'test' },
        { distribution: 1, projects: 'project1,project2', target: 'build' },
        { distribution: 2, projects: 'project3,project4', target: 'build' },
      ],
    });
    expect(core.setOutput).toHaveBeenNthCalledWith(2, 'apps', 'project1,project2');
    expect(core.setOutput).toHaveBeenNthCalledWith(3, 'libs', 'project3,project4');
    expect(core.setOutput).toHaveBeenNthCalledWith(4, 'hasChanges', true);

    process.env.INPUT_MAXDISTRIBUTION = '{"test": 2, "build": 1}';

    await main(context, core, require);

    expect(core.setOutput).toHaveBeenNthCalledWith(5, 'matrix', {
      include: [
        { distribution: 1, projects: 'project1,project2', target: 'test' },
        { distribution: 2, projects: 'project3,project4', target: 'test' },
        { distribution: 1, projects: 'project1,project2,project3,project4', target: 'build' },
      ],
    });
  });

  it('should set job as failed if any unhandled error occurs', async () => {
    (getAffected as jest.Mock).mockRejectedValueOnce('test');
    await main(context, core, require);

    expect(core.setFailed).toHaveBeenCalledWith('test');
  });
});
