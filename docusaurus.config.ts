import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Fornax',
  tagline: 'Evidence-first agent-integrity for coding agents',
  favicon: 'img/favicon.ico',

  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Canonical hostname per FORNX-328 ("Fornax domain migration to the
  // Horonomy company constitution"), superseding FORNX-43/FORNX-154's
  // earlier horo.run-only convention: human-facing public docs now live on
  // docs.fornax.horonom.com. Runtime/API/ingest boundaries are unaffected
  // and stay on horo.run by design. docs.fornax.horo.run still aliases to
  // the same Cloudflare Pages deployment but is no longer canonical.
  url: 'https://docs.fornax.horonom.com',
  baseUrl: '/',

  organizationName: 'horonomy',
  projectName: 'fornax-docs',

  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/', // Docs are the whole site — no /docs prefix.
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/horonomy/fornax-docs/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Fornax',
      logo: {
        alt: 'Fornax logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://github.com/horonomy/fornax-core',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {label: 'Introduction', to: '/intro'},
            {label: 'Quick Start', to: '/quick-start'},
            {label: 'Troubleshooting', to: '/troubleshooting'},
          ],
        },
        {
          title: 'Fornax',
          items: [
            {label: 'fornax-core (GitHub)', href: 'https://github.com/horonomy/fornax-core'},
            {label: 'fornax-docs (GitHub)', href: 'https://github.com/horonomy/fornax-docs'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Horonomy. Fornax docs built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
