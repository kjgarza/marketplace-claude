import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Monorepo App',
  description: 'Built with Next.js 15, React 19, and Tailwind CSS 4',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
