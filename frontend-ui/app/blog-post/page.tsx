'use client';

import { useState } from 'react';
import Navigation from '../../components/Navigation';

export default function BlogPostPage() {
  const [topic, setTopic] = useState('');
  const [blogPost, setBlogPost] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      setError('トピックを入力してください');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/blog-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      });
      
      if (!response.ok) {
        throw new Error('APIリクエストに失敗しました');
      }
      
      const data = await response.json();
      setBlogPost(data.blogPost);
    } catch (err) {
      setError('ブログ記事の生成中にエラーが発生しました。もう一度お試しください。');
      console.error('エラー:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-center mb-8">階層的マルチエージェントブログ記事ジェネレーター</h1>
        
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="mb-4">
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
                ブログ記事のトピック
              </label>
              <input
                type="text"
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="例: 人工知能の未来、持続可能なエネルギー、健康的な食事習慣..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'ブログ記事を生成中...' : 'ブログ記事を生成'}
            </button>
          </form>
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
              <p>{error}</p>
            </div>
          )}
          
          {isLoading && (
            <div className="flex justify-center items-center space-x-2 my-8">
              <div className="text-center">
                <div className="flex justify-center items-center space-x-1 mb-2">
                  <div className="animate-bounce h-2 w-2 bg-blue-600 rounded-full"></div>
                  <div className="animate-bounce h-2 w-2 bg-blue-600 rounded-full animation-delay-200"></div>
                  <div className="animate-bounce h-2 w-2 bg-blue-600 rounded-full animation-delay-400"></div>
                </div>
                <p className="text-sm text-gray-500">
                  ブログ記事を生成中です。これには1〜2分かかる場合があります...
                </p>
              </div>
            </div>
          )}
          
          {blogPost && !isLoading && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">生成されたブログ記事</h2>
              <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                {blogPost.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">階層的マルチエージェントシステムについて</h2>
          <p className="mb-4">
            このデモでは、3つのAIエージェントが協力してブログ記事を作成します：
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li><strong>コピーライターエージェント</strong>：指定されたトピックに関する初期のブログ記事を作成します。</li>
            <li><strong>エディターエージェント</strong>：コピーライターが作成した記事を編集し、改善します。</li>
            <li><strong>パブリッシャーエージェント</strong>：全体のプロセスを調整し、最終的な記事を提供します。</li>
          </ul>
          <p>
            これは、複数のAIエージェントが階層的に協力して複雑なタスクを実行する方法を示す例です。
          </p>
        </div>
      </div>
    </div>
  );
}
