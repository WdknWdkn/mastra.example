import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { Agent, createTool, Mastra } from '@mastra/core';
import { z } from 'zod';

const copywriterAgent = new Agent({
  name: 'Copywriter',
  instructions: 'あなたはブログ記事のコピーを書くコピーライターエージェントです。',
  model: openai('gpt-4o-mini'),
});

const copywriterTool = createTool({
  id: 'copywriter-agent',
  description: 'ブログ記事のコピーを書くためにコピーライターエージェントを呼び出します。',
  inputSchema: z.object({
    topic: z.string().describe('ブログ記事のトピック'),
  }),
  outputSchema: z.object({
    copy: z.string().describe('ブログ記事のコピー'),
  }),
  execute: async ({ context }) => {
    try {
      const result = await copywriterAgent.generate(`${context.topic}についてのブログ記事を作成してください。情報豊富で魅力的な内容にしてください。`);
      console.log('copywriter result', result.text);
      return {
        copy: result.text,
      };
    } catch (error) {
      console.error('コピーライターエージェントでエラーが発生しました:', error);
      return {
        copy: `${context.topic}についての記事を生成できませんでした。別のトピックをお試しください。`,
      };
    }
  },
});

const editorAgent = new Agent({
  name: 'Editor',
  instructions: 'あなたはブログ記事のコピーを編集するエディターエージェントです。文法、スタイル、明確さを改善し、より魅力的で読みやすくします。',
  model: openai('gpt-4o-mini'),
});

const editorTool = createTool({
  id: 'editor-agent',
  description: 'ブログ記事のコピーを編集するためにエディターエージェントを呼び出します。',
  inputSchema: z.object({
    copy: z.string().describe('ブログ記事のコピー'),
  }),
  outputSchema: z.object({
    copy: z.string().describe('編集されたブログ記事のコピー'),
  }),
  execute: async ({ context }) => {
    try {
      const result = await editorAgent.generate(
        `以下のブログ記事を編集し、文法、スタイル、明確さを改善してください。編集されたコピーのみを返してください: ${context.copy}`,
      );
      console.log('editor result', result.text);
      return {
        copy: result.text,
      };
    } catch (error) {
      console.error('エディターエージェントでエラーが発生しました:', error);
      return {
        copy: context.copy, // エラーが発生した場合は元のコピーを返す
      };
    }
  },
});

const publisherAgent = new Agent({
  name: 'publisherAgent',
  instructions:
    'あなたはパブリッシャーエージェントです。特定のトピックについてブログ記事のコピーを書くためにコピーライターエージェントを呼び出し、次にそのコピーを編集するためにエディターエージェントを呼び出します。最終的な編集されたコピーのみを返してください。',
  model: openai('gpt-4o-mini'),
  tools: { copywriterTool, editorTool },
});

const mastra = new Mastra({
  agents: { publisherAgent },
});

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();
    
    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'トピックが必要です' },
        { status: 400 }
      );
    }

    const agent = mastra.getAgent('publisherAgent');
    const result = await agent.generate(
      `${topic}についてのブログ記事を書いてください。最終的な編集されたコピーのみを返してください。`,
    );
    
    return NextResponse.json({ blogPost: result.text });
  } catch (error) {
    console.error('エラー:', error);
    return NextResponse.json(
      { error: 'リクエストの処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
