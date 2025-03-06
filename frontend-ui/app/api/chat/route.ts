import { openai } from '@ai-sdk/openai';
import { Agent, createTool } from '@mastra/core';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// 猫の事実を取得する関数
const getCatFact = async () => {
  const { fact } = (await fetch('https://catfact.ninja/fact').then(res => res.json())) as {
    fact: string;
  };

  return fact;
};

// 猫の事実ツールを作成
const catFact = createTool({
  id: 'Get cat facts',
  inputSchema: z.object({}),
  description: 'Fetches cat facts',
  execute: async () => {
    console.log('using tool to fetch cat fact');
    return {
      catFact: await getCatFact(),
    };
  },
});

// システムプロンプト
const instructions = `You are a helpful cat expert assistant. When discussing cats, you should always include an interesting cat fact.

  Your main responsibilities:
  1. Answer questions about cats
  2. Use the catFact tool to provide verified cat facts
  3. Incorporate the cat facts naturally into your responses

  Always use the catFact tool at least once in your responses to ensure accuracy.`;

// 猫の専門家エージェントを作成
const catAgent = new Agent({
  name: 'cat-one',
  instructions: instructions,
  model: openai('gpt-4o-mini'),
  tools: {
    catFact,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'メッセージが必要です' },
        { status: 400 }
      );
    }

    const result = await catAgent.generate(message);

    return NextResponse.json({ response: result.text });
  } catch (error) {
    console.error('エラーが発生しました:', error);
    return NextResponse.json(
      { error: 'リクエストの処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
