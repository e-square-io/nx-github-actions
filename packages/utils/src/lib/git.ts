import { setFailed } from '@actions/core';
import { context } from '@actions/github';

import type { Exec, ExecWrapper } from './exec';
import { logger } from './logger';

export async function retrieveGitSHA(exec: ExecWrapper, rev: string): Promise<string> {
  return exec([rev]).then((res) => res.replace(/(\r\n|\n|\r)/gm, ''));
}

export function retrieveGitBoundaries(exec: Exec): Promise<string[]> {
  const boundaries = [];
  return logger.group('🔀 Setting Git boundaries', async () => {
    if (context.eventName === 'pull_request') {
      const prPayload = context.payload.pull_request;
      boundaries.push(prPayload.base.sha.toString(), prPayload.head.sha.toString());
    } else {
      const wrapper = exec.withCommand('git rev-parse').build();

      try {
        boundaries.push(...(await Promise.all([retrieveGitSHA(wrapper, 'HEAD~1'), retrieveGitSHA(wrapper, 'HEAD')])));
      } catch (e) {
        setFailed(e);
      }
    }

    logger.debug(`Base SHA: ${boundaries[0]}`);
    logger.debug(`Head SHA: ${boundaries[1]}`);

    return boundaries;
  });
}
