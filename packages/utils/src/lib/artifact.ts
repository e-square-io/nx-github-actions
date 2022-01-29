import { create as artifactClient } from '@actions/artifact';
import { create as globClient } from '@actions/glob';
import { logger } from './logger';

export async function uploadArtifact(name: string, paths: string[]): Promise<string | undefined> {
  if (paths.length === 0) return;

  const globPaths = paths.map((path) => `${path}/*`).join('\n');
  logger.debug(`Upload paths: ${globPaths}`);

  const files = await globClient(globPaths).then((glob) => glob.glob());

  if (!files.length) {
    logger.info(`Couldn't find files to upload in ${paths.join(', ')}`);
    return;
  }

  logger.debug(`Found ${files.length} files to upload`);

  if (logger.debugMode) {
    logger.debug(`Debug mode is on, skipping uploading artifacts`);
    return;
  }

  try {
    const { failedItems, artifactName, size } = await artifactClient().uploadArtifact(name, files, process.cwd());
    logger.debug(`name: ${artifactName}, size: ${size}, failedItems: ${failedItems.join(', ')}`);

    logger.success(`Successfully uploaded ${artifactName}`);
    return artifactName;
  } catch (e) {
    logger.warning(e);
  }
}
