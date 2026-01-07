import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Daggerfall-like RPG',
  description: 'A retro first-person RPG inspired by Daggerfall',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}



