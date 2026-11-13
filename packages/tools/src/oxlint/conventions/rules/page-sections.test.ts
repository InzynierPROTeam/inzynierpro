import { RuleTester } from 'oxlint/plugins-dev'

import { pageSectionsRule } from './page-sections.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } })
const filename = '/repo/apps/platform/src/features/home/HomePage.tsx'
const prefix = "import { HeroSection } from './components/HeroSection'; "
const error = { messageId: 'sections' }

tester.run('conventions/page-sections', pageSectionsRule, {
  valid: [
    { filename, code: prefix + 'export const HomePage = () => <HeroSection />' },
    {
      filename,
      code: prefix + 'export function HomePage() { return <><HeroSection /><HeroSection /></> }',
    },
    {
      filename,
      code: prefix + 'export const HomePage = () => active ? <HeroSection /> : <HeroSection />',
    },
    {
      filename: '/repo/apps/platform/src/features/home/components/HeroSection.tsx',
      code: 'export const HeroSection = () => <section><h1>Title</h1></section>',
    },
  ],
  invalid: [
    {
      filename,
      code: prefix + 'export const HomePage = () => <HeroSection><div /></HeroSection>',
      errors: [error],
    },
    { filename, code: prefix + 'export default function () { return <div /> }', errors: [error] },
    {
      filename,
      code: prefix + 'export const HomePage = () => <section><HeroSection /></section>',
      errors: [error],
    },
    {
      filename,
      code:
        prefix +
        'export const HomePage = () => { const data = useData(); return <HeroSection data={data} /> }',
      errors: [error],
    },
    {
      filename,
      code: "import { Hero } from './components/Hero'; export const HomePage = () => <Hero />",
      errors: [error],
    },
    {
      filename,
      code: "import { HeroSection } from '../other/components/HeroSection'; export const HomePage = () => <HeroSection />",
      errors: [error],
    },
    { filename, code: prefix + 'export default () => <div />', errors: [error] },
  ],
})
