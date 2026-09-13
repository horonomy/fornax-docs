import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Evidence, not narration',
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
    description: (
      <>
        Capture, verification, status line, and dashboard all run on one
        local process with no cloud dependency on the critical path.
      </>
    ),
  },
];

function Feature({title, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4', styles.feature)}>
      <div>
        <Heading as="h2" className={styles.featureTitle}>{title}</Heading>
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
