import { Step, Workflow } from '@mastra/core';
import { z } from 'zod';

async function main() {
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
  sequentialWorkflow.step(stepOne).then(stepTwo).then(stepThree);

  sequentialWorkflow.commit();

  const { runId, start } = sequentialWorkflow.createRun();

  console.log('実行ID:', runId);

  const res = await start({ triggerData: { inputValue: 10 } });

  console.log('ワークフロー結果:');
  console.log(JSON.stringify(res.results, null, 2));
  
  // 各ステップの結果を抽出して表示
  const stepOneResult = res.results.stepOne as { status: string; output?: { doubledValue: number } } | undefined;
  const stepTwoResult = res.results.stepTwo as { status: string; output?: { incrementedValue: number } } | undefined;
  const stepThreeResult = res.results.stepThree as { status: string; output?: { dividedValue: number } } | undefined;
  
  const doubledValue = stepOneResult?.status === 'success' ? stepOneResult.output?.doubledValue : undefined;
  const incrementedValue = stepTwoResult?.status === 'success' ? stepTwoResult.output?.incrementedValue : undefined;
  const dividedValue = stepThreeResult?.status === 'success' ? stepThreeResult.output?.dividedValue : undefined;
  
  console.log('\n処理結果サマリー:');
  console.log(`入力値: 10`);
  console.log(`ステップ1 (2倍): ${doubledValue}`);
  console.log(`ステップ2 (1を加える): ${incrementedValue}`);
  console.log(`ステップ3 (2で割る): ${dividedValue}`);
  console.log(`最終結果: ${dividedValue}`);
}

main();
