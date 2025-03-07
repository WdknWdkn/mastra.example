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
        <div className="flex space-x-4">
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
        </div>
      </div>
    </nav>
  );
}
