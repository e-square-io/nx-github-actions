import type { Task as NxTask } from 'nx/src/config/task-graph';

export interface Task extends NxTask {
  cacheKey?: string;
  outputs?: string[];
}
