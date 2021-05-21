'use strict';
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
var __await =
  (this && this.__await) ||
  function (v) {
    return this instanceof __await ? ((this.v = v), this) : new __await(v);
  };
var __asyncGenerator =
  (this && this.__asyncGenerator) ||
  function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator)
      throw new TypeError('Symbol.asyncIterator is not defined.');
    var g = generator.apply(thisArg, _arguments || []),
      i,
      q = [];
    return (
      (i = {}),
      verb('next'),
      verb('throw'),
      verb('return'),
      (i[Symbol.asyncIterator] = function () {
        return this;
      }),
      i
    );
    function verb(n) {
      if (g[n])
        i[n] = function (v) {
          return new Promise(function (a, b) {
            q.push([n, v, a, b]) > 1 || resume(n, v);
          });
        };
    }
    function resume(n, v) {
      try {
        step(g[n](v));
      } catch (e) {
        settle(q[0][3], e);
      }
    }
    function step(r) {
      r.value instanceof __await
        ? Promise.resolve(r.value.v).then(fulfill, reject)
        : settle(q[0][2], r);
    }
    function fulfill(value) {
      resume('next', value);
    }
    function reject(value) {
      resume('throw', value);
    }
    function settle(f, v) {
      if ((f(v), q.shift(), q.length)) resume(q[0][0], q[0][1]);
    }
  };
var __spreadArrays =
  (this && this.__spreadArrays) ||
  function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++)
      s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
        r[k] = a[j];
    return r;
  };
exports.__esModule = true;
exports.generatePackageJson = void 0;
var devkit_1 = require('@nrwl/devkit');
var child_process_1 = require('child_process');
var create_package_json_1 = require('@nrwl/workspace/src/utilities/create-package-json');
var fileutils_1 = require('@nrwl/workspace/src/utilities/fileutils');
var path_1 = require('path');
var project_graph_1 = require('@nrwl/workspace/src/core/project-graph');
var assets_1 = require('@nrwl/workspace/src/utilities/assets');
function normalizeOptions(opts, context) {
  var _a;
  var projectRoot = path_1.resolve(
    context.workspace.projects[context.projectName].root
  );
  return __assign(__assign({}, opts), {
    fileReplacements: [],
    assets: __spreadArrays(
      (_a = opts.assets) !== null && _a !== void 0 ? _a : [],
      [opts.actionPath]
    ),
    root: path_1.resolve(context.root),
    projectRoot: projectRoot,
    sourceRoot: path_1.resolve(projectRoot, 'src'),
    tsConfig: path_1.resolve(projectRoot, 'tsconfig.lib.ts'),
    main: path_1.resolve(opts.main),
    outputPath: path_1.resolve(opts.outputPath),
  });
}
function generatePackageJson(projectName, graph, options) {
  var packageJson = create_package_json_1.createPackageJson(
    projectName,
    graph,
    options
  );
  packageJson.main = './src/' + path_1.basename(options.main, 'js');
  delete packageJson.devDependencies;
  fileutils_1.writeJsonFile(options.outputPath + '/package.json', packageJson);
  devkit_1.logger.info('Done writing package.json to dist');
}
exports.generatePackageJson = generatePackageJson;
function runNccCommand(opts) {
  return __awaiter(this, void 0, void 0, function () {
    var args, pack, processExitListener;
    return __generator(this, function (_a) {
      args = ['-o ' + opts.outputPath + '/src'];
      if (opts.watch) {
        args.push('-w');
      }
      if (opts.sourceMap) {
        args.push('-s --no-source-map-register');
      }
      pack = child_process_1.exec(
        'npx ncc build ' + opts.main + ' ' + args.join(' ')
      );
      processExitListener = function () {
        return pack.kill();
      };
      process.on('exit', processExitListener);
      process.on('SIGTERM', processExitListener);
      pack.stdout.on('data', function (chunk) {
        devkit_1.logger.info(chunk);
      });
      pack.stderr.on('data', function (chunk) {
        devkit_1.logger.fatal(chunk);
      });
      return [
        2 /*return*/,
        new Promise(function (res) {
          pack.on('exit', function (code) {
            if (code == 0) {
              res({ success: true });
            } else {
              res({ success: false });
            }
          });
        }),
      ];
    });
  });
}
function packageExecutor(options, context) {
  return __asyncGenerator(this, arguments, function packageExecutor_1() {
    var opts, promise, e_1;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          opts = normalizeOptions(options, context);
          _a.label = 1;
        case 1:
          _a.trys.push([1, 6, , 9]);
          promise = runNccCommand(opts);
          return [
            4 /*yield*/,
            __await(
              assets_1.copyAssetFiles(
                assets_1.assetGlobsToFiles(
                  opts.assets,
                  opts.root,
                  opts.outputPath
                )
              )
            ),
          ];
        case 2:
          _a.sent();
          generatePackageJson(
            context.projectName,
            project_graph_1.createProjectGraph(),
            opts
          );
          return [4 /*yield*/, __await({ success: true })];
        case 3:
          return [4 /*yield*/, _a.sent()];
        case 4:
          _a.sent();
          return [4 /*yield*/, __await(promise)];
        case 5:
          return [2 /*return*/, _a.sent()];
        case 6:
          e_1 = _a.sent();
          devkit_1.logger.error(e_1);
          return [4 /*yield*/, __await({ success: false })];
        case 7:
          return [4 /*yield*/, _a.sent()];
        case 8:
          _a.sent();
          return [3 /*break*/, 9];
        case 9:
          return [2 /*return*/];
      }
    });
  });
}
exports['default'] = packageExecutor;
