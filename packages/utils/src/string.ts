export const getInitials = (value: string, locale: string) =>
  value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0))
    .join('')
    .toLocaleUpperCase(locale)
