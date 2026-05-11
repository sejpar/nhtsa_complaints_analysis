import { NextRequest, NextResponse } from 'next/server';
import { fetchComplaintData, TARGET_YEARS } from '@/app/lib/nhtsa';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const model = searchParams.get('model') ?? 'RAV4';
  const yearsParam = searchParams.get('years');
  const years = yearsParam
    ? yearsParam.split(',').map(Number).filter(Boolean)
    : TARGET_YEARS;

  try {
    const data = await fetchComplaintData(model, years);
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
    });
  } catch (err) {
    console.error('[NHTSA API]', err);
    return NextResponse.json({ error: 'Failed to fetch NHTSA data' }, { status: 500 });
  }
}
