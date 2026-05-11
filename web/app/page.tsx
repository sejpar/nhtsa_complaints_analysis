import { fetchComplaintData, TARGET_YEARS } from './lib/nhtsa';
import Hero            from './components/Hero';
import TransitionBand  from './components/TransitionBand';
import Analysis        from './components/Analysis';
import About           from './components/About';
import Cursor          from './components/Cursor';

// ISR — rebuild every 24h on Vercel
export const revalidate = 86400;

export default async function Home() {
  // Pre-fetch RAV4 on the server so first paint has real data
  let initial;
  try {
    initial = await fetchComplaintData('RAV4', TARGET_YEARS);
  } catch {
    initial = {
      complaints:     [],
      barData:        [],
      availableYears: TARGET_YEARS,
      totalCount:     0,
    };
  }

  return (
    <>
      <Cursor />
      <Hero totalComplaints={initial.totalCount} />
      <TransitionBand />
      <Analysis initial={initial} />
      <About />
    </>
  );
}
