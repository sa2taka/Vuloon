const { build } = require('esbuild');
const { dtsPlugin } = require('esbuild-plugin-d.ts');
const glob = require('glob');

const baseFolder = process.argv[2] || '.';

const entryPoints = glob.sync(`${baseFolder}/src/**/*.ts`);

build({
  entryPoints,
  outbase: `${baseFolder}/src`,
  outdir: `${baseFolder}/lib`,
  platform: 'node',
  format: 'cjs',
  plugins: [
    dtsPlugin({
      outDir: `${baseFolder}/lib`,
    }),
  ],
});
