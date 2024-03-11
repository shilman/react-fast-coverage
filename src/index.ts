#!/usr/bin/env node

import { existsSync } from 'fs';
import { join } from 'path';
import { program } from 'commander';
import { startVitest } from 'vitest/node';
import react from '@vitejs/plugin-react';
import testPlugin from './testPlugin';

const logger = console;

const ROOT = './services/webapp/components/';

let setupFiles: string | undefined = join(ROOT, '.storybook', 'setup.js');
if (!existsSync(setupFiles)) {
  setupFiles = undefined;
}

const main = async (options: any) => {
  console.log(process.cwd());
  const vitest = await startVitest(
    'test',
    [],
    {
      root: ROOT,
      setupFiles,
      include: ['**/*.stories.tsx'],
      environment: 'happy-dom',
      coverage: {
        provider: 'v8',
        enabled: true,
        reporter: ['text-summary'],
      },
      watch: false,
    },
    {
      plugins: [react(), testPlugin({})],
    }
  );
  await vitest?.close();
};

program
  .name('react-story-gen')
  .description('Automatically generate stories for your React components');
//.argument('<components>', 'glob pattern for your component fiiles');

program.parse(process.argv);
main({
  ...program.opts(),
  components: program.args[0],
})
  .then(() => {
    logger.log('done');
  })
  .catch((err) => {
    logger.error(err);
  });
