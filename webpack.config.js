'use strict';

const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const WarningsToErrorsPlugin = require('warnings-to-errors-webpack-plugin');

/**@type {import('webpack').Configuration}*/
const config = {
  target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
  node: {
    __dirname: false,
    __filename: false,
  },
  entry: './src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]',
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode', // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: ['.ts', '.js'],
  },
  module: {
    parser: {
      javascript: {
        commonjsMagicComments: true,
      },
    },
    rules: [
      {
        enforce: 'pre',
        test: /@commitlint[\/\\]load[\/\\]lib[\/\\]utils[\/\\]load-plugin\.js/,
        loader: 'string-replace-loader',
        options: {
          multiple: [
            {
              search: 'plugin = require(longName);',
              replace: 'plugin = __non_webpack_require__(longName);',
              strict: true,
            },
            {
              search: /require.resolve\(longName\);/g,
              replace: '__non_webpack_require__.resolve(longName);',
              strict: true,
            },
            {
              search: 'version = require(`${longName}/package.json`).version;',
              replace:
                'version = __non_webpack_require__(`${longName}/package.json`).version;',
              strict: true,
            },
          ],
        },
      },
      {
        enforce: 'pre',
        test: /@commitlint[\/\\]load[\/\\]lib[\/\\]load\.js/,
        loader: 'string-replace-loader',
        options: {
          search: 'parserOpts: require(resolvedParserPreset),',
          replace: 'parserOpts: __non_webpack_require__(resolvedParserPreset),',
          strict: true,
        },
      },
      {
        enforce: 'pre',
        test: /@commitlint[\/\\]resolve-extends[\/\\]lib[\/\\]index\.js/,
        loader: 'string-replace-loader',
        options: {
          multiple: [
            {
              search: 'const load = context.require || require;',
              replace:
                'const load = context.require || __non_webpack_require__;',
              strict: true,
            },
            {
              search: 'parserOpts: require(resolvedParserPreset),',
              replace:
                'parserOpts: __non_webpack_require__(resolvedParserPreset),',
              strict: true,
            },
          ],
        },
      },
      {
        enforce: 'pre',
        test: /resolve-global[\/\\]index\.js/,
        loader: 'string-replace-loader',
        options: {
          search: /require.resolve/g,
          replace: '__non_webpack_require__.resolve',
          strict: true,
        },
      },
      {
        enforce: 'pre',
        test: /import-fresh[\/\\]index\.js/,
        loader: 'string-replace-loader',
        options: {
          multiple: [
            {
              search: 'const parentPath = parentModule(__filename);',
              replace: 'const parentPath = parentModule(__filename) || "";',
              strict: true,
            },
            {
              search: / require\(filePath\)/g,
              replace: ' __non_webpack_require__(filePath)',
              strict: true,
            },
          ],
        },
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              compilerOptions: {
                sourceMap: true,
              },
            },
          },
        ],
      },
    ],
  },
  optimization: {
    minimize: false,
  },
  plugins: [new WarningsToErrorsPlugin(), new CleanWebpackPlugin()],
};

module.exports = config;
