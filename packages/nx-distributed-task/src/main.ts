import type * as Core from '@actions/core';
import type * as Exec from '@actions/exec';
import type * as Glob from '@actions/glob';
import type * as Io from '@actions/io';
import type { context as Context } from '@actions/github';

import { main } from './app/nx-distributed-task';

export default async function (
  context: typeof Context,
  core: typeof Core,
  exec: typeof Exec,
  glob: typeof Glob,
  io: typeof Io,
  require?
) {
  await main(context, core, exec, glob, io, require);
}
