import { Step, Workflow } from '@mastra/core';
import { z } from 'zod';

async function main() {
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
  parallelWorkflow.step(squareStep).step(cubeRootStep);

  parallelWorkflow.commit();

  const { runId, start } = parallelWorkflow.createRun();

  console.log('実行ID:', runId);

  const res = await start({ triggerData: { inputValue: 27 } });

  console.log('ワークフロー結果:');
  console.log(JSON.stringify(res.results, null, 2));
  
  // 各ステップの結果を抽出して表示
  const squareStepResult = res.results.squareStep as { status: string; output?: { squaredValue: number } } | undefined;
  const cubeRootStepResult = res.results.cubeRootStep as { status: string; output?: { cubeRootValue: number } } | undefined;
  
  const squaredValue = squareStepResult?.status === 'success' ? squareStepResult.output?.squaredValue : undefined;
  const cubeRootValue = cubeRootStepResult?.status === 'success' ? cubeRootStepResult.output?.cubeRootValue : undefined;
  
  console.log('\n処理結果サマリー:');
  console.log(`入力値: 27`);
  console.log(`2乗ステップ: ${squaredValue}`);
  console.log(`立方根ステップ: ${cubeRootValue}`);
}

main();
