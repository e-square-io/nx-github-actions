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
  },
};

export const tree = {
  exists: jest.fn().mockReturnValue(true),
  read: jest.fn().mockReturnValue(JSON.stringify(workspaceMock)),
};
