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
    const outline = context?.getStepResult('plannerStep')?.outline;

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
    const draft = context?.getStepResult('copywriterStep')?.draft;

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

    return NextResponse.json({
      blogPost: result.results.editorStep.finalPost,
      steps: {
        planner: result.results.plannerStep.outline,
        copywriter: result.results.copywriterStep.draft,
        editor: result.results.editorStep.finalPost,
      },
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
