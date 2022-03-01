import { create as artifactClient } from '@actions/artifact';
import type * as Glob from '@actions/glob';

import { debug, info, logger, success, warning } from './logger';

export async function uploadArtifact(glob: typeof Glob, name: string, paths: string[]): Promise<string | undefined> {
  if (paths.length === 0) return;

  const globPaths = paths.map((path) => `${path}/*`).join('\n');
  debug(`Upload paths: ${globPaths}`);

  try {
    const files = await glob.create(globPaths).then((glob) => glob.glob());

    if (!files.length) {
      info(`Couldn't find files to upload in ${paths.join(', ')}`);
      return;
    }

    debug(`Found ${files.length} files to upload`);

    if (logger().debugMode) {
      debug(`Debug mode is on, skipping uploading artifacts`);
      return;
    }

    const { failedItems, artifactName, size } = await artifactClient().uploadArtifact(name, files, process.cwd());
    debug(`name: ${artifactName}, size: ${size}, failedItems: ${failedItems.join(', ')}`);

    success(`Successfully uploaded ${artifactName}`);
    return artifactName;
  } catch (e) {
    warning(e);
  }
}
