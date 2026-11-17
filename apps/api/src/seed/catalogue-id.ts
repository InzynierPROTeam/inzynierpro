export const catalogueId = (prefix: string, index: number) =>
  `${prefix}000000-0000-4000-8000-${String(index).padStart(12, '0')}`
