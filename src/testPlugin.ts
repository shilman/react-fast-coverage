import type { Plugin } from 'vite';
import { loadCsf } from '@storybook/csf-tools';
import * as generate from '@babel/generator';

interface TestPluginOptions {}

const STORIES_REGEX = /(?<!node_modules.*)\.(story|stories)\.[tj]sx?$/;

const HEADER = `
import { createElement } from 'react';
import { it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { composeStory } from '@storybook/react';
`.trim();

const FOOTER_START = `it('should render', () => {`;
const FOOTER_END = `\n});`;

const metaVar = (meta: any) => {
  // FIXME: different module interop settings between test code & plugin code
  const gen = generate.default.default ?? generate.default;
  const { code } = gen(meta);
  return `\n  const __meta = ${code};`;
};

const renderOne = (storyName: string) =>
  `
  const ${storyName}Story = composeStory(${storyName}, __meta);
  // await ${storyName}Story.load()
  const { container } = render(createElement(${storyName}Story, {}));
  if(${storyName}Story.play) {
    await ${storyName}Story.play({canvasElement: container})
  }
`.trimEnd();

export const transformCSF = (code: string) => {
  const makeTitle = (userTitle: string) => userTitle || 'default';
  const csf = loadCsf(code, { makeTitle }).parse();
  const stories = Object.keys(csf._storyExports).map((name) => renderOne(name));
  const footer = [FOOTER_START, metaVar(csf._metaNode), ...stories, FOOTER_END].join('');
  const result = [HEADER, code, footer].join('\n');
  return result;
};

export default function pluginTest(options: TestPluginOptions): Plugin {
  return {
    name: 'test-plugin',
    transform(code, id) {
      return STORIES_REGEX.test(id) ? transformCSF(code) : code;
    },
  };
}
