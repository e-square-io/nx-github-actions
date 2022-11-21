import type * as Glob from '@actions/glob';

import { group } from '@e-square/utils/logger';
import { uploadArtifact } from '@e-square/utils/artifact';

import type { Task } from '@e-square/utils/task';
import { TaskGraph } from '@nrwl/nx-cloud/lib/core/models/run-context.model';

export function uploadProjectsOutputs(glob: typeof Glob, tasks: Task[], taskGraph: TaskGraph): Promise<void> {
  return group('⬆️ Uploading artifacts', async () => {
    await Promise.all(tasks.map((task) => uploadArtifact(glob, task.target.target, task.outputs)));
  });
}
