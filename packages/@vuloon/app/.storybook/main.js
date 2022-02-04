const path = require('path');

module.exports = {
  core: {
    builder: 'webpack5',
  },
  stories: ['../src/**/*.stories.tsx'],
  addons: ['@storybook/addon-actions', '@storybook/addon-controls', '@storybook/addon-links'],
  webpackFinal: async (config) => {
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      use: 'ts-loader',
    });

    config.module.rules.push({
      test: /\.(jpeg|png|gif|svg)$/,
      use: 'file-loader?name=[name].[ext]',
    });

    config.resolve.alias['@'] = path.resolve(__dirname, '../src');
    config.resolve.alias['public'] = path.resolve(__dirname, '../public');
    config.resolve.extensions.push('.ts', '.tsx');

    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    };

    return config;
  },
};
