'use client';

import { useState } from 'react';
import Navigation from '../../components/Navigation';

export default function BranchingWorkflowPage() {
  const [inputValue, setInputValue] = useState<number | ''>('');
  const [result, setResult] = useState<number | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [steps, setSteps] = useState<{
    stepOne?: number;
    stepTwo?: number;
    isEven?: boolean;
    evenPathStep?: number | null;
    oddPathStep?: number | null;
  }>({});
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
    setSelectedPath(null);
    setSteps({});
    
    try {
      const response = await fetch('/api/branching-workflow', {
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
      setSelectedPath(data.selectedPath);
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
        <h1 className="text-2xl font-bold text-center mb-8">分岐パスワークフロー</h1>
        
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
                placeholder="例: 10, 15, 42..."
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
                <div className="mb-6">
                  <div className="relative pb-8">
                    <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200"></div>
                    
                    <div className="relative flex items-start mb-6">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-500 text-white font-bold text-sm z-10">1</div>
                      <div className="ml-4 bg-gray-50 p-4 rounded-md border border-gray-200 flex-grow">
                        <h3 className="font-medium text-gray-700 mb-2">ステップ1: 2倍にする</h3>
                        <div className="bg-white p-3 rounded-md border border-gray-100">
                          <p><span className="font-semibold">{inputValue}</span> × 2 = <span className="font-semibold">{steps.stepOne}</span></p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative flex items-start mb-6">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-500 text-white font-bold text-sm z-10">2</div>
                      <div className="ml-4 bg-gray-50 p-4 rounded-md border border-gray-200 flex-grow">
                        <h3 className="font-medium text-gray-700 mb-2">ステップ2: 1を加える</h3>
                        <div className="bg-white p-3 rounded-md border border-gray-100">
                          <p><span className="font-semibold">{steps.stepOne}</span> + 1 = <span className="font-semibold">{steps.stepTwo}</span> ({steps.isEven ? '偶数' : '奇数'})</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative flex items-start">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-500 text-white font-bold text-sm z-10">3</div>
                      <div className="ml-4 bg-gray-50 p-4 rounded-md border border-gray-200 flex-grow">
                        <h3 className="font-medium text-gray-700 mb-2">
                          ステップ3: {selectedPath === 'even' ? '偶数パス (2倍にする)' : '奇数パス (3倍にする)'}
                        </h3>
                        <div className="bg-white p-3 rounded-md border border-gray-100">
                          {selectedPath === 'even' ? (
                            <p><span className="font-semibold">{steps.stepTwo}</span> × 2 = <span className="font-semibold">{steps.evenPathStep}</span></p>
                          ) : (
                            <p><span className="font-semibold">{steps.stepTwo}</span> × 3 = <span className="font-semibold">{steps.oddPathStep}</span></p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-100">
                    <p className="text-sm text-blue-700">
                      <span className="font-semibold">選択された分岐パス:</span> {selectedPath === 'even' ? '偶数パス' : '奇数パス'}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="bg-gray-50 p-6 rounded-md text-center">
                <p className="text-lg">最終結果: <span className="font-bold text-2xl text-blue-600">{result}</span></p>
                <p className="text-sm text-gray-500 mt-2">
                  入力値 {inputValue} を {selectedPath === 'even' ? '偶数' : '奇数'}パスで処理した結果
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">分岐パスワークフローについて</h2>
          <p className="mb-4">
            このデモでは、Mastraの<code>Workflow</code>クラスを使用して、条件分岐を持つワークフローを実装する方法を示しています：
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li><strong>ステップ1</strong>：入力値を2倍にします。</li>
            <li><strong>ステップ2</strong>：ステップ1の結果に1を加え、結果が偶数か奇数かを判定します。</li>
            <li><strong>条件分岐</strong>：
              <ul className="list-disc pl-5 mt-2">
                <li><strong>偶数パス</strong>：ステップ2の結果が偶数の場合、値を2倍にします。</li>
                <li><strong>奇数パス</strong>：ステップ2の結果が奇数の場合、値を3倍にします。</li>
              </ul>
            </li>
          </ul>
          <p className="mb-4">
            この例は、前のステップの結果に基づいて異なる処理パスを選択する方法を示しています。「ステップを表示」ボタンをクリックすると、各ステップの計算結果と選択されたパスを確認できます。
          </p>
          <p>
            分岐パスワークフローパターンは、条件に基づいて異なる処理を行う必要がある場合や、データの特性に応じて処理を変更する場合などに適しています。
          </p>
        </div>
      </div>
    </div>
  );
}
