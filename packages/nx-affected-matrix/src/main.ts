import type * as Core from '@actions/core';
import type * as Exec from '@actions/exec';
import type { context as Context } from '@actions/github';
import type * as Io from '@actions/io';

import { main } from './app/nx-affected-matrix';

export default async function (context: typeof Context, core: typeof Core, exec: typeof Exec, io: typeof Io, require?) {
  await main(context, core, exec, io, require);
}
