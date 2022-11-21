import type { Task as NxTask } from '@nrwl/nx-cloud/lib/core/models/run-context.model';

export interface Task extends NxTask {
  cacheKey?: string;
  outputs?: string[];
}
