import path from 'path';
import { fileURLToPath } from 'url';
import nodeExternals from 'webpack-node-externals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TODO: fix workaround for windows on line 54 copying files to root directory
export default {
  target: 'node',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './server/server.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'server.js',
    clean: true,
    module: true,
    chunkFormat: 'module',
  },
  externals: [
    nodeExternals({
      importType: 'module',
    }),
  ],
  experiments: {
    outputModule: true,
  },
  node: {
    __dirname: true,
    __filename: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {
                    node: '18',
                  },
                },
              ],
            ],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.json'],
  },
  optimization: {
    minimize: false,
  },
  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
  stats: {
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false,
  },
};
