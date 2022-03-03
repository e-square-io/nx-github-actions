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
  // config.resolve.alias = {
  //   '@angular-devkit/build-angular/src/utils/version': '__mocks__/@angular-devkit/build-angular/src/utils/version.js',
  // };
  config.module.parser = {
    javascript: { commonjsMagicComments: true },
  };
  // config.module.rules.unshift(dynamicRequireRule);
  config.module.noParse = /typescript|prettier/; //generators|compat|ngcli-adapter|nx-plugin
  config.externals = [
    'typescript',
    'prettier',
    '@angular-devkit/schematics',
    '@angular-devkit/schematics/tools',
    '@angular-devkit/architect',
    '@angular-devkit/architect/node',
    '@angular-devkit/core',
    '@angular-devkit/core/node',
    '@angular-devkit/build-angular/src/utils/version',
    ...(config.externals ?? []),
  ];

  console.log(JSON.stringify(config, null, 2));
  return config;
};
