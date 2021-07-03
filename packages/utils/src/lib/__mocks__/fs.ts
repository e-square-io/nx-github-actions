export const workspaceMock = {
  projects: {
    test: {
      root: '',
      targets: {
        build: {
          executor: 'test',
          outputs: ['{options.outputPath}'],
          options: {
            outputPath: 'test',
          },
        },
      },
    },
    test2: 'packages/test2',
  },
};

export const projectConfigMock = {
  root: '',
  targets: {
    build: {
      executor: 'test2',
      outputs: ['{options.outputPath}'],
      options: {
        outputPath: 'test2',
      },
    },
  },
};

export const mergedWorkspaceMock = {
  projects: {
    ...workspaceMock.projects,
    test2: { ...projectConfigMock },
  },
};

export const tree = {
  exists: jest.fn().mockReturnValue(true),
  read: jest
    .fn()
    .mockImplementation((path) =>
      JSON.stringify(
        ['workspace.json', 'angular.json'].some((file) => path.includes(file)) ? workspaceMock : projectConfigMock
      )
    ),
};
