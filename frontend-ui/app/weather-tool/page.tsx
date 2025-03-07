'use client';

import { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import MessageItem from '../../components/MessageItem';
import MessageInput from '../../components/MessageInput';
import Navigation from '../../components/Navigation';

export default function WeatherToolPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // メッセージが追加されたときに自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 初期メッセージを追加
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        content: 'こんにちは！天気について質問してください。例：「東京の天気はどうですか？」',
        role: 'assistant',
        timestamp: Date.now(),
      },
    ]);
  }, []);

  // メッセージを送信する関数
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    // ユーザーメッセージを追加
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // APIにメッセージを送信
      const response = await fetch('/api/weather-tool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        throw new Error('APIリクエストに失敗しました');
      }

      const data = await response.json();

      // アシスタントのメッセージを追加
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError('メッセージの送信中にエラーが発生しました。もう一度お試しください。');
      console.error('エラー:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="flex flex-col h-[calc(100vh-64px)]">
        <div className="p-4 bg-white shadow-sm">
          <h1 className="text-xl font-bold text-center">天気アシスタント</h1>
          <p className="text-center text-gray-600">
            場所を指定して天気情報を取得できます
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))}

          {isLoading && (
            <div className="flex justify-center items-center space-x-2">
              <div className="animate-bounce h-2 w-2 bg-blue-600 rounded-full"></div>
              <div className="animate-bounce h-2 w-2 bg-blue-600 rounded-full animation-delay-200"></div>
              <div className="animate-bounce h-2 w-2 bg-blue-600 rounded-full animation-delay-400"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
              <p>{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4 bg-white">
          <MessageInput onSendMessage={sendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}
