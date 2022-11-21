import { restoreNxCache, saveNxCache } from '@e-square/utils/cache';

import { restoreCache, saveCache } from './cache';
import { context } from '@actions/github';
import { Task } from '@e-square/utils/task';
import { TaskGraph } from '@nrwl/nx-cloud/lib/core/models/run-context.model';

jest.mock('@e-square/utils/cache');
jest.mock('@e-square/utils/logger');

describe('cache', () => {
  let task: Task;
  let depTask: Task;
  let graph: TaskGraph;

  beforeEach(() => {
    task = {
      id: 'test:build',
      overrides: {},
      outputs: ['test'],
      target: { target: 'build', project: 'test' },
      hash: 'test',
    };
    depTask = { ...task, id: 'dep:build' };

    graph = {
      tasks: {
        'test:build': task,
      },
      roots: [],
      dependencies: {},
    };
  });

  it('should call cache utils', async () => {
    await restoreCache(context, [task], graph);
    await saveCache(context, [task], graph);

    expect(saveNxCache).toHaveBeenCalled();
    expect(restoreNxCache).toHaveBeenCalled();
  });

  describe('restoring deps', () => {
    let secondTask: Task;

    beforeEach(() => {
      secondTask = { ...task, id: 'test2:build' };

      graph = {
        ...graph,
        tasks: {
          ...graph.tasks,
          'test2:build': secondTask,
          'dep:build': depTask,
        },
        roots: [],
        dependencies: {
          'test:build': ['dep:build'],
          'test2:build': ['dep:build'],
        },
      };
    });

    it('should restore deps cache if task cache is missing', async () => {
      await restoreCache(context, [task], graph);

      expect(restoreNxCache).toHaveBeenNthCalledWith(1, context, task);
      expect(restoreNxCache).toHaveBeenNthCalledWith(2, context, depTask);
    });

    it('should not try to restore deps cache twice', async () => {
      await restoreCache(context, [task, secondTask], graph);

      expect(restoreNxCache).toHaveBeenNthCalledWith(1, context, task);
      expect(restoreNxCache).toHaveBeenNthCalledWith(2, context, depTask);
      expect(restoreNxCache).toHaveBeenNthCalledWith(3, context, secondTask);
      expect(restoreNxCache).not.toHaveBeenNthCalledWith(4, context, depTask);
    });
  });
});
