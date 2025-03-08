import { NextRequest, NextResponse } from 'next/server';
import { Step, Workflow } from '@mastra/core';
import { z } from 'zod';

// ステップ1: 入力値を2倍にする
const stepOne = new Step({
  id: 'stepOne',
  inputSchema: z.object({
    inputValue: z.number(),
  }),
  outputSchema: z.object({
    doubledValue: z.number(),
  }),
  execute: async ({ context }) => {
    const inputValue = context?.getStepResult<{ inputValue: number }>('trigger')?.inputValue;
    if (!inputValue) throw new Error('入力値が提供されていません');
    const doubledValue = inputValue * 2;
    console.log(`ステップ1: ${inputValue} × 2 = ${doubledValue}`);
    return { doubledValue };
  },
});

// ステップ2: ステップ1の結果に1を加える
const stepTwo = new Step({
  id: 'stepTwo',
  inputSchema: z.object({
    valueToIncrement: z.number(),
  }),
  outputSchema: z.object({
    incrementedValue: z.number(),
    isEven: z.boolean(),
  }),
  execute: async ({ context }) => {
    const valueToIncrement = context?.getStepResult<{ doubledValue: number }>('stepOne')?.doubledValue;
    if (!valueToIncrement) throw new Error('インクリメントする値が提供されていません');
    const incrementedValue = valueToIncrement + 1;
    const isEven = incrementedValue % 2 === 0;
    console.log(`ステップ2: ${valueToIncrement} + 1 = ${incrementedValue} (${isEven ? '偶数' : '奇数'})`);
    return { incrementedValue, isEven };
  },
});

// ステップ3A: 偶数の場合 - 値を2倍にする
const evenPathStep = new Step({
  id: 'evenPathStep',
  inputSchema: z.object({
    value: z.number(),
  }),
  outputSchema: z.object({
    doubledResult: z.number(),
  }),
  execute: async ({ context }) => {
    const value = context?.getStepResult<{ incrementedValue: number }>('stepTwo')?.incrementedValue;
    if (!value) throw new Error('処理する値が提供されていません');
    const doubledResult = value * 2;
    console.log(`偶数パス: ${value} × 2 = ${doubledResult}`);
    return { doubledResult };
  },
});

// ステップ3B: 奇数の場合 - 値を3倍にする
const oddPathStep = new Step({
  id: 'oddPathStep',
  inputSchema: z.object({
    value: z.number(),
  }),
  outputSchema: z.object({
    tripledResult: z.number(),
  }),
  execute: async ({ context }) => {
    const value = context?.getStepResult<{ incrementedValue: number }>('stepTwo')?.incrementedValue;
    if (!value) throw new Error('処理する値が提供されていません');
    const tripledResult = value * 3;
    console.log(`奇数パス: ${value} × 3 = ${tripledResult}`);
    return { tripledResult };
  },
});

// ワークフローの構築
const branchingWorkflow = new Workflow({
  name: 'branching-workflow',
  triggerSchema: z.object({
    inputValue: z.number(),
  }),
});

// 条件分岐を持つワークフローの定義
// 注: 実際の条件分岐はワークフロー実行後に結果に基づいて行います
branchingWorkflow
  .step(stepOne)
  .then(stepTwo)
  .step(evenPathStep)
  .step(oddPathStep)
  .commit();

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
    const { runId, start } = branchingWorkflow.createRun();
    const result = await start({ triggerData: { inputValue } });
    
    console.log('ワークフロー結果:', JSON.stringify(result.results, null, 2));
    
    // 各ステップの結果を抽出
    const stepOneResult = result.results.stepOne as { status: string; output?: { doubledValue: number } } | undefined;
    const stepTwoResult = result.results.stepTwo as { status: string; output?: { incrementedValue: number; isEven: boolean } } | undefined;
    const evenPathResult = result.results.evenPathStep as { status: string; output?: { doubledResult: number } } | undefined;
    const oddPathResult = result.results.oddPathStep as { status: string; output?: { tripledResult: number } } | undefined;
    
    // 各ステップの出力値を取得
    const doubledValue = stepOneResult?.status === 'success' ? stepOneResult.output?.doubledValue : undefined;
    const incrementedValue = stepTwoResult?.status === 'success' ? stepTwoResult.output?.incrementedValue : undefined;
    const isEven = stepTwoResult?.status === 'success' ? stepTwoResult.output?.isEven : undefined;
    
    // ステップ2の結果に基づいて、適切なパスのステップを実行
    if (isEven !== undefined) {
      console.log(`値 ${incrementedValue} は ${isEven ? '偶数' : '奇数'} です。${isEven ? '偶数' : '奇数'}パスを実行します。`);
    }
    
    // 条件分岐の結果を取得
    let finalResult;
    let selectedPath;
    
    // ステップ2の結果に基づいて分岐パスを決定
    if (isEven === true) {
      console.log('偶数パスを選択しました');
      // 偶数の場合は、evenPathStepの結果を使用
      finalResult = evenPathResult?.status === 'success' ? evenPathResult.output?.doubledResult : undefined;
      selectedPath = 'even';
    } else if (isEven === false) {
      console.log('奇数パスを選択しました');
      // 奇数の場合は、oddPathStepの結果を使用
      finalResult = oddPathResult?.status === 'success' ? oddPathResult.output?.tripledResult : undefined;
      selectedPath = 'odd';
    } else {
      console.error('ステップ2の結果が不明です');
      return NextResponse.json(
        { error: 'ワークフローの実行中にエラーが発生しました' },
        { status: 500 }
      );
    }
    
    // 手動で適切なパスのステップを実行
    if (isEven === true && evenPathResult?.status !== 'success') {
      // 偶数パスを手動で実行
      try {
        const value = incrementedValue;
        if (value) {
          const doubledResult = value * 2;
          console.log(`偶数パス（手動実行）: ${value} × 2 = ${doubledResult}`);
          finalResult = doubledResult;
        }
      } catch (error) {
        console.error('偶数パスの手動実行中にエラーが発生しました:', error);
      }
    } else if (isEven === false && oddPathResult?.status !== 'success') {
      // 奇数パスを手動で実行
      try {
        const value = incrementedValue;
        if (value) {
          const tripledResult = value * 3;
          console.log(`奇数パス（手動実行）: ${value} × 3 = ${tripledResult}`);
          finalResult = tripledResult;
        }
      } catch (error) {
        console.error('奇数パスの手動実行中にエラーが発生しました:', error);
      }
    }
    
    // 最終結果を確認
    if (finalResult === undefined) {
      return NextResponse.json(
        { error: 'ワークフローの実行中にエラーが発生しました' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      result: finalResult,
      selectedPath,
      steps: {
        stepOne: doubledValue,
        stepTwo: incrementedValue,
        isEven,
        evenPathStep: isEven ? finalResult : null,
        oddPathStep: !isEven ? finalResult : null
      }
    });
  } catch (error: any) {
    console.error('分岐ワークフローAPIでエラーが発生しました:', error);
    
    return NextResponse.json(
      { error: error.message || 'リクエストの処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
