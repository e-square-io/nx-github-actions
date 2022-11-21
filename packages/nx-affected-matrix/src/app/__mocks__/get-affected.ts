import type { Task } from '@e-square/utils/task';
import type { ProjectGraph } from 'nx/src/config/project-graph';

export const getAffected = jest.fn().mockResolvedValue({
  tasks: [
    { target: { target: 'build', project: 'project1' } },
    { target: { target: 'build', project: 'project2' } },
    { target: { target: 'build', project: 'project3' } },
    { target: { target: 'build', project: 'project4' } },
  ] as Task[],
  projects: ['project1', 'project2', 'project3', 'project4'],
  apps: ['project1', 'project2'],
  libs: ['project3', 'project4'],
  projectGraph: {
    nodes: {},
  } as ProjectGraph,
});
