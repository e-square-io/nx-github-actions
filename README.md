# NX Github Actions

[![MIT](https://img.shields.io/packagist/l/doctrine/orm.svg?style=flat-square)](LICENSE)
[![commitizen](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)](CONTRIBUTING.md#commit-message-format)
[![PRs](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](.github/PULL_REQUEST_TEMPLATE.md)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![All Contributors](https://img.shields.io/badge/all_contributors-0-orange.svg?style=flat-square)](#contributors-)


> A set of Github Actions for NX workspaces 

| project | version | description |
|:-------:|:-------:|:-------:|
| [@e-square/nx-affected-matrix] | [![GitHub Marketplace][monorepo-version-badge]][nx-affected-matrix-link] | Uses NX's affected utils to calculate the changes.  Outputs a matrix of the distributed tasks |
| [@e-square/nx-distributed-task] | [![GitHub Marketplace][monorepo-version-badge]][nx-distributed-task-link] | Execute each distributed task from the matrix generated from nx-affected-matrix action |

[monorepo-version-badge]: https://img.shields.io/github/package-json/v/e-square-io/nx-github-actions?color=light-green&label=Marketplace&logo=github&style=flat-square
[@e-square/nx-affected-matrix]: https://github.com/e-square-io/nx-github-actions/tree/main/packages/nx-affected-matrix
[nx-affected-matrix-link]: https://github.com/marketplace/actions/nx-affected-matrix
[@e-square/nx-distributed-task]: https://github.com/e-square-io/nx-github-actions/tree/main/packages/nx-distributed-task
[nx-distributed-task-link]: https://github.com/marketplace/actions/nx-distributed-task

## Features

- ✅ Distribution of tasks across multiple parallel jobs
- ✅ GitHub Cache support 
- ✅ GitHub artifacts support 
- ✅ NX Cloud support

## Table of Contents

- [Usage](#usage)
- [FAQ](#faq)
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
      - name: Checkout
        uses: actions/checkout@v2
        with:
          fetch-depth: 0 # important to have history for affected calculation
          
      # install node modules, cache etc

      - name: Calculate affected projects
        uses: e-square-io/nx-github-actions/dist/packages/nx-affected-matrix@v1
        id: affected
        with:
          targets: 'test,build'

  execute:
    name: ${{ matrix.target }} (${{ matrix.bucket }})
    if: ${{ needs.setup.outputs.hasChanges == 'true' }}
    needs: [setup]
    runs-on: ubuntu-latest
    continue-on-error: ${{ matrix.target == 'test' }}
    strategy:
      fail-fast: false
      matrix: ${{ fromJSON(needs.setup.outputs.matrix) }}
    steps:
      # Checkout, cache, install node modules

      - name: Execute
        uses: e-square-io/nx-github-actions/dist/packages/nx-distributed-task@v1
        id: execute
        with:
          target: ${{ matrix.target }}
          bucket: ${{ matrix.bucket }}
          projects: ${{ matrix.projects }}
```

## FAQ
**Q: I don't get the full affected list I expect to see**  
A: Make sure you checkout with `fetch-depth: 0` for affected-matrix job. It is required in order to pull the full commit history which is needed for the calculation.

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

<div>Icons made by <a href="http://www.freepik.com/" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
