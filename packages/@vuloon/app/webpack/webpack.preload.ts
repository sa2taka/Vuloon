import path from 'path';
import { Configuration } from 'webpack';
import ESLintPlugin from 'eslint-webpack-plugin';

const config: Configuration = {
  target: 'electron-renderer',
  mode: 'development',
  entry: path.resolve(__dirname, '../src/preload.ts'),
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'preload.js',
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: ['ts-loader'],
      },
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
    },
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },
  plugins: [new ESLintPlugin({})],
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
  },
};

export default config;
