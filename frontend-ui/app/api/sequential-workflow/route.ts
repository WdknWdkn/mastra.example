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
  }),
  execute: async ({ context }) => {
    const valueToIncrement = context?.getStepResult<{ doubledValue: number }>('stepOne')?.doubledValue;
    if (!valueToIncrement) throw new Error('インクリメントする値が提供されていません');
    const incrementedValue = valueToIncrement + 1;
    console.log(`ステップ2: ${valueToIncrement} + 1 = ${incrementedValue}`);
    return { incrementedValue };
  },
});

// ステップ3: ステップ2の結果を2で割る
const stepThree = new Step({
  id: 'stepThree',
  inputSchema: z.object({
    valueToDivide: z.number(),
  }),
  outputSchema: z.object({
    dividedValue: z.number(),
  }),
  execute: async ({ context }) => {
    const valueToDivide = context?.getStepResult<{ incrementedValue: number }>('stepTwo')?.incrementedValue;
    if (!valueToDivide) throw new Error('除算する値が提供されていません');
    const dividedValue = valueToDivide / 2;
    console.log(`ステップ3: ${valueToDivide} ÷ 2 = ${dividedValue}`);
    return { dividedValue };
  },
});

// ワークフローの構築
const sequentialWorkflow = new Workflow({
  name: 'sequential-workflow',
  triggerSchema: z.object({
    inputValue: z.number(),
  }),
});

// シーケンシャルステップの定義
sequentialWorkflow.step(stepOne).then(stepTwo).then(stepThree).commit();

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
    const { runId, start } = sequentialWorkflow.createRun();
    const result = await start({ triggerData: { inputValue } });
    
    console.log('ワークフロー結果:', JSON.stringify(result.results, null, 2));
    
    // 各ステップの結果を抽出
    const stepOneResult = result.results.stepOne as { status: string; output?: { doubledValue: number } } | undefined;
    const stepTwoResult = result.results.stepTwo as { status: string; output?: { incrementedValue: number } } | undefined;
    const stepThreeResult = result.results.stepThree as { status: string; output?: { dividedValue: number } } | undefined;
    
    // 各ステップの出力値を取得
    const doubledValue = stepOneResult?.status === 'success' ? stepOneResult.output?.doubledValue : undefined;
    const incrementedValue = stepTwoResult?.status === 'success' ? stepTwoResult.output?.incrementedValue : undefined;
    const dividedValue = stepThreeResult?.status === 'success' ? stepThreeResult.output?.dividedValue : undefined;
    
    // 最終結果を確認
    if (dividedValue === undefined) {
      return NextResponse.json(
        { error: 'ワークフローの実行中にエラーが発生しました' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      result: dividedValue,
      steps: {
        stepOne: doubledValue,
        stepTwo: incrementedValue,
        stepThree: dividedValue
      }
    });
  } catch (error: any) {
    console.error('シーケンシャルワークフローAPIでエラーが発生しました:', error);
    
    return NextResponse.json(
      { error: error.message || 'リクエストの処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
