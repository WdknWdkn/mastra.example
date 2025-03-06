import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '猫の専門家チャット',
  description: '猫に関する質問に答える猫の専門家AIチャットボット',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
