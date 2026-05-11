// ─── Types ────────────────────────────────────────────────────
export interface NHTSAComplaint {
  odiNumber: number;
  manufacturer: string;
  crash: boolean;
  fire: boolean;
  numberOfInjuries: number;
  numberOfDeaths: number;
  dateOfIncident: string;
  dateComplaintFiled: string;
  vin: string;
  components: string;
  summary: string;
}

export type Criticality = 'Fire' | 'Crash' | 'Other';

export interface EnrichedComplaint extends NHTSAComplaint {
  meta_year: number;
  meta_make: string;
  meta_model: string;
  clean_category: string;
  criticality: Criticality;
}

export interface BarDatum {
  category: string;
  Fire: number;
  Crash: number;
  Other: number;
  total: number;
}

export interface PieDatum {
  name: string;
  value: number;
  pct: number;
}

export interface DashboardData {
  complaints: EnrichedComplaint[];
  barData: BarDatum[];
  availableYears: number[];
  totalCount: number;
}

// ─── Target vehicles (mirrors app.py) ────────────────────────
export const TARGET_SUVS = [
  { make: 'TOYOTA',    model: 'RAV4',     label: 'RAV4'     },
  { make: 'HONDA',     model: 'CR-V',     label: 'CR-V'     },
  { make: 'CHEVROLET', model: 'EQUINOX',  label: 'Equinox'  },
  { make: 'FORD',      model: 'EXPLORER', label: 'Explorer' },
  { make: 'TESLA',     model: 'MODEL Y',  label: 'Model Y'  },
] as const;

export type ModelLabel = typeof TARGET_SUVS[number]['label'];

export const TARGET_YEARS = [2022, 2023, 2024, 2025];

// ─── Category classifier (mirrors finalize_categorization) ────
export function classifyComponent(components: string): string {
  const x = (components ?? '').toUpperCase();
  if (['COLLISION', 'LANE DEPARTURE', 'BACK OVER', 'SPEED CONTROL'].some(k => x.includes(k)))
    return 'Driving Assist (ADAS)';
  if (x.includes('STEERING'))
    return 'Steering & Handling';
  if (['ENGINE', 'POWER TRAIN', 'FUEL'].some(k => x.includes(k)))
    return 'Engine & Powertrain';
  if (['BRAKES', 'AIR BAGS'].some(k => x.includes(k)))
    return 'Brakes & Safety';
  if (x.includes('ELECTRICAL'))
    return 'Electrical & IT';
  if (['VISIBILITY', 'WIPER', 'LIGHTING', 'STRUCTURE'].some(k => x.includes(k)))
    return 'Exterior & Visibility';
  return 'Others';
}

// ─── Criticality classifier (mirrors classify_criticality) ────
export function classifyCriticality(complaint: NHTSAComplaint): Criticality {
  const fireVal  = String(complaint.fire  ?? '').trim().toUpperCase();
  const crashVal = String(complaint.crash ?? '').trim().toUpperCase();
  const truthy   = ['TRUE', 'T', '1', 'Y', 'YES'];
  if (truthy.includes(fireVal))  return 'Fire';
  if (truthy.includes(crashVal)) return 'Crash';
  return 'Other';
}

// ─── Fetch one make/model/year combo ─────────────────────────
async function fetchOne(make: string, model: string, year: number): Promise<NHTSAComplaint[]> {
  const url =
    `https://api.nhtsa.gov/complaints/complaintsByVehicle` +
    `?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.results ?? [];
  } catch {
    return [];
  }
}

// ─── Main fetcher ─────────────────────────────────────────────
export async function fetchComplaintData(
  modelLabel: string,
  years: number[]
): Promise<DashboardData> {
  const vehicle = TARGET_SUVS.find(v => v.label === modelLabel);
  if (!vehicle) throw new Error(`Unknown model: ${modelLabel}`);

  const batches = await Promise.all(
    years.map(year =>
      fetchOne(vehicle.make, vehicle.model, year).then(rows =>
        rows.map(r => ({
          ...r,
          meta_year:      year,
          meta_make:      vehicle.make,
          meta_model:     vehicle.label,
          clean_category: classifyComponent(r.components),
          criticality:    classifyCriticality(r),
        } as EnrichedComplaint))
      )
    )
  );

  const complaints = batches.flat();
  complaints.sort(
    (a, b) =>
      new Date(b.dateComplaintFiled).getTime() - new Date(a.dateComplaintFiled).getTime()
  );

  const catMap: Record<string, { Fire: number; Crash: number; Other: number }> = {};
  for (const c of complaints) {
    if (!catMap[c.clean_category]) catMap[c.clean_category] = { Fire: 0, Crash: 0, Other: 0 };
    catMap[c.clean_category][c.criticality]++;
  }
  const barData: BarDatum[] = Object.entries(catMap)
    .map(([category, counts]) => ({
      category,
      ...counts,
      total: counts.Fire + counts.Crash + counts.Other,
    }))
    .sort((a, b) => b.total - a.total);

  const availableYears = [...new Set(complaints.map(c => c.meta_year))].sort((a, b) => b - a);

  return { complaints, barData, availableYears, totalCount: complaints.length };
}

// ─── Build pie data for a selected category ───────────────────
export function buildPieData(complaints: EnrichedComplaint[], category: string): PieDatum[] {
  const sub = complaints.filter(c => c.clean_category === category);
  const counts: Record<string, number> = {};
  for (const c of sub) {
    const key = (c.components ?? 'Unknown').trim();
    counts[key] = (counts[key] ?? 0) + 1;
  }
  const total = sub.length || 1;
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value, pct: Math.round((value / total) * 100) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);
}
