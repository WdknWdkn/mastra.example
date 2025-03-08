import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { Agent, Step, Workflow } from '@mastra/core';
import { z } from 'zod';

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

const blogPostWorkflow = new Workflow({
  name: 'blog-post-workflow',
  triggerSchema: z.object({
    topic: z.string(),
  }),
});

// ステップを順番に実行
blogPostWorkflow.step(copywriterStep).then(editorStep).commit();

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();
    
    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'トピックが必要です' },
        { status: 400 }
      );
    }

    const { runId, start } = blogPostWorkflow.createRun();
    const res = await start({ triggerData: { topic } });
    
    const finalResult = res.results.editorStep?.copy || res.results.copywriterStep?.copy || '';
    
    return NextResponse.json({ 
      blogPost: finalResult,
      steps: {
        copywriter: res.results.copywriterStep?.copy || '',
        editor: res.results.editorStep?.copy || ''
      }
    });
  } catch (error) {
    console.error('エラー:', error);
    return NextResponse.json(
      { error: 'リクエストの処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
