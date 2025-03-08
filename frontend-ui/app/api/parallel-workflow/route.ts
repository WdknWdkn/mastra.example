import { NextRequest, NextResponse } from 'next/server';
import { Step, Workflow } from '@mastra/core';
import { z } from 'zod';

// ステップ1: 入力値を2乗する
const squareStep = new Step({
  id: 'squareStep',
  inputSchema: z.object({
    inputValue: z.number(),
  }),
  outputSchema: z.object({
    squaredValue: z.number(),
  }),
  execute: async ({ context }) => {
    const inputValue = context?.getStepResult<{ inputValue: number }>('trigger')?.inputValue;
    if (!inputValue) throw new Error('入力値が提供されていません');
    const squaredValue = inputValue * inputValue;
    console.log(`2乗ステップ: ${inputValue} × ${inputValue} = ${squaredValue}`);
    return { squaredValue };
  },
});

// ステップ2: 入力値の立方根を計算する
const cubeRootStep = new Step({
  id: 'cubeRootStep',
  inputSchema: z.object({
    inputValue: z.number(),
  }),
  outputSchema: z.object({
    cubeRootValue: z.number(),
  }),
  execute: async ({ context }) => {
    const inputValue = context?.getStepResult<{ inputValue: number }>('trigger')?.inputValue;
    if (!inputValue) throw new Error('入力値が提供されていません');
    const cubeRootValue = Math.cbrt(inputValue);
    console.log(`立方根ステップ: ∛${inputValue} = ${cubeRootValue}`);
    return { cubeRootValue };
  },
});

// ワークフローの構築
const parallelWorkflow = new Workflow({
  name: 'parallel-workflow',
  triggerSchema: z.object({
    inputValue: z.number(),
  }),
});

// 並列ステップの定義（.thenを使わずに複数のstepを追加）
parallelWorkflow.step(squareStep).step(cubeRootStep).commit();

export async function POST(request: NextRequest) {
  try {
    const { inputValue } = await request.json();
    
    if (inputValue === undefined || typeof inputValue !== 'number') {
      return NextResponse.json(
        { error: '数値の入力値が必要です' },
        { status: 400 }
      );
    }
    
    console.log(`ワークフローを開始: 入力値 = ${inputValue}`);
    const { runId, start } = parallelWorkflow.createRun();
    const result = await start({ triggerData: { inputValue } });
    
    console.log('ワークフロー結果:', JSON.stringify(result.results, null, 2));
    
    // 各ステップの結果を抽出
    const squareStepResult = result.results.squareStep as { status: string; output?: { squaredValue: number } } | undefined;
    const cubeRootStepResult = result.results.cubeRootStep as { status: string; output?: { cubeRootValue: number } } | undefined;
    
    // 各ステップの出力値を取得
    const squaredValue = squareStepResult?.status === 'success' ? squareStepResult.output?.squaredValue : undefined;
    const cubeRootValue = cubeRootStepResult?.status === 'success' ? cubeRootStepResult.output?.cubeRootValue : undefined;
    
    // いずれかのステップが失敗した場合はエラーを返す
    if (squaredValue === undefined || cubeRootValue === undefined) {
      return NextResponse.json(
        { error: 'ワークフローの実行中にエラーが発生しました' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      results: {
        squaredValue,
        cubeRootValue
      },
      steps: {
        squareStep: squaredValue,
        cubeRootStep: cubeRootValue
      }
    });
  } catch (error: any) {
    console.error('並列ワークフローAPIでエラーが発生しました:', error);
    
    return NextResponse.json(
      { error: error.message || 'リクエストの処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
