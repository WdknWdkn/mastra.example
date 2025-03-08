import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { Agent, Step, Workflow } from '@mastra/core';
import { z } from 'zod';

// 企画エージェント - コンテンツの構造を計画する
const plannerAgent = new Agent({
  name: 'Planner',
  instructions: 'あなたはブログ記事の構造を計画する企画エージェントです。トピックに基づいて、記事の構成（見出しと各セクションの要点）を作成してください。',
  model: openai('gpt-4o-mini'),
});

const plannerStep = new Step({
  id: 'plannerStep',
  execute: async ({ context }) => {
    if (!context?.triggerData?.topic) {
      throw new Error('トピックがトリガーデータに見つかりません');
    }
    const result = await plannerAgent.generate(`${context.triggerData.topic}についてのブログ記事の構成を作成してください。主要な見出しと各セクションで扱うべき要点を含めてください。`);
    return {
      outline: result.text,
    };
  },
});

// コピーライターエージェント - 記事の本文を作成する
const copywriterAgent = new Agent({
  name: 'Copywriter',
  instructions: 'あなたはブログ記事を作成するコピーライターエージェントです。与えられた構成に基づいて、詳細な記事を作成してください。',
  model: openai('gpt-4o-mini'),
});

const copywriterStep = new Step({
  id: 'copywriterStep',
  execute: async ({ context }) => {
    // Add type assertion to access the outline property
    const plannerResult = context?.getStepResult('plannerStep') as { outline?: string } | undefined;
    const outline = plannerResult?.outline;

    if (!outline) {
      throw new Error('企画ステップの結果が見つかりません');
    }

    const topic = context?.triggerData?.topic;
    const result = await copywriterAgent.generate(`以下の構成に基づいて、${topic}についての詳細なブログ記事を作成してください：\n\n${outline}`);
    return {
      draft: result.text,
    };
  },
});

// 編集エージェント - 記事を編集・改善する
const editorAgent = new Agent({
  name: 'Editor',
  instructions: 'あなたはブログ記事を編集するエディターエージェントです。記事を校正し、読みやすさと正確性を向上させてください。',
  model: openai('gpt-4o-mini'),
});

const editorStep = new Step({
  id: 'editorStep',
  execute: async ({ context }) => {
    // Add type assertion to access the draft property
    const copywriterResult = context?.getStepResult('copywriterStep') as { draft?: string } | undefined;
    const draft = copywriterResult?.draft;

    if (!draft) {
      throw new Error('コピーライターステップの結果が見つかりません');
    }

    const result = await editorAgent.generate(`以下のブログ記事を編集し、読みやすさと正確性を向上させてください。編集後の記事全体を返してください：\n\n${draft}`);
    return {
      finalPost: result.text,
    };
  },
});

const createWorkflow = new Workflow({
  name: 'create-workflow',
  triggerSchema: z.object({
    topic: z.string(),
  }),
});

// ステップを順番に実行
createWorkflow.step(plannerStep).then(copywriterStep).then(editorStep).commit();

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { error: 'トピックが必要です' },
        { status: 400 }
      );
    }

    const { runId, start } = createWorkflow.createRun();
    const result = await start({ triggerData: { topic } });
    
    console.log('Workflow results:', JSON.stringify(result.results, null, 2));
    
    // Check for failed steps and return error information
    if (result.results.plannerStep && 'status' in result.results.plannerStep && result.results.plannerStep.status === 'failed') {
      const error = result.results.plannerStep.error || 'プランナーステップが失敗しました';
      console.error('Workflow step failed:', error);
      return NextResponse.json(
        { 
          error: `ワークフローエラー: ${error}`,
          apiKeyError: error.includes('API key') 
        },
        { status: 500 }
      );
    }
    
    // Extract the results from the output property based on the workflow structure
    const plannerResult = result.results.plannerStep as { status: string; output?: { outline: string } } | undefined;
    const copywriterResult = result.results.copywriterStep as { status: string; output?: { draft: string } } | undefined;
    const editorResult = result.results.editorStep as { status: string; output?: { finalPost: string } } | undefined;
    
    const plannerText = plannerResult?.status === 'success' ? plannerResult.output?.outline : '';
    const copywriterText = copywriterResult?.status === 'success' ? copywriterResult.output?.draft : '';
    const editorText = editorResult?.status === 'success' ? editorResult.output?.finalPost : '';
    
    const finalResult = editorText || '';
    console.log('Final blog post:', finalResult);
    console.log('Planner step:', plannerText);
    console.log('Copywriter step:', copywriterText);
    console.log('Editor step:', editorText);
    
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
        planner: plannerText || '',
        copywriter: copywriterText || '',
        editor: editorText || ''
      }
    });
  } catch (error: any) {
    console.error('Error in create-workflow API:', error);

    // OpenAI API キーエラーの特別な処理
    if (error.message && error.message.includes('API key')) {
      return NextResponse.json(
        { error: error.message, apiKeyError: true },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'ワークフローの実行中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
