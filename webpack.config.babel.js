import path from 'path';
import AssetsPlugin from 'assets-webpack-plugin';
import WorkboxPlugin from 'workbox-webpack-plugin';
import webpack from 'webpack';
import webpackNodeExternals from 'webpack-node-externals';
import createWebpackConfig from './lib/createWebpackConfig';
import createConstantConfig from './lib/createConstantConfig';

export default (options = {}) => {
  const { DEBUG, HOT } = createConstantConfig(options);

  return [
    // client
    createWebpackConfig(
      {
        name: 'client',

        target: 'web',

        entry: {
          client: ['regenerator-runtime/runtime', ...(HOT ? ['./lib/webpackHotDevClient'] : []), './src/client.js'],
        },

        output: {
          path: path.join(__dirname, 'tmp', 'build', 'public'),
          filename: DEBUG ? '[name].js' : '[name].[chunkhash:8].js',
          chunkFilename: DEBUG ? '[name].chunk.js' : '[name].[chunkhash:8].chunk.js',
        },

        module: {
          rules: [],
        },

        plugins: [
          new AssetsPlugin({
            path: path.join(__dirname, 'tmp', 'build'),
            filename: 'assets.json',
            prettyPrint: true,
            update: true,
          }),
          ...(DEBUG ? [] : [new WorkboxPlugin()]),
          ...(HOT ? [new webpack.HotModuleReplacementPlugin()] : []),
          ...(HOT ? [new webpack.NoEmitOnErrorsPlugin()] : []),
          ...(HOT ? [new webpack.NamedModulesPlugin()] : []),
        ],

        optimization: {
          splitChunks: {
            cacheGroups: {
              commons: {
                chunks: 'initial',
                test: /[\\/]node_modules[\\/]/,
                name: 'vendor',
              },
            },
          },
        },

        node: {
          fs: 'empty',
          net: 'empty',
          tls: 'empty',
        },
      },
      (rule) => {
        if (['babel-loader'].includes(rule.loader)) {
          Object.assign(rule.options.presets[0][1], { targets: { browsers: 'last 2 versions' } });
        }
        return rule;
      },
    ),

    // server
    createWebpackConfig(
      {
        name: 'server',

        target: 'node',

        entry: {
          server: ['./src/server.js'],
        },

        output: {
          path: path.join(__dirname, 'tmp', 'build'),
          filename: '[name].js',
          chunkFilename: 'chunks/[name].js',
          libraryTarget: 'commonjs2',
          ...(HOT ? { hotUpdateMainFilename: 'updates/[hash].hot-update.json' } : {}),
          ...(HOT ? { hotUpdateChunkFilename: 'updates/[id].[hash].hot-update.js' } : {}),
        },

        module: {
          rules: [],
        },

        plugins: [
          new webpack.BannerPlugin({ banner: 'require("source-map-support").install();', raw: true, entryOnly: false }),
          ...(HOT ? [new webpack.HotModuleReplacementPlugin()] : []),
          ...(HOT ? [new webpack.NoEmitOnErrorsPlugin()] : []),
          ...(HOT ? [new webpack.NamedModulesPlugin()] : []),
        ],

        externals: ['./assets.json', webpackNodeExternals()],

        node: {
          console: false,
          global: false,
          process: false,
          Buffer: false,
          __filename: false,
          __dirname: false,
        },
      },
      (rule) => {
        if (['babel-loader'].includes(rule.loader)) {
          Object.assign(rule.options.presets[0][1], { targets: { node: 'current' } });
        }
        if (['url-loader', 'file-loader'].includes(rule.loader)) {
          Object.assign(rule.options, { emitFile: true });
        }
        return rule;
      },
    ),
  ];
};
