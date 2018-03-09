import path from 'path';
import webpack from 'webpack';
import mergeWith from 'lodash/mergeWith';
import createConstantConfig from './createConstantConfig';

export default (src, transform) => {
  const { DEBUG, VERBOSE, BASEDIR, GLOBALS } = createConstantConfig();

  const transformRule = (rule) => {
    const transformed = transform(rule);
    return transformed || rule;
  };

  const baseConfig = {
    target: null,

    mode: DEBUG ? 'development' : 'production',

    entry: {},

    output: {
      pathinfo: false,
      publicPath: '/',
      devtoolModuleFilenameTemplate: '[resource-path]',
    },

    module: {
      strictExportPresence: true,

      rules: [
        transformRule({
          include: path.join(BASEDIR, 'src'),
          test: /\.jsx?$/,
          loader: 'babel-loader',
          options: {
            cacheDirectory: DEBUG ? path.join(BASEDIR, 'tmp', 'babel') : false,
            babelrc: false,
            presets: [
              [
                'env',
                {
                  modules: false,
                  useBuiltIns: 'usage',
                  forceAllTransforms: !DEBUG,
                },
              ],
              'react',
            ],
            plugins: [
              'syntax-dynamic-import',
              'transform-decorators-legacy',
              'transform-class-properties',
              'transform-object-rest-spread',
              ...(DEBUG ? [] : ['transform-react-constant-elements']),
              ...(DEBUG ? [] : ['transform-react-inline-elements']),
              ...(DEBUG ? [] : ['transform-react-remove-prop-types']),
            ],
          },
        }),
        transformRule({
          include: path.join(BASEDIR, 'src'),
          test: /\.p?css$/,
          use: [
            {
              loader: 'isomorphic-style-loader',
            },
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                sourceMap: DEBUG,
                modules: true,
                localIdentName: DEBUG ? '[name]-[local]-[hash:base64:5]' : '[hash:base64:5]',
                minimize: DEBUG ? false : { discardComments: { removeAll: true } },
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                config: { path: path.join(BASEDIR, 'postcss.confg.js') },
              },
            },
          ],
        }),
        transformRule({
          include: [path.join(BASEDIR, 'src')],
          test: /\.(gif|jpe?g|png)$/,
          loader: 'url-loader',
          options: { name: DEBUG ? '[path][name].[ext]?[hash:8]' : '[hash:8].[ext]', limit: 1000 },
        }),
        transformRule({
          include: [path.join(BASEDIR, 'src')],
          test: /\.svg$/,
          loader: 'svg-inline-loader',
          options: { name: DEBUG ? '[path][name].[ext]?[hash:8]' : '[hash:8].[ext]', limit: 1000 },
        }),
        ...(DEBUG
          ? []
          : [
              transformRule({
                test: path.join(BASEDIR, 'node_modules', 'react-deep-force-update', 'lib', 'index.js'),
                loader: 'null-loader',
              }),
            ]),
      ],
    },

    plugins: [new webpack.DefinePlugin(GLOBALS)],

    externals: [],

    bail: !DEBUG,

    cache: DEBUG,

    stats: {
      cached: VERBOSE,
      cachedAssets: VERBOSE,
      chunks: VERBOSE,
      chunkModules: VERBOSE,
      colors: true,
      hash: VERBOSE,
      modules: VERBOSE,
      reasons: DEBUG,
      timings: true,
      version: VERBOSE,
    },

    node: {},

    devtool: DEBUG ? 'cheap-module-inline-source-map' : 'source-map',
  };

  return mergeWith(Object.assign({}, baseConfig), src, (objValue, srcValue) => {
    if (Array.isArray(objValue)) return [].concat(objValue, srcValue);
    return undefined;
  });
};
