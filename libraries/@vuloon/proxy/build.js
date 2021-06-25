const { build } = require('esbuild');
const glob = require('glob');

const baseFolder = process.argv[2] || '.';

const entryPoints = glob.sync(`${baseFolder}/src/**/*.ts`);

build({
  entryPoints,
  outbase: `${baseFolder}/src`,
  outdir: `${baseFolder}/lib`,
  platform: 'node',
});
