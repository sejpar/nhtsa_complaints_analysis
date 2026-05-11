import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Descent — NHTSA Vehicle Safety Analysis',
  description:
    'Data science portfolio: exploring 800k+ NHTSA vehicle complaints to surface safety signals.',
  openGraph: {
    title: 'Descent — NHTSA Vehicle Safety Analysis',
    description: 'Every complaint is a signal hiding in noise.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
