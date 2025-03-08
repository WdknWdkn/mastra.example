'use client';

import { useState } from 'react';
import Navigation from '../../components/Navigation';

export default function ParallelWorkflowPage() {
  const [inputValue, setInputValue] = useState<number | ''>('');
  const [results, setResults] = useState<{ squaredValue?: number; cubeRootValue?: number } | null>(null);
  const [steps, setSteps] = useState<{ squareStep?: number; cubeRootStep?: number }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (inputValue === '') {
      setError('数値を入力してください');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResults(null);
    setSteps({});
    
    try {
      const response = await fetch('/api/parallel-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputValue: Number(inputValue) }),
      });
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (!response.ok) {
        const errorMessage = data.error || 'APIリクエストに失敗しました';
        console.error('API Error:', errorMessage);
        setError(errorMessage);
        return;
      }
      
      setResults(data.results);
      setSteps(data.steps);
    } catch (err) {
      setError('処理中にエラーが発生しました。もう一度お試しください。');
      console.error('エラー:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-center mb-8">並列ステップワークフロー</h1>
        
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="mb-4">
              <label htmlFor="inputValue" className="block text-sm font-medium text-gray-700 mb-1">
                数値を入力
              </label>
              <input
                type="number"
                id="inputValue"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="例: 10, 27, 100..."
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
              {isLoading ? '処理中...' : '計算実行'}
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
                  計算処理中...
                </p>
              </div>
            </div>
          )}
          
          {results && !isLoading && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">計算結果</h2>
                <button
                  onClick={() => setShowSteps(!showSteps)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showSteps ? 'ステップを隠す' : 'ステップを表示'}
                </button>
              </div>
              
              {showSteps && (
                <div className="mb-6 space-y-4">
                  <div className="border border-gray-200 rounded-md p-4">
                    <h3 className="font-medium text-gray-700 mb-2">ステップ1: 2乗する</h3>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p><span className="font-semibold">{inputValue}</span> × <span className="font-semibold">{inputValue}</span> = <span className="font-semibold">{steps.squareStep}</span></p>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-md p-4">
                    <h3 className="font-medium text-gray-700 mb-2">ステップ2: 立方根を計算</h3>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p>∛<span className="font-semibold">{inputValue}</span> = <span className="font-semibold">{steps.cubeRootStep?.toFixed(4)}</span></p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-gray-50 p-6 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-4 border border-gray-200 rounded-md">
                    <p className="text-sm text-gray-500 mb-1">2乗結果</p>
                    <p className="font-bold text-xl text-blue-600">{results.squaredValue}</p>
                  </div>
                  <div className="text-center p-4 border border-gray-200 rounded-md">
                    <p className="text-sm text-gray-500 mb-1">立方根結果</p>
                    <p className="font-bold text-xl text-blue-600">{results.cubeRootValue?.toFixed(4)}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4 text-center">
                  入力値 {inputValue} を並列処理した結果
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">並列ステップワークフローについて</h2>
          <p className="mb-4">
            このデモでは、Mastraの<code>Workflow</code>クラスを使用して、複数のステップを並列に実行する方法を示しています：
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li><strong>ステップ1</strong>：入力値を2乗します。</li>
            <li><strong>ステップ2</strong>：入力値の立方根を計算します。</li>
          </ul>
          <p className="mb-4">
            この例は、各ステップが独立して同じ入力値に対して処理を行う並列処理フローを示しています。「ステップを表示」ボタンをクリックすると、各ステップの計算結果を確認できます。
          </p>
          <p>
            並列ステップパターンは、独立した複数の処理を効率的に実行する必要がある場合や、同じデータに対して異なる分析を行う場合などに適しています。
          </p>
        </div>
      </div>
    </div>
  );
}
