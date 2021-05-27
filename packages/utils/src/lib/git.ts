import { context } from '@actions/github';
import { startGroup, endGroup, setFailed, debug } from '@actions/core';
import type { Exec, ExecWrapper } from './exec';

export async function retrieveGitSHA(
  exec: ExecWrapper,
  rev: string
): Promise<string> {
  return exec([rev]).then((res) => res.replace(/(\r\n|\n|\r)/gm, ''));
}

export async function retrieveGitBoundaries(exec: Exec): Promise<string[]> {
  const boundaries = [];
  startGroup('🔀 Setting Git boundaries');
  if (context.eventName === 'pull_request') {
    const prPayload = context.payload.pull_request;
    boundaries.push(prPayload.base.sha, prPayload.head.sha);
  } else {
    const wrapper = exec.withCommand('git rev-parse').build();

    try {
      boundaries.push(
        ...(await Promise.all([
          retrieveGitSHA(wrapper, 'HEAD~1'),
          retrieveGitSHA(wrapper, 'HEAD'),
        ]))
      );
    } catch (e) {
      setFailed(e);
    }
  }

  debug(`🐞 Base SHA: ${boundaries[0]}`);
  debug(`🐞 Head SHA: ${boundaries[1]}`);
  endGroup();

  return boundaries;
}
