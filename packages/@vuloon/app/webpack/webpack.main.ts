import path from 'path';
import { Configuration } from 'webpack';
import ESLintPlugin from 'eslint-webpack-plugin';

const config: Configuration = {
  target: 'electron-main',
  mode: 'development',
  entry: path.resolve(__dirname, '../src/main.ts'),
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'main.js',
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: false,
            },
          },
        ],
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
};

export default config;
