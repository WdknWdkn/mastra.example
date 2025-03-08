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
    // Add type assertion to access the copy property
    const copywriterResult = context?.getStepResult('copywriterStep') as { copy?: string } | undefined;
    const copy = copywriterResult?.copy;

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
    console.log('Starting workflow with topic:', topic);
    const res = await start({ triggerData: { topic } });
    console.log('Workflow results:', JSON.stringify(res.results, null, 2));
    
    // Check for failed steps and return error information
    if (res.results.copywriterStep && 'status' in res.results.copywriterStep && res.results.copywriterStep.status === 'failed') {
      const error = res.results.copywriterStep.error || 'コピーライターステップが失敗しました';
      console.error('Workflow step failed:', error);
      return NextResponse.json(
        { 
          error: `ワークフローエラー: ${error}`,
          apiKeyError: error.includes('API key') 
        },
        { status: 500 }
      );
    }
    
    // Add type assertion to access the copy property
    const copywriterResult = res.results.copywriterStep as { copy?: string } | undefined;
    const editorResult = res.results.editorStep as { copy?: string } | undefined;
    
    const finalResult = editorResult?.copy || copywriterResult?.copy || '';
    console.log('Final blog post:', finalResult);
    console.log('Copywriter step:', copywriterResult?.copy);
    console.log('Editor step:', editorResult?.copy);
    
    // If we have no content but no explicit error was caught, return a generic error
    if (!finalResult) {
      return NextResponse.json(
        { 
          error: 'ブログ記事の生成に失敗しました。OpenAI APIキーが正しく設定されているか確認してください。',
          apiKeyError: true
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      blogPost: finalResult,
      steps: {
        copywriter: copywriterResult?.copy || '',
        editor: editorResult?.copy || ''
      }
    });
  } catch (error) {
    console.error('エラー:', error);
    
    // Add more detailed error information
    let errorMessage = 'リクエストの処理中にエラーが発生しました';
    if (error instanceof Error) {
      errorMessage = `エラー: ${error.message}`;
      console.error('エラースタック:', error.stack);
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
