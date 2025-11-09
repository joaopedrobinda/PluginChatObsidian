const esbuild = require('esbuild');
const { copy } = require('esbuild-plugin-copy');
const process = require('process');

const isProduction = process.env.NODE_ENV === 'production';
const isWatch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['main.ts'],
  bundle: true,
  outfile: 'dist/main.js',
  external: ['obsidian', 'electron'],
  format: 'cjs',
  sourcemap: isProduction ? false : 'inline',
  minify: isProduction,
  plugins: [
    copy({
      // this is equal to process.cwd(), which is where you run the command
      resolveFrom: 'cwd',
      assets: [
        {
          from: ['./manifest.json'],
          to: ['./dist/manifest.json'],
        },
      ],
    }),
  ],
};

const build = async () => {
  try {
    if (isWatch) {
      const context = await esbuild.context(buildOptions);
      console.log('Watching for changes...');
      await context.watch();
    } else {
      await esbuild.build(buildOptions);
      console.log('Build successful!');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
};

build();