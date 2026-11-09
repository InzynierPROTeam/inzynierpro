export type SeoArgs = {
  title?: string
  titleSuffix?: string | null
  description?: string
  image?: string
  keywords?: string
  url?: string
  locale?: string
  siteName?: string
}

const getTitle = ({ title, titleSuffix }: SeoArgs) => {
  if (title && titleSuffix) {
    return `${title} | ${titleSuffix}`
  }

  return title ?? titleSuffix ?? ''
}

export const seoFactory =
  (defaults: SeoArgs) =>
  (overrides: SeoArgs = {}) => {
    const args = { ...defaults, ...overrides }
    const title = getTitle(args)

    return [
      { title },
      { name: 'twitter:title', content: title },
      { name: 'og:title', content: title },
      { name: 'og:type', content: 'website' },
      { name: 'og:site_name', content: args.siteName ?? args.titleSuffix ?? title },
      { name: 'og:locale', content: args.locale ?? 'en' },
      { name: 'robots', content: 'index, follow' },
      ...(args.description
        ? [
            { name: 'description', content: args.description },
            { name: 'twitter:description', content: args.description },
            { name: 'og:description', content: args.description },
          ]
        : []),
      ...(args.keywords ? [{ name: 'keywords', content: args.keywords }] : []),
      ...(args.url ? [{ name: 'og:url', content: args.url }] : []),
      ...(args.image
        ? [
            { name: 'twitter:image', content: args.image },
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'og:image', content: args.image },
            { name: 'og:image:width', content: '1200' },
            { name: 'og:image:height', content: '630' },
            { name: 'og:image:type', content: 'image/png' },
          ]
        : []),
    ]
  }

export const getCanonicalHref = (href: string, baseUrl: string) => {
  const url = new URL(href, baseUrl)
  url.search = ''
  url.hash = ''

  url.pathname = `${url.pathname.replace(/\/+$/, '')}/`

  return url.href
}
