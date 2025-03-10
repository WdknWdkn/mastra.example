import { openai } from '@ai-sdk/openai';
import { Agent, Step, Workflow } from '@mastra/core';
import { z } from 'zod';
import { fileURLToPath } from 'url';

const copywriterAgent = new Agent({
  name: 'Copywriter',
  instructions: 'あなたはブログ記事のコピーを書くコピーライターエージェントです。',
  model: openai('gpt-4o-mini'),
});

const copywriterStep = new Step({
  id: 'copywriterStep',
  execute: async ({ context }) => {
    if (!context?.triggerData?.topic) {
      throw new Error('トピックがトリガーデータに見つかりません');
    }
    const result = await copywriterAgent.generate(`${context.triggerData.topic}についてのブログ記事を作成してください。`);
    console.log('copywriter result', result.text);
    return {
      copy: result.text,
    };
  },
});

const editorAgent = new Agent({
  name: 'Editor',
  instructions: 'あなたはブログ記事のコピーを編集するエディターエージェントです。',
  model: openai('gpt-4o-mini'),
});

const editorStep = new Step({
  id: 'editorStep',
  execute: async ({ context }) => {
    const copy = context?.getStepResult('copywriterStep')?.copy;

    if (!copy) {
      throw new Error('コピーライターステップの結果が見つかりません');
    }

    const result = await editorAgent.generate(`以下のブログ記事を編集し、編集されたコピーのみを返してください: ${copy}`);
    console.log('editor result', result.text);
    return {
      copy: result.text,
    };
  },
});

const myWorkflow = new Workflow({
  name: 'blog-post-workflow',
  triggerSchema: z.object({
    topic: z.string(),
  }),
});

// ステップを順番に実行
myWorkflow.step(copywriterStep).then(editorStep).commit();

// メイン実行部分（ローカルテスト用）
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { runId, start } = myWorkflow.createRun();
  const res = await start({ triggerData: { topic: 'Reactフレームワーク' } });
  console.log('Results: ', res.results);
}

// エクスポート
export { myWorkflow };
