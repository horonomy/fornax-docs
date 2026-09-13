/**
 * Theme-classic NotFound content adapted under its MIT license.
 * Copyright (c) Facebook, Inc. and its affiliates.
 */
import {useEffect, type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import Heading from '@theme/Heading';
import type {Props} from '@theme/NotFound/Content';
import styles from './styles.module.css';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export default function NotFoundContentWrapper(props: Props): ReactNode {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'docs_404_view');
    }
  }, []);

  return (
    <main className={clsx('container margin-vert--xl', props.className)}>
        <div className="row"><div className="col col--6 col--offset-3">
          <Heading as="h1" className="hero__title">
            <Translate id="theme.NotFound.title" description="The title of the 404 page">Page Not Found</Translate>
          </Heading>
          <p><Translate id="theme.NotFound.p1" description="The first paragraph of the 404 page">We could not find what you were looking for.</Translate></p>
          <p><Translate id="theme.NotFound.p2" description="The 2nd paragraph of the 404 page">Please contact the owner of the site that linked you to the original URL and let them know their link is broken.</Translate></p>
          <nav aria-label="Documentation recovery" className={styles.actions}>
            <Link className="button button--primary" to="/">Docs home</Link>
            <Link className="button button--outline button--primary" to="/quick-start">Quick Start</Link>
          </nav>
        </div></div>
    </main>
  );
}
