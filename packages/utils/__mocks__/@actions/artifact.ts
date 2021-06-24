export const create = jest.fn(() => ({
  uploadArtifact: jest.fn().mockResolvedValue({ failedItems: [], artifactName: 'test', size: 0 }),
}));
