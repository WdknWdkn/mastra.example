'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
        <div className="text-xl font-bold mb-4 sm:mb-0">Mastra Examples</div>
        <div className="flex flex-wrap space-x-2 space-y-2 sm:space-y-0 sm:space-x-4">
          <Link 
            href="/" 
            className={`px-3 py-2 rounded-lg ${
              pathname === '/' ? 'bg-blue-800' : 'hover:bg-blue-700'
            }`}
          >
            猫の専門家チャット
          </Link>
          <Link 
            href="/weather" 
            className={`px-3 py-2 rounded-lg ${
              pathname === '/weather' ? 'bg-blue-800' : 'hover:bg-blue-700'
            }`}
          >
            天気予報とアクティビティ
          </Link>
          <Link 
            href="/weather-tool" 
            className={`px-3 py-2 rounded-lg ${
              pathname === '/weather-tool' ? 'bg-blue-800' : 'hover:bg-blue-700'
            }`}
          >
            天気アシスタント
          </Link>
          <Link 
            href="/blog-post" 
            className={`px-3 py-2 rounded-lg ${
              pathname === '/blog-post' ? 'bg-blue-800' : 'hover:bg-blue-700'
            }`}
          >
            ブログ記事ジェネレーター
          </Link>
          <Link 
            href="/workflow" 
            className={`px-3 py-2 rounded-lg ${
              pathname === '/workflow' ? 'bg-blue-800' : 'hover:bg-blue-700'
            }`}
          >
            ワークフローブログ
          </Link>
          <Link 
            href="/create-workflow" 
            className={`px-3 py-2 rounded-lg ${
              pathname === '/create-workflow' ? 'bg-blue-800' : 'hover:bg-blue-700'
            }`}
          >
            3ステップブログ記事
          </Link>
          <Link 
            href="/sequential-workflow" 
            className={`px-3 py-2 rounded-lg ${
              pathname === '/sequential-workflow' ? 'bg-blue-800' : 'hover:bg-blue-700'
            }`}
          >
            シーケンシャルワークフロー
          </Link>
          <Link 
            href="/parallel-workflow" 
            className={`px-3 py-2 rounded-lg ${
              pathname === '/parallel-workflow' ? 'bg-blue-800' : 'hover:bg-blue-700'
            }`}
          >
            並列ワークフロー
          </Link>
          <Link 
            href="/branching-workflow" 
            className={`px-3 py-2 rounded-lg ${
              pathname === '/branching-workflow' ? 'bg-blue-800' : 'hover:bg-blue-700'
            }`}
          >
            分岐パスワークフロー
          </Link>
          <Link 
            href="/bird-checker" 
            className={`px-3 py-2 rounded-lg ${
              pathname === '/bird-checker' ? 'bg-blue-800' : 'hover:bg-blue-700'
            }`}
          >
            鳥チェッカー
          </Link>
          <Link 
            href="/real-estate" 
            className={`px-3 py-2 rounded-lg ${
              pathname === '/real-estate' ? 'bg-blue-800' : 'hover:bg-blue-700'
            }`}
          >
            物件検索エージェント
          </Link>
        </div>
      </div>
    </nav>
  );
}
