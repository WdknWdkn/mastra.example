'use client';

import { useState } from 'react';
import Image from 'next/image';
import Navigation from '../../components/Navigation';

type BirdCheckerResult = {
  result: {
    bird: boolean;
    species: string;
    location: string;
  };
  imageUrl: string;
  imageCredit: {
    name: string;
    link: string;
  };
};

export default function BirdCheckerPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BirdCheckerResult | null>(null);
  const [customUrl, setCustomUrl] = useState('');
  const [useCustomUrl, setUseCustomUrl] = useState(false);

  const handleRandomImage = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/bird-checker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '画像の分析中にエラーが発生しました');
        return;
      }

      setResult(data);
    } catch (err) {
      setError('APIリクエスト中にエラーが発生しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomImage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customUrl.trim()) {
      setError('画像URLを入力してください');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/bird-checker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: customUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '画像の分析中にエラーが発生しました');
        return;
      }

      setResult(data);
    } catch (err) {
      setError('APIリクエスト中にエラーが発生しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-center mb-8">鳥チェッカー</h1>
        
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">画像分析</h2>
            <p className="mb-4">
              このツールは、画像に鳥が含まれているかどうかを判断し、鳥の種類と撮影場所を特定します。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button
                onClick={handleRandomImage}
                disabled={loading}
                className={`flex-1 py-2 px-4 rounded-md text-white font-medium ${
                  loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? '分析中...' : 'ランダムな鳥の画像を分析'}
              </button>
              
              <button
                onClick={() => setUseCustomUrl(!useCustomUrl)}
                className="flex-1 py-2 px-4 rounded-md text-gray-700 font-medium border border-gray-300 hover:bg-gray-50"
              >
                {useCustomUrl ? 'カスタムURLを隠す' : 'カスタムURLを使用'}
              </button>
            </div>
            
            {useCustomUrl && (
              <form onSubmit={handleCustomImage} className="mt-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="画像のURL"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className={`py-2 px-4 rounded-md text-white font-medium ${
                      loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    分析
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  注: カスタムURL機能は現在実装中です
                </p>
              </form>
            )}
          </div>
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
              <p>{error}</p>
            </div>
          )}
          
          {loading && (
            <div className="flex justify-center items-center space-x-2 my-8">
              <div className="text-center">
                <div className="flex justify-center items-center space-x-1 mb-2">
                  <div className="animate-bounce h-2 w-2 bg-blue-600 rounded-full"></div>
                  <div className="animate-bounce h-2 w-2 bg-blue-600 rounded-full animation-delay-200"></div>
                  <div className="animate-bounce h-2 w-2 bg-blue-600 rounded-full animation-delay-400"></div>
                </div>
                <p className="text-sm text-gray-500">
                  画像を分析中です。これには数秒かかる場合があります...
                </p>
              </div>
            </div>
          )}
          
          {result && !loading && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">分析結果</h3>
              
              <div className="mb-6 relative h-64 sm:h-80 w-full">
                <Image
                  src={result.imageUrl}
                  alt="分析された画像"
                  fill
                  className="object-contain rounded-md"
                />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="border border-gray-200 rounded-md p-3">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">鳥の有無</h4>
                    <p className="text-lg font-semibold">
                      {result.result.bird ? '✅ 鳥です' : '❌ 鳥ではありません'}
                    </p>
                  </div>
                  
                  <div className="border border-gray-200 rounded-md p-3">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">種類</h4>
                    <p className="text-lg font-semibold">{result.result.species}</p>
                  </div>
                  
                  <div className="border border-gray-200 rounded-md p-3">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">撮影場所</h4>
                    <p className="text-lg font-semibold">{result.result.location}</p>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 text-right">
                画像提供: 
                <a 
                  href={result.imageCredit.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-1"
                >
                  {result.imageCredit.name}
                </a>
                {' '}on Unsplash
              </div>
            </div>
          )}
        </div>
        
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">鳥チェッカーについて</h2>
          <p className="mb-4">
            このデモでは、Mastraの<code>Agent</code>クラスを使用して、画像を分析し、鳥が含まれているかどうかを判断するエージェントを作成しています。
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li>エージェントはUnsplashから鳥に関連するランダムな画像を取得します</li>
            <li>画像はAnthropicのClaude-3-Haikuモデル（またはOpenAIのGPT-4 Visionモデル）に送信されます</li>
            <li>エージェントは画像に鳥が含まれているかどうかを判断し、鳥の種類と撮影場所を特定します</li>
            <li>応答はZodスキーマ検証を使用して構造化されます</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
