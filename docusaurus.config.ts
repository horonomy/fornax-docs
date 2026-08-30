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

  // Canonical hostname per FORNX-43 ("Fornax Cloudflare product-domain
  // topology") and FORNX-154's Beta-surface scope: docs.fornax.horo.run,
  // a dedicated docs site (not fornax.horo.run/docs). This supersedes the
  // single-site pattern fornax-core's ADR 0002 originally recorded — that
  // ADR flags itself as not yet reconciled with FORNX-43; the amendment is
  // fornax-core's to make, not this repo's. DNS/routing for this hostname
  // is not live yet (confirmed via `dig`, no records as of 2026-08-30) —
  // this is the intended hostname, not a live deploy.
  url: 'https://docs.fornax.horo.run',
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
