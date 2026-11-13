import { RuleTester } from 'oxlint/plugins-dev'

import { preferCxRule } from './prefer-cx.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } })
const error = { messageId: 'conditional' }

tester.run('conventions/prefer-cx', preferCxRule, {
  valid: [
    'const C = () => <div className={cx("base", active ? "full" : "small")} />',
    'const C = () => <div className={cx(active && "full", !active && "small")} />',

    'const C = () => <Button className={state => variants({className: isFunction(className) ? className(state) : className})} />',

    'const C = () => <div className={cx("base", {full: active, small: !active})} />',
    'const C = () => <div className={className} />',
    'const C = () => <div>{active ? "yes" : "no"}</div>',
  ],
  invalid: [
    { code: 'const C = () => <div className={active ? "full" : "small"} />', errors: [error] },
    {
      code: 'const C = () => <div className={cn("base", active ? "full" : "small")} />',
      errors: [error],
    },
    {
      code: 'const C = () => <div className={`base ${active ? "full" : "small"}`} />',
      errors: [error],
    },
  ],
})
