/**
 * @see https://github.com/webpack/webpack/issues/4175#issuecomment-695767880
 */
const dynamicRequireRule = {
  test: /\.js$/,
  include: /node_modules\/@nrwl|node_modules\/yargs-parser/,
  loader: 'string-replace-loader',
  enforce: 'pre',
  options: {
    // match a require function call where the argument isn't a string literal
    search: 'require\\(\\s*(?![\'"])|require\\.resolve',
    replace(match) {
      if (match === 'require.resolve') return `__non_webpack_require__.resolve`;
      return `require(/* webpackIgnore: true */`;
    },

    flags: 'g',
  },
};

module.exports = (config, context) => {
  config.module.parser = {
    javascript: { commonjsMagicComments: true },
  };
  config.module.noParse =
    /enquirer|typescript|nx-plugins|daemon|generators|executors|ngcli-adapter|compat|convert-nx-executor/;
  // config.module.rules.unshift(dynamicRequireRule);
  // config.externals = [
  //   'typescript',
  //   'prettier',
  //   '@nrwl/node',
  //   '@nrwl/jest',
  //   '@nrwl/nx-cloud',
  //   '@nrwl/eslint-plugin-nx',
  //   '@nrwl/workspace',
  //   '@nrwl/tao',
  //   '@nrwl/devkit',
  //   '@nrwl/cli',
  //   '@nrwl/nx',
  //   ...(config.externals ?? []),
  // ];

  // console.log(JSON.stringify(config, null, 2));
  return config;
};
