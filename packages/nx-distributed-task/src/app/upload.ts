import type * as Glob from '@actions/glob';

import { group } from '@e-square/utils/logger';
import { uploadArtifact } from '@e-square/utils/artifact';
import { Task } from '@e-square/utils/task';

export function uploadProjectsOutputs(glob: typeof Glob, tasks: Task[], uploadOutputs?: boolean): Promise<void> {
  if (!uploadOutputs) return;

  return group('⬆️ Uploading artifacts', async () => {
    await Promise.all(tasks.map((task) => uploadArtifact(glob, task.target.target, task.outputs)));
  });
}
