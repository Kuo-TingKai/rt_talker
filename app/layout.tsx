import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Real-Time AI Voice Conversation',
  description: 'Real-time voice conversation using LiveKit and AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

