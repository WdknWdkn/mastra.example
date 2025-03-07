import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mastra Examples',
  description: 'Mastraを使用した様々な例を紹介するアプリケーション',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
