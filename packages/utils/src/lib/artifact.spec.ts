import { uploadArtifact } from './artifact';
import { create } from '@actions/glob';
import { create as aCreate } from '@actions/artifact';

jest.mock('./logger');

import { logger } from './logger';

describe('artifact', () => {
  beforeEach(() => {
    (create as jest.Mock).mockResolvedValue({ glob: jest.fn().mockResolvedValue(['dis/test1', 'dist/test2']) });
  });

  it('should not upload if no paths', async () => {
    await expect(uploadArtifact('test', [])).resolves.toBeUndefined();
  });

  it('should not upload if not found files', async () => {
    (create as jest.Mock).mockResolvedValue({ glob: jest.fn().mockResolvedValue([]) });
    await expect(uploadArtifact('test', ['dist'])).resolves.toBeUndefined();
  });

  it('should upload files', async () => {
    await expect(uploadArtifact('test', ['dist'])).resolves.toBe('test');
  });

  it('should skip upload if debug mode is on', async () => {
    const uploadSpy = jest.fn();
    (aCreate as jest.Mock).mockImplementationOnce(() => ({
      uploadArtifact: uploadSpy,
    }));

    logger.debugMode = true;

    await expect(uploadArtifact('test', ['dist'])).resolves.toBeUndefined();
    expect(uploadSpy).not.toHaveBeenCalled();

    logger.debugMode = false;
  });

  it('should fail uploading silently', async () => {
    (aCreate as jest.Mock).mockImplementationOnce(() => ({
      uploadArtifact: jest.fn().mockRejectedValue('test'),
    }));

    await uploadArtifact('test', ['dist']);

    expect(logger.warning).toHaveBeenCalled();
  });
});
