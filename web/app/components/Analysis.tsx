'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { DashboardData, EnrichedComplaint, PieDatum } from '../lib/nhtsa';
import { buildPieData, TARGET_YEARS, TARGET_SUVS } from '../lib/nhtsa';
import BarChart      from './BarChart';
import DonutChart    from './DonutChart';
import ComplaintList from './ComplaintList';
import styles from './Analysis.module.css';

type ModelLabel = typeof TARGET_SUVS[number]['label'];
const MODEL_LABELS = TARGET_SUVS.map(v => v.label) as ModelLabel[];

// ── reveal hook ──────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add(styles.visible); io.disconnect(); }
    }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

// ── loading skeleton ─────────────────────────────────────────
function Skeleton({ height = 24 }: { height?: number }) {
  return <div className={styles.skeleton} style={{ height }} />;
}

interface Props { initial: DashboardData }

export default function Analysis({ initial }: Props) {
  const [data,      setData]     = useState<DashboardData>(initial);
  const [loading,   setLoading]  = useState(false);
  const [model,     setModel]    = useState<ModelLabel>('RAV4');
  const [years,     setYears]    = useState<number[]>(TARGET_YEARS);
  const [category,  setCategory] = useState<string | null>(null);
  const [pieData,   setPieData]  = useState<PieDatum[]>([]);
  const [view,      setView]     = useState<'bar' | 'donut' | 'list'>('bar');

  const r1 = useReveal(), r2 = useReveal(), r3 = useReveal();

  // ── fetch when model/years change ───────────────────────────
  const doFetch = useCallback(async (m: ModelLabel, y: number[]) => {
    if (!y.length) return;
    setLoading(true);
    setCategory(null);
    setPieData([]);
    try {
      const qs  = `?model=${encodeURIComponent(m)}&years=${y.join(',')}`;
      const res = await fetch(`/api/nhtsa${qs}`);
      if (res.ok) {
        const d: DashboardData = await res.json();
        setData(d);
      }
    } catch { /* keep previous */ }
    finally { setLoading(false); }
  }, []);

  // ── bar click → pie ──────────────────────────────────────────
  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    setPieData(buildPieData(data.complaints as EnrichedComplaint[], cat));
    setView('donut');
  };

  // ── year toggle ──────────────────────────────────────────────
  const toggleYear = (y: number) => {
    const next = years.includes(y) ? years.filter(x => x !== y) : [...years, y];
    if (!next.length) return;
    setYears(next);
    doFetch(model, next);
  };

  const setAllYears = () => { setYears(TARGET_YEARS); doFetch(model, TARGET_YEARS); };

  // ── model change ─────────────────────────────────────────────
  const handleModel = (m: ModelLabel) => { setModel(m); doFetch(m, years); };

  // ── active category complaints ───────────────────────────────
  const activeComplaints = data.complaints as EnrichedComplaint[];

  return (
    <section id="analysis" className={styles.analysis}>

      {/* ─── SIDEBAR ─────────────────────────────────────── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <div className={styles.logoText}>Descent</div>
          <div className={styles.logoSub}>NHTSA · 2022–2025</div>
        </div>

        {/* Model select */}
        <div className={styles.sideSection}>
          <div className={styles.filterLabel}>차량 모델</div>
          {MODEL_LABELS.map(m => (
            <button key={m}
              className={`${styles.filterOption} ${model === m ? styles.filterActive : ''}`}
              onClick={() => handleModel(m)}>
              {m}
            </button>
          ))}
        </div>

        {/* Year multiselect */}
        <div className={styles.sideSection}>
          <div className={styles.filterLabelRow}>
            <span className={styles.filterLabel}>연식 선택</span>
            <button className={styles.resetBtn} onClick={setAllYears}>전체</button>
          </div>
          <div className={styles.yearGrid}>
            {TARGET_YEARS.map(y => (
              <button key={y}
                className={`${styles.yearChip} ${years.includes(y) ? styles.yearActive : ''}`}
                onClick={() => toggleYear(y)}>
                {y}
              </button>
            ))}
          </div>
          {!years.length && (
            <p className={styles.yearWarn}>최소 1개 이상 선택하세요</p>
          )}
        </div>

        {/* View toggle */}
        <div className={styles.sideSection}>
          <div className={styles.filterLabel}>보기 모드</div>
          {[
            { key: 'bar',   label: '부품별 바 차트' },
            { key: 'donut', label: '세부 도넛 차트'  },
            { key: 'list',  label: '신고 사례 목록'  },
          ].map(({ key, label }) => (
            <button key={key}
              className={`${styles.filterOption} ${view === key ? styles.filterActive : ''}`}
              onClick={() => setView(key as typeof view)}>
              {label}
            </button>
          ))}
        </div>

        {/* Nav */}
        <nav className={styles.sideNav}>
          <a className={styles.navLink} href="#hero">↑ Hero</a>
          <a className={styles.navLink} href="#about">About</a>
          <a className={styles.navLink}
             href="https://www.nhtsa.gov/vehicle-safety/complaints"
             target="_blank" rel="noopener">NHTSA Source ↗</a>
        </nav>
      </aside>

      {/* ─── MAIN ────────────────────────────────────────── */}
      <div className={`${styles.main} ${loading ? styles.loading : ''}`}>

        {/* Stat strip */}
        <div ref={r1} className={`${styles.statStrip} reveal`}>
          {[
            { num: loading ? '—' : data.totalCount.toLocaleString(), label: `${model} 신고 건수` },
            { num: loading ? '—' : `${data.barData[0]?.category ?? '—'}`,
              label: '최다 결함 카테고리' },
            { num: loading ? '—' :
                `${data.complaints ? Math.round(
                  (activeComplaints.filter(c => c.criticality === 'Fire').length / (data.totalCount || 1)) * 100
                ) : 0}%`,
              label: 'Fire 비율' },
            { num: loading ? '—' :
                `${data.complaints ? Math.round(
                  (activeComplaints.filter(c => c.criticality === 'Crash').length / (data.totalCount || 1)) * 100
                ) : 0}%`,
              label: 'Crash 비율' },
          ].map(({ num, label }) => (
            <div key={label} className={styles.statTile}>
              {loading ? <Skeleton height={28} /> : <span className={styles.statTileNum}>{num}</span>}
              <span className={styles.statTileLabel}>{label}</span>
            </div>
          ))}
        </div>

        {/* ── BAR CHART view ── */}
        {view === 'bar' && (
          <div ref={r2} className={`${styles.chartCard} ${styles.wide} reveal`}>
            <div className={styles.chartTitle}>
              부품별 결함 건수 (위험도 스택)
              <span className={styles.chartBadge}>{model} · {years.join(', ')}</span>
            </div>
            {loading
              ? <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[1,2,3,4,5].map(i => <Skeleton key={i} height={28} />)}
                </div>
              : <BarChart data={data.barData} onSelect={handleCategorySelect} selected={category} />
            }
          </div>
        )}

        {/* ── DONUT view ── */}
        {view === 'donut' && (
          <div ref={r2} className={`${styles.chartCard} ${styles.wide} reveal`}>
            <div className={styles.chartTitle}>
              {category
                ? <>세부 컴포넌트 분포 — <em style={{ fontStyle:'italic', color:'var(--anchor)' }}>{category}</em></>
                : '카테고리를 선택해 주세요 (바 차트 탭에서 클릭)'}
              <span className={styles.chartBadge}>{model}</span>
            </div>
            {category && !loading ? (
              <DonutChart
                data={pieData}
                category={category}
                total={activeComplaints.filter(c => c.clean_category === category).length}
              />
            ) : (
              !loading && (
                <p className={styles.hint}>
                  먼저 &quot;부품별 바 차트&quot; 탭에서 카테고리를 클릭하세요.
                </p>
              )
            )}
          </div>
        )}

        {/* ── LIST view ── */}
        {view === 'list' && (
          <div ref={r2} className={`${styles.chartCard} ${styles.wide} reveal`}>
            <div className={styles.chartTitle}>
              고객 신고 사례 목록
              <div style={{ display:'flex', gap:6 }}>
                {data.barData.map(b => (
                  <button key={b.category}
                    className={`${styles.chartBadge} ${category === b.category ? styles.badgeActive : ''}`}
                    style={{ cursor:'pointer', border:'none', fontFamily:'var(--mono)', fontSize:9 }}
                    onClick={() => {
                      setCategory(b.category);
                      setPieData(buildPieData(activeComplaints, b.category));
                    }}>
                    {b.category.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
            {loading
              ? <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {[1,2,3,4,5].map(i => <Skeleton key={i} height={48} />)}
                </div>
              : category
                ? <ComplaintList complaints={activeComplaints} category={category} />
                : <p className={styles.hint}>위에서 카테고리 버튼을 선택하세요.</p>
            }
          </div>
        )}

        {/* ── INSIGHT band (always shown) ── */}
        <div ref={r3} className={`${styles.insightSection} reveal`}>
          <div className={styles.insightLabel}>Key Findings — {model}</div>
          <div className={styles.insightGrid}>
            {data.barData.slice(0, 3).map(b => (
              <div key={b.category} className={styles.insightItem}>
                <div className={styles.insightNum}>{b.total}</div>
                <div className={styles.insightCat}>{b.category}</div>
                <div className={styles.insightText}>
                  🔥 {b.Fire} · 💥 {b.Crash} · ⚪ {b.Other}
                </div>
              </div>
            ))}
            {!data.barData.length && !loading && (
              <p className={styles.hint} style={{ gridColumn:'1/-1' }}>
                데이터를 불러오는 중이거나 해당 필터에 결과가 없습니다.
              </p>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
