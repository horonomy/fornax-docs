/**
 * Centralized docs interaction tracking (FORNX-330).
 *
 * Registered as a Docusaurus client module (docusaurus.config.ts
 * `clientModules`) -- the official mechanism for global client-side
 * behavior -- rather than scattering tracking calls across content/theme
 * files. page_view itself is handled entirely by
 * @docusaurus/plugin-google-gtag; this module only adds a few real,
 * existing-UI interaction events on top of it, via one delegated click
 * listener.
 *
 * Uses the dedicated Documentation GA4 stream already configured in
 * docusaurus.config.ts's `gtag` preset option; this module only ever calls
 * the already-defined global `gtag` -- it does not load or configure GA4
 * itself.
 *
 * Only ever sends the fixed, low-cardinality metadata below. Never raw
 * search text, copied code/command content, heading/link text, file paths,
 * repository names, tenant/org identity, prompts, credentials, or any
 * other user/content-derived string.
 *
 * Events NOT implemented here because no corresponding real UI exists on
 * this site today (do not invent UI solely to generate analytics events):
 * docs_search / docs_search_no_results (no search plugin configured),
 * docs_to_app_click / docs_to_marketing_click (no such links exist in the
 * navbar/footer), docs_feedback (no feedback widget), docs_version_switch
 * (site is not versioned), docs_tab_switch (no `<Tabs>` used in content).
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

function track(name: string, params?: Record<string, string>): void {
  if (typeof window === 'undefined' || !window.gtag) return
  if (params) {
    window.gtag('event', name, params)
  } else {
    window.gtag('event', name)
  }
}

/** Shell/install-command languages get their own event; anything else is generic code_copy. */
const INSTALL_LANGUAGES = new Set(['bash', 'sh', 'shell', 'zsh'])

function languageOfCodeBlock(copyButton: Element): string {
  const pre = copyButton.closest('pre')
  const codeEl = pre?.querySelector('code')
  const match = /language-(\w+)/.exec(codeEl?.className ?? '')
  return match ? match[1] : 'unknown'
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return

    // Docusaurus's built-in code-block copy-to-clipboard button.
    const copyButton = target.closest('button[class*="copyButton"]')
    if (copyButton) {
      const language = languageOfCodeBlock(copyButton)
      if (INSTALL_LANGUAGES.has(language)) {
        track('install_command_copy', { language, snippet_type: 'install' })
      } else {
        track('code_copy', { language, snippet_type: 'code' })
      }
      return
    }

    const link = target.closest('a[href]')
    if (!(link instanceof HTMLAnchorElement)) return

    // Docusaurus's default "On this page" table-of-contents sidebar.
    if (link.closest('.table-of-contents')) {
      track('docs_toc_click')
      return
    }

    if (link.href.includes('github.com')) {
      track('github_click')
      return
    }

    if (link.pathname === '/quick-start') {
      track('quickstart_click')
    }
  })
}

export {}
