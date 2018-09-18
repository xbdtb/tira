const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const DEV = (process.env.NODE_ENV || 'development') === 'development';
const PUBLIC_PATH = process.env.PUBLIC_PATH || '/';
const SERVER_PORT = DEV ? require('./dist/server/config').config.serverPort : 4000;
const WEBPACK_DEV_PORT = SERVER_PORT - 100;

const entryConfig = [
  { name: 'loading', path: './client/loading/index.js' },
  { name: 'app', path: './client/index.js' },
];

function getEntry() {
  const entry = {};
  entryConfig.map((entryItem) => {
    entry[entryItem.name] =
      DEV && process.env.HOT
        ? [entryItem.path].concat(`webpack-hot-middleware/client?path=${PUBLIC_PATH}__webpack_hmr`)
        : [entryItem.path];
  });
  console.log(entry);
  return entry;
}

const webpackConfig = {
  name: 'client',
  target: 'web',
  mode: process.env.NODE_ENV || 'development',
  entry: getEntry(),
  output: {
    filename: `[name].[hash].js`,
    path: path.resolve(__dirname, 'dist/client'),
    publicPath: PUBLIC_PATH,
  },
  devtool: DEV ? 'source-map' : '',
  devServer: {
    port: WEBPACK_DEV_PORT,
    hot: true,
    hotOnly: true,
    inline: true,
    overlay: true,
    proxy: {
      '/': `http://localhost:${SERVER_PORT}`,
    },
  },
  resolve: {
    symlinks: true,
    modules: ['client', 'node_modules', path.join(__dirname, '../node_modules')],
    extensions: ['.web.js', '.js', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.js.map$/,
        use: {
          loader: 'ignore-loader',
        },
      },
      {
        test: /\.(js|jsx)$/,
        exclude: function(modulePath) {
          return /node_modules/.test(modulePath);
        },
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.svg(\?.*)?$/,
        loader: 'file-loader',
      },
      {
        test: /\.css$/,
        use: (DEV ? ['css-hot-loader'] : []).concat(
          ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: 'css-loader',
          }),
        ),
      },
      {
        test: /\.scss$/,
        use: (DEV ? ['css-hot-loader'] : []).concat(
          ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: [
              {
                loader: 'css-loader',
                options: {
                  sourceMap: DEV,
                  modules: true,
                  minimize: !DEV,
                  localIdentName: '[name]__[local]--[hash:base64:5]',
                },
              },
              {
                loader: 'postcss-loader',
                options: {
                  sourceMap: DEV,
                },
              },
              {
                loader: 'sass-loader',
                options: {
                  sourceMap: DEV,
                },
              },
            ],
          }),
        ),
      },
      {
        test: /\.less/,
        use: (DEV ? ['css-hot-loader'] : []).concat(
          ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: [
              {
                loader: 'css-loader',
                options: {
                  sourceMap: DEV,
                  modules: false,
                  minimize: !DEV,
                  localIdentName: '[name]__[local]--[hash:base64:5]',
                },
              },
              {
                loader: 'postcss-loader',
                options: {
                  sourceMap: DEV,
                },
              },
              {
                loader: 'less-loader',
                options: {
                  sourceMap: DEV,
                  javascriptEnabled: true,
                },
              },
            ],
          }),
        ),
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': { NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development') },
    }),
    new HtmlWebpackPlugin({
      template: 'client/index.html',
      hash: false,
      filename: 'index.html',
      inject: 'body',
      minify: {
        collapseWhitespace: false,
      },
      chunksSortMode: function(chunk1, chunk2) {
        const orders = ['loading', 'vendor', 'app'];
        const order1 = orders.indexOf(chunk1.names[0]);
        const order2 = orders.indexOf(chunk2.names[0]);

        return order1 - order2;
      },
    }),
    new ExtractTextPlugin({
      filename: DEV ? '[name].css' : '[name].[hash].css',
      disable: false,
      allChunks: true,
    }),
  ],
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all',
        },
      },
    },
  },
};

if (DEV) {
  const WriteFilePlugin = require('write-file-webpack-plugin');
  webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
  webpackConfig.plugins.push(new WriteFilePlugin());
} else {
  webpackConfig.performance = {
    maxAssetSize: 1200000,
    maxEntrypointSize: 1500000,
  };
}

module.exports = webpackConfig;
