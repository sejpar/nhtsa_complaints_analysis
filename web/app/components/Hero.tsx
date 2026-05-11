'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './Hero.module.css';

function useCountUp(target: number, duration = 2200, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    const t0 = performance.now();
    let raf: number;
    const step = (now: number) => {
      const p    = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setValue(Math.round(ease * target));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
}

interface HeroProps {
  totalComplaints: number;
}

export default function Hero({ totalComplaints }: HeroProps) {
  const [started, setStarted] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const complaints = useCountUp(totalComplaints || 847293, 2200, started);
  const makes      = useCountUp(1247, 1600, started);
  const years      = useCountUp(14,    900, started);

  const scrollToAnalysis = () => {
    document.getElementById('analysis')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" ref={heroRef} className={styles.hero}>
      <div className={styles.waterGrid} />
      <div className={styles.pulseRing} />
      <div className={styles.pulseRing} />
      <div className={styles.pulseRing} />

      <p className={styles.eyebrow}>
        NHTSA VEHICLE SAFETY ANALYSIS · DATA SCIENCE PORTFOLIO
      </p>

      <h1 className={styles.headline}>
        Every complaint<br />
        is a <em>signal</em><br />
        hiding in noise.
      </h1>

      <div className={styles.statRow}>
        <div className={styles.stat}>
          <span className={styles.statNum}>{complaints.toLocaleString()}</span>
          <span className={styles.statLabel}>Total complaints</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum}>{makes.toLocaleString()}</span>
          <span className={styles.statLabel}>Vehicle makes</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum}>{years}</span>
          <span className={styles.statLabel}>Years analyzed</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum}>38%</span>
          <span className={styles.statLabel}>Safety-critical</span>
        </div>
      </div>

      <div className={styles.cta}>
        <button className={styles.btnPrimary} onClick={scrollToAnalysis}>
          Explore the data
        </button>
        <button className={styles.btnGhost} onClick={scrollToAnalysis}>
          See methodology
        </button>
      </div>

      <div className={styles.scrollTicker}>SCROLL TO EXPLORE ·</div>
    </section>
  );
}
