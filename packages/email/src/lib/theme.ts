import { pixelBasedPreset, type TailwindConfig } from 'react-email'

// The light theme of apps/platform (styles/app.css). Email clients support neither oklch nor
// CSS variables, so colors are hex and sizes are pixels. Keep both in sync when the platform
// theme changes. The platform declares a warning color without a value, so it is left out.
export const tailwindConfig: TailwindConfig = {
  presets: [pixelBasedPreset],
  theme: {
    extend: {
      colors: {
        background: '#fcfdfe',
        foreground: '#0d1624',
        card: { DEFAULT: '#f9fafc', foreground: '#0d1624' },
        popover: { DEFAULT: '#ffffff', foreground: '#0d1624' },
        primary: { DEFAULT: '#297eff', foreground: '#ffffff' },
        secondary: { DEFAULT: '#162131', foreground: '#ffffff' },
        muted: { DEFAULT: '#f1f4f8', foreground: '#727881' },
        accent: { DEFAULT: '#eff4fc', foreground: '#21334f' },
        destructive: { DEFAULT: '#ea423c', foreground: '#ffffff' },
        success: { DEFAULT: '#00a14c', foreground: '#ffffff' },
        border: '#e3e6eb',
        input: '#cfd3d8',
        ring: '#297eff',
        chart: {
          1: '#a1c6ff',
          2: '#69a4ff',
          3: '#297eff',
          4: '#0b5ed0',
          5: '#0e4391',
        },
        sidebar: {
          DEFAULT: '#f9fbfe',
          foreground: '#0d1624',
          primary: '#297eff',
          'primary-foreground': '#ffffff',
          accent: '#ecf2fb',
          'accent-foreground': '#21334f',
          border: '#e3e6eb',
          ring: '#297eff',
        },
      },
      // --radius is 0.875rem (14px); the other sizes are multiples of it.
      borderRadius: {
        sm: '8.4px',
        md: '11.2px',
        lg: '14px',
        xl: '19.6px',
        '2xl': '25.2px',
        '3xl': '30.8px',
        '4xl': '36.4px',
      },
      maxWidth: {
        '4xs': '224px',
        '5xs': '192px',
        '6xs': '160px',
        '7xs': '128px',
        '8xs': '96px',
        '9xs': '64px',
        '4xl': '896px',
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '16px' }],
      },
      screens: {
        '3xs': '320px',
        '2xs': '384px',
        xs: '480px',
      },
      fontFamily: {
        sans: ['Nunito Sans', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
}
