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
    const result = await copywriterAgent.generate(`${context.topic}についてのブログ記事を作成してください`);
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
    const result = await editorAgent.generate(
      `以下のブログ記事を編集し、編集されたコピーのみを返してください: ${context.copy}`,
    );
    console.log('editor result', result.text);
    return {
      copy: result.text,
    };
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

async function main() {
  const agent = mastra.getAgent('publisherAgent');
  const result = await agent.generate(
    'React JavaScriptフレームワークについてのブログ記事を書いてください。最終的な編集されたコピーのみを返してください。',
  );
  console.log(result.text);
}

main();
