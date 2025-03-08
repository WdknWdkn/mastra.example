'use client';

import { useState } from 'react';
import Navigation from '../../components/Navigation';

export default function SequentialWorkflowPage() {
  const [inputValue, setInputValue] = useState<number | ''>('');
  const [result, setResult] = useState<number | null>(null);
  const [steps, setSteps] = useState<{ stepOne?: number; stepTwo?: number; stepThree?: number }>({});
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
    setResult(null);
    setSteps({});
    
    try {
      const response = await fetch('/api/sequential-workflow', {
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
      
      setResult(data.result);
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
        <h1 className="text-2xl font-bold text-center mb-8">シーケンシャルステップワークフロー</h1>
        
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
                placeholder="例: 10, 42, 100..."
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
          
          {result !== null && !isLoading && (
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
                    <h3 className="font-medium text-gray-700 mb-2">ステップ1: 2倍にする</h3>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p><span className="font-semibold">{inputValue}</span> × 2 = <span className="font-semibold">{steps.stepOne}</span></p>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-md p-4">
                    <h3 className="font-medium text-gray-700 mb-2">ステップ2: 1を加える</h3>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p><span className="font-semibold">{steps.stepOne}</span> + 1 = <span className="font-semibold">{steps.stepTwo}</span></p>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-md p-4">
                    <h3 className="font-medium text-gray-700 mb-2">ステップ3: 2で割る</h3>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p><span className="font-semibold">{steps.stepTwo}</span> ÷ 2 = <span className="font-semibold">{steps.stepThree}</span></p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-gray-50 p-6 rounded-md text-center">
                <p className="text-lg">最終結果: <span className="font-bold text-2xl text-blue-600">{result}</span></p>
                <p className="text-sm text-gray-500 mt-2">
                  入力値 {inputValue} を処理した結果
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">シーケンシャルステップワークフローについて</h2>
          <p className="mb-4">
            このデモでは、Mastraの<code>Workflow</code>クラスを使用して、複数のステップを順番に実行する方法を示しています：
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li><strong>ステップ1</strong>：入力値を2倍にします。</li>
            <li><strong>ステップ2</strong>：ステップ1の結果に1を加えます。</li>
            <li><strong>ステップ3</strong>：ステップ2の結果を2で割ります。</li>
          </ul>
          <p className="mb-4">
            この例は、各ステップが前のステップの結果に依存する処理フローを示しています。「ステップを表示」ボタンをクリックすると、各ステップの計算結果を確認できます。
          </p>
          <p>
            シーケンシャルステップパターンは、データ変換パイプライン、多段階の承認プロセス、段階的なデータ分析など、様々な用途に応用できます。
          </p>
        </div>
      </div>
    </div>
  );
}
