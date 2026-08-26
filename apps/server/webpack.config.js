import path from 'path';
import { fileURLToPath } from 'url';
import nodeExternals from 'webpack-node-externals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '../../');

export default {
  target: 'node',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: path.resolve(__dirname, 'src/server.ts'),
  output: {
    path: path.resolve(workspaceRoot, 'dist/apps/server'),
    filename: 'server.js',
    clean: true,
    module: true,
    chunkFormat: 'module',
    uniqueName: 'ai-workflow-utils-server',
  },
  externals: [
    nodeExternals({
      importType: 'module',
      allowlist: [/@ai-workflow-utils/],
    }),
  ],
  optimization: {
    minimize: false,
    moduleIds: 'named',
    concatenateModules: false,
  },
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
        test: /\.[jt]sx?$/,
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
              '@babel/preset-typescript',
            ],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    extensionAlias: {
      '.js': ['.ts', '.js'],
      '.ts': ['.ts', '.js'],
    },
    alias: {
      '@ai-workflow-utils/shared-types': path.resolve(workspaceRoot, 'libs/shared-types/src/index.ts'),
      '@ai-workflow-utils/data': path.resolve(workspaceRoot, 'libs/data/src/index.ts'),
    },
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
