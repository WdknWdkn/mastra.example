'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navigation from '../../components/Navigation';
import Image from 'next/image';

// メッセージの型定義
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// 物件データの型定義
interface Property {
  [key: string]: any;
}

// 物件カードコンポーネント
const PropertyCard: React.FC<{ property: Property }> = ({ property }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
      <h3 className="text-lg font-semibold mb-2 text-gray-800">
        {property['物件名称'] || '物件名不明'}
      </h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex flex-col">
          <span className="font-medium text-gray-700">所在地:</span>
          <span className="text-gray-600">{property['所在地名称'] || '不明'}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-gray-700">賃料:</span>
          <span className="text-gray-600">{property['賃料・価格'] || '不明'}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-gray-700">間取り:</span>
          <span className="text-gray-600">{property['間取り備考'] || '不明'}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-gray-700">面積:</span>
          <span className="text-gray-600">{property['建物面積・専有面積'] || '不明'}㎡</span>
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-gray-700">最寄駅:</span>
          <span className="text-gray-600">{property['駅1'] || '不明'}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-gray-700">特徴:</span>
          <span className="text-gray-600">{property['物件の特徴'] || '特になし'}</span>
        </div>
      </div>
    </div>
  );
};

// メッセージコンポーネント
const MessageItem: React.FC<{ message: Message }> = ({ message }) => {
  return (
    <div
      className={`mb-4 ${
        message.role === 'user' ? 'text-right' : 'text-left'
      }`}
    >
      <div
        className={`inline-block p-3 rounded-lg ${
          message.role === 'user'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-800'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
};

// メインページコンポーネント
export default function RealEstatePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 初回ロード時に物件データを読み込む
  useEffect(() => {
    const initializeData = async () => {
      if (isInitialized) return;
      
      setIsLoading(true);
      try {
        const response = await fetch('/api/real-estate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isInitialLoad: true }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || '物件データの読み込みに失敗しました');
        }
        
        // 初期メッセージを追加
        setMessages([
          {
            role: 'assistant',
            content: `こんにちは！不動産エージェントのAIアシスタントです。${data.message} どのような物件をお探しですか？予算、エリア、間取りなどの希望条件をお聞かせください。`,
          },
        ]);
        
        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
        console.error('初期化エラー:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeData();
  }, [isInitialized]);

  // メッセージが追加されたら自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // メッセージ送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput('');
    
    // ユーザーメッセージを追加
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/real-estate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage,
          threadId: threadId // スレッドIDを送信
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'リクエストの処理中にエラーが発生しました');
      }
      
      // アシスタントの応答を追加
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response },
      ]);
      
      // スレッドIDを保存
      if (data.threadId) {
        setThreadId(data.threadId);
      }
      
      // 物件データを更新
      if (data.properties && data.properties.length > 0) {
        setProperties(data.properties);
      }
      
      // 地域別物件データがある場合は追加
      if (data.regionProperties && data.regionProperties.length > 0) {
        setProperties(prev => [...prev, ...data.regionProperties]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      console.error('APIエラー:', err);
      
      // エラーメッセージを追加
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'すみません、エラーが発生しました。もう一度お試しください。',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
          不動産物件推薦AIエージェント
        </h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* チャットエリア */}
          <div className="md:col-span-2 bg-white rounded-lg shadow-md p-4">
            <div className="h-[500px] overflow-y-auto mb-4 p-2">
              {messages.map((message, index) => (
                <MessageItem key={index} message={message} />
              ))}
              {isLoading && (
                <div className="text-center py-2">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSubmit} className="flex">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="メッセージを入力..."
                className="flex-grow px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading || !isInitialized}
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
                disabled={isLoading || !isInitialized || !input.trim()}
              >
                送信
              </button>
            </form>
          </div>
          
          {/* 物件表示エリア */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              おすすめ物件
            </h2>
            
            {properties.length > 0 ? (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {properties.map((property, index) => (
                  <PropertyCard key={index} property={property} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>
                  {isInitialized
                    ? '条件に合った物件が見つかりません。別の条件をお試しください。'
                    : '物件データを読み込んでいます...'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
