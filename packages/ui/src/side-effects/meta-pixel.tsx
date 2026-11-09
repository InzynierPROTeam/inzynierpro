type Pixel = ((...args: string[]) => void) & {
  queue: string[][]
  loaded: boolean
  version: string
  callMethod?: (...args: string[]) => void
}

declare global {
  interface Window {
    fbq?: Pixel
    _fbq?: Pixel
  }
}

const initializedPixels = new Set<string>()

export function setMetaPixelConsent(pixelId: string, allowed: boolean) {
  if (!/^\d+$/.test(pixelId)) {
    return
  }

  if (!allowed) {
    window.fbq?.('consent', 'revoke')

    return
  }

  if (!window.fbq) {
    const queue: string[][] = []

    const pixel: Pixel = Object.assign(
      (...args: string[]) => {
        if (pixel.callMethod) {
          pixel.callMethod(...args)
        } else {
          queue.push(args)
        }
      },
      { queue, loaded: true, version: '2.0' },
    )

    window.fbq = pixel
    window._fbq ??= pixel

    const script = document.createElement('script')
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.append(script)
  }

  window.fbq('consent', 'grant')

  if (!initializedPixels.has(pixelId)) {
    window.fbq('init', pixelId)
    window.fbq('track', 'PageView')
    initializedPixels.add(pixelId)
  }
}
