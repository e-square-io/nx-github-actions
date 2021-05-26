import { readFile } from 'fs/promises';
import { endGroup, info, startGroup } from '@actions/core';

export interface PackageJsonLike {
  scripts?: Record<string, string>;
}

export async function loadPackageJson(): Promise<PackageJsonLike> {
  return JSON.parse(await readFile('package.json', 'utf8')) as PackageJsonLike;
}

export async function assertHasNxPackageScript(): Promise<void> {
  startGroup('🔍 Ensuring Nx is available');

  const packageJson = await loadPackageJson().catch(() => {
    throw new Error(
      "Failed to load the 'package.json' file, did you setup your project correctly?"
    );
  });

  info('✅ Found package.json file');

  if (typeof packageJson.scripts?.nx !== 'string')
    throw new Error(
      "Failed to locate the 'nx' script in package.json, did you setup your project with Nx's CLI?"
    );

  info("✅ Found 'nx' script inside package.json file");
  endGroup();
}
