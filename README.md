# NX Github Actions
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/e-square-io/nx-github-actions/Main%20Workflow/main?event=push&logo=github&style=flat-square)](https://github.com/e-square-io/nx-github-actions/actions/workflows/main.yml)
[![Codecov](https://img.shields.io/codecov/c/github/e-square-io/nx-github-actions?logo=codecov&style=flat-square&token=PVPVUJAD1X)](https://app.codecov.io/gh/e-square-io/nx-github-actions)
[![PRs](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](.github/PULL_REQUEST_TEMPLATE.md)
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors-)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![commitizen](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)](CONTRIBUTING.md#commit-message-format)
[![MIT](https://img.shields.io/packagist/l/doctrine/orm.svg?style=flat-square)](LICENSE)

> A set of Github Actions for NX workspaces

| project | version | description |
|:-------:|:-------:|:-------:|
| [@e-square/nx-affected-matrix] | [![GitHub Marketplace][nx-affected-matrix-badge]][nx-affected-matrix-link] | Uses NX's affected utils to calculate the changes.  Outputs a matrix of the distributed tasks |
| [@e-square/nx-distributed-task] | [![GitHub Marketplace][nx-distributed-task-badge]][nx-distributed-task-link] | Execute each distributed task from the matrix generated from nx-affected-matrix action |

[@e-square/nx-affected-matrix]: https://github.com/e-square-io/nx-affected-matrix
[nx-affected-matrix-link]: https://github.com/marketplace/actions/nx-affected-matrix
[nx-affected-matrix-badge]: https://img.shields.io/github/package-json/v/e-square-io/nx-affected-matrix?label=Marketplace&logo=github&style=flat-square
[@e-square/nx-distributed-task]: https://github.com/e-square-io/nx-distributed-task
[nx-distributed-task-link]: https://github.com/marketplace/actions/nx-distributed-task
[nx-distributed-task-badge]: https://img.shields.io/github/package-json/v/e-square-io/nx-affected-matrix?label=Marketplace&logo=github&style=flat-square

## Features

- ✅ Distribution of tasks across multiple parallel jobs
- ✅ GitHub Cache support 
- ✅ GitHub artifacts support 
- ✅ NX Cloud support

## Table of Contents

- [Usage](#usage)
- [Contributors](#contributors-)

## Usage
Here's an example of a workflow file that uses both actions
```yaml
jobs:
  setup:
    runs-on: ubuntu-latest
    name: Affected Matrix
    outputs:
      hasChanges: ${{ steps.affected.outputs.hasChanges }}
      matrix: ${{ steps.affected.outputs.matrix }}
    steps:
      - name: Calculate affected projects
        uses: e-square-io/nx-affected-matrix@v2
        id: affected
        with:
          targets: 'test,build'
          maxDistribution: 3
          workingDirectory: ''
          args: ''

  execute:
    name: ${{ matrix.target }} (${{ matrix.distribution }})
    if: ${{ fromJSON(needs.setup.outputs.hasChanges) }}
    needs: [setup]
    runs-on: ubuntu-latest
    continue-on-error: ${{ matrix.target == 'test' }}
    strategy:
      fail-fast: false
      matrix: ${{ fromJSON(needs.setup.outputs.matrix) }}
    steps:
      # Checkout, cache, install node modules

      - name: Execute
        uses: e-square-io/nx-distributed-task@v2
        id: execute
        with:
          target: ${{ matrix.target }}
          projects: ${{ matrix.projects }}
          distribution: ${{ matrix.distribution }}
          uploadOutputs: true
          nxCloud: false
          args: ''
```

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):
<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/ronnetzer"><img src="https://avatars.githubusercontent.com/u/1116785?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Ron Netzer</b></sub></a><br /><a href="https://github.com/ronnetzer/nx-github-actions/commits?author=ronnetzer" title="Code">💻</a> <a href="#content-ronnetzer" title="Content">🖋</a> <a href="#design-ronnetzer" title="Design">🎨</a> <a href="https://github.com/ronnetzer/nx-github-actions/commits?author=ronnetzer" title="Documentation">📖</a> <a href="#ideas-ronnetzer" title="Ideas, Planning, & Feedback">🤔</a> <a href="#maintenance-ronnetzer" title="Maintenance">🚧</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

<div>Icons made by <a href="http://www.freepik.com/" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
