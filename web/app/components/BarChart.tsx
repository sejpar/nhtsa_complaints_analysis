'use client';
import { useState } from 'react';
import type { BarDatum } from '../lib/nhtsa';
import styles from './BarChart.module.css';

const COLORS = {
  Fire:  '#E74C3C',
  Crash: '#E8A838',
  Other: '#8BBFB8',
} as const;

interface Props {
  data: BarDatum[];
  onSelect: (category: string) => void;
  selected: string | null;
}

export default function BarChart({ data, onSelect, selected }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (!data.length) return (
    <div className={styles.empty}>No complaint data for this filter.</div>
  );

  const maxTotal = Math.max(...data.map(d => d.total), 1);

  return (
    <div className={styles.wrap}>
      {/* Legend */}
      <div className={styles.legend}>
        {(Object.entries(COLORS) as [keyof typeof COLORS, string][]).map(([key, color]) => (
          <div key={key} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: color }} />
            <span>{key}</span>
          </div>
        ))}
      </div>

      {/* Bars */}
      <div className={styles.chart}>
        {data.map((d) => {
          const isActive   = selected === d.category;
          const isHovered  = hovered === d.category;
          const totalPct   = (d.total / maxTotal) * 100;
          const firePct    = d.total ? (d.Fire  / d.total) * 100 : 0;
          const crashPct   = d.total ? (d.Crash / d.total) * 100 : 0;
          const otherPct   = 100 - firePct - crashPct;

          return (
            <div
              key={d.category}
              className={`${styles.row} ${isActive ? styles.active : ''}`}
              onClick={() => onSelect(d.category)}
              onMouseEnter={() => setHovered(d.category)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className={styles.label} title={d.category}>
                {d.category}
              </div>

              <div className={styles.trackWrap}>
                <div className={styles.track}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${totalPct}%` }}
                  >
                    {/* stacked segments */}
                    <div style={{ width: `${firePct}%`,  background: COLORS.Fire,  height: '100%', display: 'inline-block' }} />
                    <div style={{ width: `${crashPct}%`, background: COLORS.Crash, height: '100%', display: 'inline-block' }} />
                    <div style={{ width: `${otherPct}%`, background: COLORS.Other, height: '100%', display: 'inline-block' }} />
                  </div>
                </div>

                {/* tooltip on hover */}
                {isHovered && (
                  <div className={styles.tooltip}>
                    <span style={{ color: COLORS.Fire  }}>🔥 Fire: {d.Fire}</span>
                    <span style={{ color: COLORS.Crash }}>💥 Crash: {d.Crash}</span>
                    <span style={{ color: COLORS.Other }}>⚪ Other: {d.Other}</span>
                  </div>
                )}
              </div>

              <span className={styles.total}>{d.total}</span>
            </div>
          );
        })}
      </div>

      <p className={styles.hint}>← 카테고리를 클릭하면 세부 분석이 열려요</p>
    </div>
  );
}
