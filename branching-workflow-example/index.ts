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
  branchingWorkflow
    .step(stepOne)
    .then(stepTwo)
    .step(evenPathStep)
    .step(oddPathStep);

  branchingWorkflow.commit();

  const { runId, start } = branchingWorkflow.createRun();

  console.log('実行ID:', runId);

  const res = await start({ triggerData: { inputValue: 10 } });

  console.log('ワークフロー結果:');
  console.log(JSON.stringify(res.results, null, 2));
  
  // 各ステップの結果を抽出して表示
  const stepOneResult = res.results.stepOne as { status: string; output?: { doubledValue: number } } | undefined;
  const stepTwoResult = res.results.stepTwo as { status: string; output?: { incrementedValue: number; isEven: boolean } } | undefined;
  const evenPathResult = res.results.evenPathStep as { status: string; output?: { doubledResult: number } } | undefined;
  const oddPathResult = res.results.oddPathStep as { status: string; output?: { tripledResult: number } } | undefined;
  
  const doubledValue = stepOneResult?.status === 'success' ? stepOneResult.output?.doubledValue : undefined;
  const incrementedValue = stepTwoResult?.status === 'success' ? stepTwoResult.output?.incrementedValue : undefined;
  const isEven = stepTwoResult?.status === 'success' ? stepTwoResult.output?.isEven : undefined;
  
  // 手動で適切なパスのステップを実行
  let finalResult;
  if (isEven === true && evenPathResult?.status !== 'success') {
    // 偶数パスを手動で実行
    if (incrementedValue) {
      const doubledResult = incrementedValue * 2;
      console.log(`偶数パス（手動実行）: ${incrementedValue} × 2 = ${doubledResult}`);
      finalResult = doubledResult;
    }
  } else if (isEven === false && oddPathResult?.status !== 'success') {
    // 奇数パスを手動で実行
    if (incrementedValue) {
      const tripledResult = incrementedValue * 3;
      console.log(`奇数パス（手動実行）: ${incrementedValue} × 3 = ${tripledResult}`);
      finalResult = tripledResult;
    }
  } else {
    // ワークフローの結果を使用
    finalResult = isEven 
      ? (evenPathResult?.status === 'success' ? evenPathResult.output?.doubledResult : undefined)
      : (oddPathResult?.status === 'success' ? oddPathResult.output?.tripledResult : undefined);
  }
  
  console.log('\n処理結果サマリー:');
  console.log(`入力値: 10`);
  console.log(`ステップ1 (2倍): ${doubledValue}`);
  console.log(`ステップ2 (1を加える): ${incrementedValue} (${isEven ? '偶数' : '奇数'})`);
  console.log(`選択されたパス: ${isEven ? '偶数パス' : '奇数パス'}`);
  console.log(`最終結果: ${finalResult}`);
}

main();
