export const assertNxInstalled = jest.fn().mockResolvedValue(true);
export const nxRunMany = jest.fn().mockResolvedValue(true);
export const getWorkspaceProjects = jest.fn();
export const getProjectOutputs = jest.fn().mockReturnValue('dist/test');
export const nxPrintAffected = jest.fn().mockResolvedValue(['project1', 'project2', 'project3', 'project4']);
export const runNxTask = jest.fn().mockResolvedValue(true);
