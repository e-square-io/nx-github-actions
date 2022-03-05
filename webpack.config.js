module.exports = (config) => {
  config.resolve.alias = {
    prettier: '__mocks__/prettier/index.js',
  };
  config.externals = [
    '@angular-devkit/schematics',
    '@angular-devkit/schematics/tools',
    '@angular-devkit/core/node',
    '@angular-devkit/core',
    '@angular-devkit/build-angular/src/utils/version',
    '@angular-devkit/architect',
    '@angular-devkit/architect/node',
    ...(config.externals ?? []),
  ];

  return config;
};
