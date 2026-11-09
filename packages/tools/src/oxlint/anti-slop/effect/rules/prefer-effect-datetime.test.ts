import { RuleTester } from 'oxlint/plugins-dev'

import { preferEffectDateTimeRule } from './prefer-effect-datetime.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } })
const error = { messageId: 'nativeDateTime' }

tester.run('anti-slop-effect/prefer-effect-datetime', preferEffectDateTimeRule, {
  valid: [
    'import { Clock, Effect } from "effect"; Effect.runSync(Clock.currentTimeMillis);',
    'import { DateTime } from "effect"; DateTime.makeUnsafe("2026-01-01T00:00:00Z");',
    'import { DateTime } from "effect"; DateTime.format(date, { year: "numeric" });',
    'type NativeDate = Date; type Formatter = Intl.DateTimeFormat;',
    'type NativeDateConstructor = typeof Date;',
    'Intl.NumberFormat("en");',
    'const Date = class {}; new Date();',
    'function current(Date: { now(): number }) { return Date.now(); }',
    'const Intl = { DateTimeFormat() {} }; Intl.DateTimeFormat();',
    'function format(Intl: { DateTimeFormat(): string }) { return Intl.DateTimeFormat(); }',
    'function create(window: { Date: new () => object }) { return new window.Date(); }',
    'const globalThis = { Date: { now() { return 0 } } }; globalThis.Date.now();',
    'const app = { Date: { now() { return 0 } } }; app.Date.now();',
    'const app = { Intl: { DateTimeFormat() {} } }; app.Intl.DateTimeFormat();',
  ],
  invalid: [
    { code: 'new Date();', errors: [error] },
    { code: 'new Date("2026-01-01");', errors: [error] },
    { code: 'Date();', errors: [error] },
    { code: 'Date.now();', errors: [error] },
    { code: 'Date.parse("2026-01-01");', errors: [error] },
    { code: 'Date.UTC(2026, 0, 1);', errors: [error] },
    { code: 'Date["now"]();', errors: [error] },
    { code: 'Date?.now?.();', errors: [error] },
    { code: 'const now = Date.now;', errors: [error] },
    { code: 'const { now } = Date;', errors: [error] },
    { code: 'const NativeDate = Date; new NativeDate();', errors: [error] },
    { code: 'new (Date as DateConstructor)();', errors: [error] },
    { code: '(Date as DateConstructor).now();', errors: [error] },
    { code: 'new globalThis.Date();', errors: [error] },
    { code: 'new window.Date();', errors: [error] },
    { code: 'global.Date.now();', errors: [error] },
    { code: 'self.Date.now();', errors: [error] },
    { code: 'globalThis["Date"]["now"]();', errors: [error] },
    { code: 'new Intl.DateTimeFormat("en");', errors: [error] },
    { code: 'Intl.DateTimeFormat("en");', errors: [error] },
    { code: 'Intl["DateTimeFormat"]("en");', errors: [error] },
    { code: 'Intl?.DateTimeFormat?.("en");', errors: [error] },
    { code: 'new globalThis.Intl.DateTimeFormat("en");', errors: [error] },
    { code: 'const format = window.Intl.DateTimeFormat;', errors: [error] },
  ],
})
