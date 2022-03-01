export function setInputsInEnv(inputs: Record<string, string>, _process: typeof process): void {
  for (const k in inputs) {
    _process.env[`INPUT_${k.toUpperCase()}`] = inputs[k];
  }
}

export default setInputsInEnv;
