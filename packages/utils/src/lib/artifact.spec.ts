import { create as aCreate } from '@actions/artifact';
import * as glob from '@actions/glob';

import { uploadArtifact } from './artifact';
import { logger, warning } from './logger';

jest.mock('./logger');

describe('artifact', () => {
  beforeEach(() => {
    (glob.create as jest.Mock).mockResolvedValue({ glob: jest.fn().mockResolvedValue(['dist/test1', 'dist/test2']) });
  });

  it('should not upload if no paths', async () => {
    await expect(uploadArtifact(glob, 'test', [])).resolves.toBeUndefined();
  });

  it('should not upload if not found files', async () => {
    (glob.create as jest.Mock).mockResolvedValueOnce({ glob: jest.fn().mockResolvedValue([]) });
    await expect(uploadArtifact(glob, 'test', ['dist'])).resolves.toBeUndefined();
  });

  it('should upload files', async () => {
    await expect(uploadArtifact(glob, 'test', ['dist'])).resolves.toBe('test');
  });

  it('should skip upload if debug mode is on', async () => {
    const uploadSpy = jest.fn();
    (aCreate as jest.Mock).mockImplementationOnce(() => ({
      uploadArtifact: uploadSpy,
    }));

    logger().debugMode = true;

    await expect(uploadArtifact(glob, 'test', ['dist'])).resolves.toBeUndefined();
    expect(uploadSpy).not.toHaveBeenCalled();

    logger().debugMode = false;
  });

  it('should fail globbing silently', async () => {
    (glob.create as jest.Mock).mockRejectedValueOnce('error');

    await uploadArtifact(glob, 'test', ['dist']);

    expect(warning).toHaveBeenCalledWith('error');
  });

  it('should fail uploading silently', async () => {
    (aCreate as jest.Mock).mockImplementationOnce(() => ({
      uploadArtifact: jest.fn().mockRejectedValue('error'),
    }));

    await uploadArtifact(glob, 'test', ['dist']);

    expect(warning).toHaveBeenCalled();
  });
});
