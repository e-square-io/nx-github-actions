import { tree } from './fs';
import { warning } from './logger';
import type { Task } from './task';
import type { Workspaces } from 'nx/src/config/workspaces';
import { Hasher, Hash } from 'nx/src/hasher/hasher';
import { ProjectGraph } from 'nx/src/config/project-graph';
import { TaskGraph } from 'nx/src/config/task-graph';
import { readNxJson, WorkspaceConfiguration } from 'nx/src/generators/utils/project-configuration';
import { CustomHasher } from 'nx/src/config/misc-interfaces';
import { NxJsonConfiguration } from 'nx/src/config/nx-json';
import { getExecutorForTask } from 'nx/src/tasks-runner/utils';
import { createProjectGraphAsync } from 'nx/src/project-graph/project-graph';

/** Run the hasher or the custom one
 * supports both the new (experimental) and the old (current) ways of invoking a custom hasher
 */
async function runHasher(
  task: Task,
  hasher: Hasher,
  projectGraph: ProjectGraph,
  taskGraph: TaskGraph,
  workspaceConfig: WorkspaceConfiguration,
  customHasher?: (...args: any[]) => Promise<Hash>
): Promise<Hash> {
  let hash: Hash | null = null;

  if (customHasher) {
    try {
      if (customHasher.length === 3) {
        // old way (or current)
        hash = await customHasher(task, taskGraph, hasher);
      } else {
        // new way (experimental)
        hash = await customHasher(task, {
          hasher,
          projectGraph,
          taskGraph,
          workspaceConfig,
        });
      }
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }

  return hash ?? (await hasher.hashTaskWithDepsAndContext(task));
}

export async function getCustomHasher(task: Task, workspace: Workspaces): Promise<CustomHasher | undefined> {
  try {
    const nxJson = readNxJson(tree) ?? {};
    const projectGraph = await createProjectGraphAsync();
    const factory = getExecutorForTask(task, workspace, projectGraph, nxJson).hasherFactory;
    return factory ? factory() : undefined;
  } catch (e) {
    throw new Error(`Unable to load hasher for task "${task.id}"`);
  }
}

export function createHasher(graph: ProjectGraph, nxJson: NxJsonConfiguration): Hasher {
  const { options } = nxJson?.tasksRunnerOptions?.['default'] ?? { options: {} };
  return new Hasher(graph, nxJson, options);
}

export async function hashTask(
  task: Task,
  projectGraph: ProjectGraph,
  taskGraph: TaskGraph,
  defaultHasher: Hasher,
  workspace: Workspaces
): Promise<void> {
  let customHasher = undefined;
  try {
    customHasher = await getCustomHasher(task, workspace);
  } catch (e) {
    const unableToFindError = `Unable to load hasher for task ${task.id}`;
    if ((typeof e === 'string' ? e : (e as Error).message) === unableToFindError) {
      warning(`${unableToFindError}, fallbacks to default hasher`);
    }
  }

  const { value, details } = await runHasher(
    task,
    defaultHasher,
    projectGraph,
    taskGraph,
    workspace.readWorkspaceConfiguration(),
    customHasher
  );

  task.hash = value;
  task.hashDetails = details;
}
