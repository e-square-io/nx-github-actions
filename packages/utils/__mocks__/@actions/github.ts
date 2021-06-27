export const context = {
  get eventName() {
    return 'pull_request';
  },
  runId: 0,
  payload: {
    pull_request: {
      number: 0,
      base: {
        sha: 0,
      },
      head: {
        sha: 0,
      },
    },
  },
};
