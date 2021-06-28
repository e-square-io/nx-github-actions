import { uploadArtifact } from './artifact';
import { create } from '@actions/glob';

describe('artifact', () => {
  it('should not upload if no paths', async () => {
    await expect(uploadArtifact('test', [])).resolves.toBeUndefined();
  });

  it('should not upload if not found files', async () => {
    await expect(uploadArtifact('test', ['dist'])).resolves.toBeUndefined();
  });

  it('should upload files', async () => {
    (create as jest.Mock).mockResolvedValue({ glob: jest.fn().mockResolvedValue(['dis/test1', 'dist/test2']) });
    await expect(uploadArtifact('test', ['dist'])).resolves.toBe('test');
  });
});
