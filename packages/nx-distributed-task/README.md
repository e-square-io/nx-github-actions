# @e-square/nx-distributed-task

[![NPM](https://img.shields.io/github/package-json/v/e-square-io/nx-distributed-task?&logo=npm&style=flat-square)]()
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/e-square-io/nx-github-actions/Main%20Workflow/main?event=push&logo=github&style=flat-square)](https://github.com/e-square-io/nx-github-actions/actions/workflows/main.yml)
[![Codecov](https://img.shields.io/codecov/c/github/e-square-io/nx-github-actions?logo=codecov&style=flat-square&token=PVPVUJAD1X)](https://app.codecov.io/gh/e-square-io/nx-github-actions)
[![All Contributors](https://img.shields.io/badge/all_contributors-2-orange.svg?style=flat-square)](https://github.com/e-square-io/nx-github-actions#contributors-)
[![MIT](https://img.shields.io/packagist/l/doctrine/orm.svg?style=flat-square)](https://github.com/e-square-io/nx-github-actions/blob/main/LICENSE)

## Summary

Github Action that runs nx `run-many` for the specified target and projects.  
This action was designed to consume the outputs of [@e-square/nx-affected-matrix](https://github.com/marketplace/actions/nx-affected-matrix) in order to distribute jobs with ease.

Check out the monorepo's [README](https://github.com/e-square-io/nx-github-actions#usage) for a full usage example of both actions with GitHub Actions' matrix

## Usage

### Inputs

| name             | description                                                 | default | required |
| :--------------- | :---------------------------------------------------------- | :-----: | :------: |
| target           | Target to run                                               |    -    | &check;  |
| projects         | Comma-delimited list of projects to run against target      |    -    | &check;  |
| maxParallel      | Maximum NX cli parallel runs                                |    3    | &cross;  |
| nxCloud          | Enable support of Nx Cloud                                  |  false  | &cross;  |
| uploadOutputs    | Upload target's outputs as workflow artifacts               |  true   | &cross;  |
| workingDirectory | Path to the Nx workspace, needed if not the repository root |    -    | &cross;  |
| args             | Space-delimited args to add to nx command execution         |    -    | &cross;  |

```yaml
jobs:
  execute:
    runs-on: ubuntu-latest
    name: Execute NX
    steps:
      - name: Checkout
        uses: actions/checkout@v2

      # install node modules, cache etc

      - name: Run command
        uses: e-square-io/nx-distributed-task@v2
        with:
          target: 'test'
          projects: 'project1,project2'
```

### Uploading outputs

In Github, when uploading multiple artifact under the same name, Github will keep adding the artifacts instead of overwriting them.
This behavior allows us to upload all the outputs from all the distributed jobs under one "directory" so that in later jobs you can download that single "directory" and get all the outputs for that target.
The name of the artifact will be the name of the target.
