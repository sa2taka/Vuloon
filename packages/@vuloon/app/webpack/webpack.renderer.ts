import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { Configuration } from 'webpack';
import ESLintPlugin from 'eslint-webpack-plugin';

const config: Configuration = {
  target: 'electron-renderer',
  mode: 'development',
  entry: path.resolve(__dirname, '../src/renderer.tsx'),
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'renderer.js',
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: ['ts-loader'],
      },
      {
        test: /\.(jpeg|png|gif|svg)$/,
        use: 'file-loader?name=[name].[ext]',
      },
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      public: path.resolve(__dirname, '../public'),
    },
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './public/index.html',
    }),
    new HtmlWebpackPlugin({
      filename: 'initial-setting.html',
      template: './public/initial-setting.html',
    }),
    new ESLintPlugin({}),
  ],
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
  },
};

export default config;
