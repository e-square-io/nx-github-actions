import { create } from '@actions/artifact';
import { create as createGlob } from '@actions/glob';
import { debug, info, warning } from '@actions/core';

export async function uploadArtifact(
  name: string,
  paths: string[]
): Promise<string | undefined> {
  if (paths.length === 0) return;
  const globPaths = paths.map((path) => `${path}/*`).join('\n');
  debug(`🐞 Upload paths: ${globPaths}`);

  const glob = await createGlob(globPaths);
  const client = create();

  const files = await glob.glob();
  debug(`🐞 Found ${files.length} files to upload`);

  try {
    const { failedItems, artifactName, size } = await client.uploadArtifact(
      name,
      files,
      process.cwd()
    );
    debug(
      `🐞 name: ${artifactName}, size: ${size}, failedItems: ${failedItems.join(
        ', '
      )}`
    );

    info(`✅ Successfully uploaded ${artifactName}`);
    return artifactName;
  } catch (e) {
    warning(e);
  }
}
