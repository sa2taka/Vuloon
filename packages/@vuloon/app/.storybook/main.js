const path = require('path');

module.exports = {
  stories: ['../src/**/*.stories.tsx'],
  addons: ['@storybook/addon-actions', '@storybool/controls', '@storybook/addon-links'],
  webpackFinal: async (config) => {
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      use: [
        {
          loader: require.resolve('ts-loader'),
        },
        {
          loader: require.resolve('react-docgen-typescript-loader'),
        },
      ],
    });

    config.module.rules.push({
      test: /\.(jpeg|png|gif|svg)$/,
      loader: 'file-loader?name=[name].[ext]',
    });

    config.resolve.alias['@'] = path.resolve(__dirname, '../src');
    config.resolve.alias['public'] = path.resolve(__dirname, '../public');
    config.resolve.extensions.push('.ts', '.tsx');
    return config;
  },
};
