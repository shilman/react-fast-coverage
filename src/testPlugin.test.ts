import { it, expect } from 'vitest';
import { dedent } from 'ts-dedent';
import { transformCSF } from './testPlugin';

it('should transform CSF', () => {
  expect(
    transformCSF(dedent`
      import type { Meta, StoryObj } from '@storybook/react';
      import DefaultComponent from './DefaultComponent';
      
      const meta = {
        component: DefaultComponent,
      } satisfies Meta<typeof DefaultComponent>;
      export default meta;
      
      type Story = StoryObj<typeof meta>;
      
      export const Default: Story = {};
      export const Foo: Story = { args: { foo: true } };
  `)
  ).toMatchInlineSnapshot(`
    "import { createElement } from 'react';
    import { it, expect } from 'vitest';
    import { render } from '@testing-library/react';
    import { composeStory } from '@storybook/react';
    import type { Meta, StoryObj } from '@storybook/react';
    import DefaultComponent from './DefaultComponent';

    const meta = {
      component: DefaultComponent,
    } satisfies Meta<typeof DefaultComponent>;
    export default meta;

    type Story = StoryObj<typeof meta>;

    export const Default: Story = {};
    export const Foo: Story = { args: { foo: true } };
    it('should render', () => {
      const __meta = {
      component: DefaultComponent
    };
      const DefaultStory = composeStory(Default, __meta);
      render(createElement(DefaultStory, {}));
      const FooStory = composeStory(Foo, __meta);
      render(createElement(FooStory, {}));
    });"
  `);
});
