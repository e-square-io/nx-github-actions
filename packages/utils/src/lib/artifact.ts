import { create as artifactClient } from '@actions/artifact';
import { create as globClient } from '@actions/glob';
import { debug, info, warning } from '@actions/core';

export async function uploadArtifact(name: string, paths: string[]): Promise<string | undefined> {
  if (paths.length === 0) return;

  const globPaths = paths.map((path) => `${path}/*`).join('\n');
  debug(`🐞 Upload paths: ${globPaths}`);

  const files = await globClient(globPaths).then((glob) => glob.glob());
  debug(`🐞 Found ${files.length} files to upload`);

  if (!files.length) {
    info(`❕ Couldn't find files to upload in ${paths.join(', ')}`);
    return;
  }

  try {
    const { failedItems, artifactName, size } = await artifactClient().uploadArtifact(name, files, process.cwd());
    debug(`🐞 name: ${artifactName}, size: ${size}, failedItems: ${failedItems.join(', ')}`);

    info(`✅ Successfully uploaded ${artifactName}`);
    return artifactName;
  } catch (e) {
    warning(e);
  }
}
