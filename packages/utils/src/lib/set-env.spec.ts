import { setInputsInEnv } from './set-env';

describe('set-env', () => {
  it('should parse inputs and set the in process env', () => {
    const inputs = {
      test: 'test',
    };

    const _process: Partial<typeof process> = {
      env: { prevVar: 'test' },
    };

    setInputsInEnv(inputs, _process as typeof process);

    expect(_process.env).toEqual({ prevVar: 'test', INPUT_TEST: 'test' });
  });
});
