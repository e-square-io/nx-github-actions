import type { Task as NxTask } from '@nrwl/devkit';

export interface Task extends NxTask {
  cacheKey?: string;
  outputs?: string[];
}
