import path from 'path';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import WarningsToErrorsPlugin from 'warnings-to-errors-webpack-plugin';

// Suppress "Critical dependency" warnings emitted by @commitlint and its
// transitive dependencies (cosmiconfig, import-fresh, jiti, typescript).
// These packages use dynamic require() / import() calls whose targets are
// resolved at runtime against the user's workspace node_modules. Webpack
// cannot statically analyse them, but they are intentionally runtime-only
// and do not affect the correctness of the bundle.
const RUNTIME_DYNAMIC_REQUIRE_MODULES =
  /@commitlint[/\\]|cosmiconfig[/\\]|import-fresh[/\\]|jiti[/\\]|typescript[/\\]/;

class SuppressRuntimeDynamicRequireWarningsPlugin {
  /** @param {import('webpack').Compiler} compiler */
  apply(compiler) {
    compiler.hooks.compilation.tap(
      'SuppressRuntimeDynamicRequireWarningsPlugin',
      /** @param {import('webpack').Compilation} compilation */
      (compilation) => {
        compilation.hooks.afterSeal.tap(
          'SuppressRuntimeDynamicRequireWarningsPlugin',
          () => {
            compilation.warnings = compilation.warnings.filter((warning) => {
              const isFromKnownModule =
                warning.module &&
                RUNTIME_DYNAMIC_REQUIRE_MODULES.test(
                  warning.module.userRequest || warning.module.resource || '',
                );
              const isCriticalDependency =
                warning.message &&
                warning.message.includes('Critical dependency');
              return !(isFromKnownModule && isCriticalDependency);
            });
          },
        );
      },
    );
  }
}

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
    path: path.resolve(import.meta.dirname, 'dist'),
    filename: 'extension.js',
    module: true,
    devtoolModuleFilenameTemplate: '../[resource-path]',
  },
  experiments: {
    outputModule: true,
  },
  devtool: 'source-map',
  externals: {
    vscode: 'module vscode', // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
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
  plugins: [
    new SuppressRuntimeDynamicRequireWarningsPlugin(),
    new WarningsToErrorsPlugin(),
    new CleanWebpackPlugin(),
  ],
};

export default config;
