import { context as Context } from '@actions/github';
import * as Glob from '@actions/glob';
import * as Core from '@actions/core';
import { Inputs } from './inputs';
import { group } from '@e-square/utils/logger';
import { restoreNxCache, saveNxCache } from '@e-square/utils/cache';

export function restoreCache(
  context: typeof Context,
  glob: typeof Glob,
  core: typeof Core,
  { target, distribution, nxCloud }: Inputs
): Promise<void> {
  if (nxCloud) return;

  return group('🚀 Retrieving NX cache', () => restoreNxCache(context, glob, core, target, distribution));
}

export function saveCache(core: typeof Core, { nxCloud }: Inputs): Promise<void> {
  if (nxCloud) return;

  return group('🚀 Saving NX cache', () => saveNxCache(core));
}
