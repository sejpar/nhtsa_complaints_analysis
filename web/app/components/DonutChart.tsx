'use client';
import type { PieDatum } from '../lib/nhtsa';
import styles from './DonutChart.module.css';

// Tealgrn palette matching plotly color_discrete_sequence
const PALETTE = [
  '#3D6B65', '#6B9E96', '#8BBFB8', '#A8D4CE',
  '#C9E6E2', '#2C3E3B', '#1a2624',
];

interface Props {
  data: PieDatum[];
  category: string;
  total: number;
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildSlices(data: PieDatum[], cx: number, cy: number, outerR: number, innerR: number) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let angle = 0;
  return data.map((d, i) => {
    const sweep    = (d.value / total) * 360;
    const startAng = angle;
    const endAng   = angle + sweep;
    angle         += sweep;

    const start  = polarToXY(cx, cy, outerR, startAng);
    const end    = polarToXY(cx, cy, outerR, endAng);
    const iStart = polarToXY(cx, cy, innerR, startAng);
    const iEnd   = polarToXY(cx, cy, innerR, endAng);

    const largeArc = sweep > 180 ? 1 : 0;

    const path =
      `M ${start.x} ${start.y}` +
      ` A ${outerR} ${outerR} 0 ${largeArc} 1 ${end.x} ${end.y}` +
      ` L ${iEnd.x} ${iEnd.y}` +
      ` A ${innerR} ${innerR} 0 ${largeArc} 0 ${iStart.x} ${iStart.y}` +
      ` Z`;

    // Label position (midpoint)
    const midAng = startAng + sweep / 2;
    const labelR = outerR * 0.72;
    const labelPos = polarToXY(cx, cy, labelR, midAng);

    return { path, color: PALETTE[i % PALETTE.length], labelPos, pct: d.pct, name: d.name, sweep };
  });
}

export default function DonutChart({ data, category, total }: Props) {
  if (!data.length) return (
    <div className={styles.empty}>이 카테고리에 세부 데이터가 없습니다.</div>
  );

  const CX = 160, CY = 160, OUTER = 130, INNER = 68;
  const slices = buildSlices(data, CX, CY, OUTER, INNER);

  return (
    <div className={styles.wrap}>
      <div className={styles.svgWrap}>
        <svg viewBox="0 0 320 320" className={styles.svg}>
          {slices.map((s, i) => (
            <path key={i} d={s.path} fill={s.color} opacity={0.92}>
              <title>{s.name}: {s.pct}%</title>
            </path>
          ))}
          {/* Center text */}
          <text x={CX} y={CY - 10} textAnchor="middle"
                fontFamily="DM Serif Display" fontSize={22} fill="#2C3E3B">
            {total}
          </text>
          <text x={CX} y={CY + 12} textAnchor="middle"
                fontFamily="DM Mono" fontSize={9} fill="#6B9E96" letterSpacing={2}>
            CASES
          </text>
        </svg>
      </div>

      {/* Legend list */}
      <ul className={styles.legend}>
        {data.map((d, i) => (
          <li key={d.name} className={styles.legendItem}>
            <span className={styles.dot} style={{ background: PALETTE[i % PALETTE.length] }} />
            <span className={styles.name} title={d.name}>{d.name}</span>
            <span className={styles.pct}>{d.pct}%</span>
            <span className={styles.count}>{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
