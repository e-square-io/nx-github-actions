import { context } from '@actions/github';
import type { Exec } from './exec';
import {
  saveState,
  info,
  startGroup,
  endGroup,
  setFailed,
} from '@actions/core';
import { BOUNDARIES_STATE_KEY } from './state';

export async function retrieveGitSHA(exec, rev: string): Promise<string> {
  let sha = '';
  const command = exec
    .withCommand('git')
    .withArgs('rev-parse')
    .withOptions({
      listeners: {
        stdout: (data: Buffer) => (sha += data.toString()),
      },
    })
    .build(true);

  return command([rev]).then(() => sha.replace(/(\r\n|\n|\r)/gm, ''));
}

export async function retrieveGitBoundaries(exec: Exec): Promise<void> {
  const boundaries = [];
  startGroup('Setting Git boundaries');
  if (context.eventName === 'pull_request') {
    const prPayload = context.payload.pull_request;
    boundaries.push(prPayload.base.sha, prPayload.head.sha);
  } else {
    try {
      boundaries.push(
        ...(await Promise.all([
          retrieveGitSHA(exec, 'HEAD~1'),
          retrieveGitSHA(exec, 'HEAD'),
        ]))
      );
    } catch (e) {
      setFailed(e);
    }
  }

  info(`Base SHA: ${boundaries[0]}`);
  info(`Base SHA: ${boundaries[1]}`);
  saveState(BOUNDARIES_STATE_KEY, boundaries);
  info('✅ Saved git base & head SHA');

  endGroup();
}
