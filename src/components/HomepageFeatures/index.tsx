import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Evidence, not narration',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Fornax captures tool calls, exit codes, and transcripts immutably,
        before any claim is checked — never trusting an agent's own summary
        of what it did.
      </>
    ),
  },
  {
    title: 'Five honest states',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Every finding is <code>VERIFIED</code>, <code>UNVERIFIED</code>,{' '}
        <code>CONTRADICTED</code>, <code>REVIEW</code>, or{' '}
        <code>UNAVAILABLE</code> — never a made-up trust score, never
        collapsed to pass/fail.
      </>
    ),
  },
  {
    title: 'Local-first, no cloud required',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Capture, verification, status line, and dashboard all run on one
        local process with no cloud dependency on the critical path.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
