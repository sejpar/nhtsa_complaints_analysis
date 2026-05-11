import styles from './About.module.css';

const SKILLS = [
  { name: 'Python / Pandas', pct: 95 },
  { name: 'SQL / BigQuery',  pct: 88 },
  { name: 'D3.js / Vega',    pct: 80 },
  { name: 'Machine learning',pct: 75 },
  { name: 'NLP · text mining', pct: 70 },
];

const LINKS = [
  { label: 'Email',       href: 'mailto:hello@example.com' },
  { label: 'GitHub',      href: 'https://github.com'       },
  { label: 'LinkedIn',    href: 'https://linkedin.com'     },
  { label: 'Resume PDF',  href: '#'                        },
];

export default function About() {
  return (
    <>
      <section id="about" className={styles.about}>
        <div>
          <h2 className={styles.heading}>
            Turning<br />
            <em>raw data</em><br />
            into clarity.
          </h2>
          <p className={styles.body}>
            This project analyzes over 847,000 NHTSA vehicle complaints filed between 2010 and
            2024. Using Python, Pandas, and D3.js, I extracted patterns across make, model,
            component, and geography to surface actionable safety signals that regulators and
            consumers can act on.
          </p>
          <div className={styles.skills}>
            {SKILLS.map(({ name, pct }) => (
              <div key={name} className={styles.skillRow}>
                <span className={styles.skillName}>{name}</span>
                <div className={styles.skillTrack}>
                  <div className={styles.skillFill} style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.contact}>
          <p className={styles.contactIntro}>Get in touch</p>
          {LINKS.map(({ label, href }) => (
            <a key={label} href={href} className={styles.contactLink}
               target={href.startsWith('http') ? '_blank' : undefined}
               rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>
              {label} <span>↗</span>
            </a>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <span>© 2025 · Descent Portfolio</span>
        <span>NHTSA data via api.nhtsa.gov</span>
        <span>Built with Next.js · Vercel</span>
      </footer>
    </>
  );
}
