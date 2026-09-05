/**
 * Wrap-swizzle of theme-classic's NotFound/Content (FORNX-330) -- the
 * official, minimal Docusaurus customization mechanism -- purely to fire a
 * docs_404_view event on mount. Renders the original component unchanged.
 */
import React, { useEffect, type ReactNode } from 'react'
import NotFoundContent from '@theme-original/NotFound/Content'
import type { Props } from '@theme/NotFound/Content'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export default function NotFoundContentWrapper(props: Props): ReactNode {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'docs_404_view')
    }
  }, [])

  return <NotFoundContent {...props} />
}
