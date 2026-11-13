import { RuleTester } from 'oxlint/plugins-dev'

import { namedComponentPropsRule } from './named-component-props.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } })
const filename = '/repo/apps/platform/src/components/Card.tsx'
const error = { messageId: 'props' }

tester.run('conventions/named-component-props', namedComponentPropsRule, {
  valid: [
    {
      filename,
      code: 'type CardProps = { title: string }; export const Card: React.FC<CardProps> = ({ title }) => <div>{title}</div>',
    },
    {
      filename,
      code: 'type CardProps<T> = { item: T }; export function Card<T>({ item }: CardProps<T>) { return <div /> }',
    },
    { filename, code: 'export const Card = () => <div />' },
    { filename, code: 'const format = (input: { title: string }) => input.title' },
  ],
  invalid: [
    {
      filename,
      code: 'export const Card = ({ title }: { title: string }) => <div />',
      errors: [error],
    },
    {
      filename,
      code: 'export function Card({ title }: BaseProps & { title: string }) { return <div /> }',
      errors: [error],
    },
    {
      filename,
      code: 'export const Card: React.FC<{ title: string }> = ({ title }) => <div />',
      errors: [error],
    },
    {
      filename,
      code: 'export function Card<T>({ item }: { item: T }) { return <div /> }',
      errors: [error],
    },
    {
      filename: '/repo/packages/ui/src/components/card.tsx',
      code: 'function Card(props: React.ComponentProps<"div"> & { size: string }) { return <div /> }',
      errors: [error],
    },
  ],
})
