# @e-square/nx-affected-matrix-lib

[![NPM](https://img.shields.io/github/package-json/v/e-square-io/nx-affected-matrix-lib?&logo=npm&style=flat-square)]()
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/e-square-io/nx-github-actions/Main%20Workflow?style=flat-square)](https://github.com/e-square-io/nx-github-actions/actions/workflows/main.yml)
[![Codecov](https://img.shields.io/codecov/c/github/e-square-io/nx-github-actions?logo=codecov&style=flat-square&token=PVPVUJAD1X)](https://app.codecov.io/gh/e-square-io/nx-github-actions)
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](https://github.com/e-square-io/nx-github-actions#contributors-)
[![MIT](https://img.shields.io/packagist/l/doctrine/orm.svg?style=flat-square)](https://github.com/e-square-io/nx-github-actions/blob/main/LICENSE)

## Summary

A GitHub Action that outputs a matrix of NX targets.  
This action enables CI level parallelism by splitting the affected projects into multiple parallel jobs.

It is recommended to use this action's outputs with [@e-square/nx-distributed-task](https://github.com/marketplace/actions/nx-distributed-task),
check out the monorepo's [README](https://github.com/e-square-io/nx-github-actions#usage) for a full usage example of both actions.

## Usage

### Inputs

| name             | description                                                                                                                                 | default | required |
| :--------------- | :------------------------------------------------------------------------------------------------------------------------------------------ | :-----: | :------: |
| targets          | Comma-delimited targets to run                                                                                                              |    -    | &check;  |
| maxDistribution  | Maximum distribution of jobs per target. Can be number that will be used for all targets, or an array/object that matches the targets input |    3    | &cross;  |
| workingDirectory | Path to the Nx workspace, needed if not the repository root                                                                                 |    -    | &cross;  |
| args             | Space-delimited args to add to nx command execution                                                                                         |    -    | &cross;  |

### Outputs

|    name    |                                   description                                   |
| :--------: | :-----------------------------------------------------------------------------: |
|   matrix   |                       The affected matrix to be consumed                        |
| hasChanges | boolean that will be true when there is at least one job in the affected matrix |

```yaml
jobs:
  setup:
    runs-on: ubuntu-latest
    name: Affected Matrix
    outputs:
      hasChanges: ${{ steps.affected.outputs.hasChanges }}
      matrix: ${{ steps.affected.outputs.matrix }}
    steps:
      - name: Checkout
        uses: actions/checkout@v2
        with:
          fetch-depth: 0 # important to have history for affected calculation

      # install node modules, cache etc

      - name: Calculate affected projects
        uses: e-square-io/nx-affected-matrix-lib@v2
        id: affected
        with:
          targets: 'test,build'
          maxDistribution: 3
          workingDirectory: ''
          args: ''
```

For each supplied target, the action will slice the list of affected projects into multiple groups.  
So the output matrix from the example above will be:

```json
{
  "include": [
    {
      "target": "test",
      "distribution": "1",
      "projects": "project1,project2"
    },
    {
      "target": "test",
      "distribution": "2",
      "projects": "project3,project4"
    },
    ...
  ]
}
```

### Control distribution per target

In some cases it might be useful to change the distribution only for a particular target.  
`maxDistribution` input can receive an object with keys matching to the supplied targets or an array that will match by index. e.g:

```yaml

---
- name: Calculate affected projects
  uses: e-square-io/nx-affected-matrix-lib@v1
  id: affected
  with:
    targets: 'test,build'
    maxDistribution: '[2,1]' # or '{"test": 2, "build": 1}'
```

will produce 2 jobs for test target and one for build target.  
_Note: The action allows to set a partial distribution config, any target that isn't specified in the config will receive the default distribution value (3)_

## FAQ

**Q: I don't get the full affected list I expect to see**  
A: Make sure you checkout with `fetch-depth: 0` for affected-matrix job. It is required in order to pull the full commit history which is needed for the calculation.
