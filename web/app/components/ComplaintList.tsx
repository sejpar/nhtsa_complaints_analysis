'use client';
import { useState } from 'react';
import type { EnrichedComplaint } from '../lib/nhtsa';
import styles from './ComplaintList.module.css';

interface Props {
  complaints: EnrichedComplaint[];
  category: string;
}

function icon(c: EnrichedComplaint) {
  const f = String(c.fire  ?? '').toUpperCase();
  const r = String(c.crash ?? '').toUpperCase();
  const t = ['TRUE','T','1','Y','YES'];
  if (t.includes(f)) return '🔥';
  if (t.includes(r)) return '💥';
  return '⚪';
}

export default function ComplaintList({ complaints, category }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  const filtered = complaints
    .filter(c => c.clean_category === category)
    .slice(0, 15);

  if (!filtered.length) return (
    <p className={styles.empty}>이 카테고리에 신고된 사례가 없습니다.</p>
  );

  return (
    <div className={styles.list}>
      <p className={styles.count}>
        총 <strong>{complaints.filter(c => c.clean_category === category).length}</strong>건 접수
        · 최신순 상위 15건 표시
      </p>

      {filtered.map((c, i) => {
        const isOpen   = open === i;
        const dateInc  = c.dateOfIncident  ? String(c.dateOfIncident).slice(0, 10)  : '날짜 미상';
        const dateFiled = c.dateComplaintFiled ? String(c.dateComplaintFiled).slice(0, 10) : '—';

        return (
          <div key={c.odiNumber ?? i}
               className={`${styles.item} ${isOpen ? styles.itemOpen : ''}`}>

            {/* Header row */}
            <button
              className={styles.header}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <span className={styles.ico}>{icon(c)}</span>
              <span className={styles.headerMain}>
                <span className={styles.caseNum}>사례 {i + 1}</span>
                <span className={styles.date}>발생일: {dateInc}</span>
                <span className={styles.component} title={c.components}>
                  {(c.components ?? '').slice(0, 48)}{(c.components ?? '').length > 48 ? '…' : ''}
                </span>
              </span>
              <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>↓</span>
            </button>

            {/* Expanded body */}
            {isOpen && (
              <div className={styles.body}>
                <div className={styles.metrics}>
                  <div className={styles.metric}>
                    <span className={styles.metricVal}>{c.numberOfInjuries ?? 0}</span>
                    <span className={styles.metricLabel}>부상자</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricVal}>{c.numberOfDeaths ?? 0}</span>
                    <span className={styles.metricLabel}>사망자</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricVal}>{c.criticality}</span>
                    <span className={styles.metricLabel}>위험도</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricVal}>{dateFiled}</span>
                    <span className={styles.metricLabel}>신고일</span>
                  </div>
                </div>

                <div className={styles.divider} />

                <p className={styles.summaryLabel}>Summary</p>
                <p className={styles.summary}>{c.summary || '요약 없음'}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
