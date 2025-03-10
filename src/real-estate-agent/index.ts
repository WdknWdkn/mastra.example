import { openai } from '@ai-sdk/openai';
import { Agent, Workflow } from '@mastra/core';
import { z } from 'zod';
import { initializeStoreTool, searchPropertiesTool } from './tools/propertyStore';
import { csvParserTool } from './tools/csvParser';
import { conversationMemory, saveMessageTool, savePreferenceTool, extractSearchCriteriaTool } from './components/memory';
import { findSimilarPropertiesTool, recommendPropertiesTool } from './components/retrieval';
import { loadDataStep, conversationStep, searchStep, recommendStep } from './workflow/steps';

// 不動産エージェントの作成
export const realEstateAgent = new Agent({
  name: '不動産エージェント',
  instructions: `あなたは不動産エージェントです。ユーザーの希望に合った物件を提案するお手伝いをします。
  
  【役割】
  - ユーザーの希望条件（予算、エリア、間取り、駅からの距離など）を丁寧にヒアリングします
  - 条件に合った物件を検索し、最適な物件を提案します
  - ユーザーの質問に対して物件情報に基づいて回答します
  
  【会話の流れ】
  1. ユーザーの希望条件を聞き出す
  2. 以下の必須項目を確認する
     - 予算: 具体的な金額（例: 10万円以内）
     - エリア: 希望する地域（例: 東京都新宿区）
     - 間取り: 希望する間取り（例: 1LDK）
     - 駅からの距離: 徒歩何分以内か（例: 徒歩10分以内）
     - 広さ: 希望する広さ（例: 30㎡以上）
     - 特徴: 重視する条件（例: ペット可、オートロック）
  3. 未回答の項目があれば、質問して情報を集める
  4. 条件に合った物件を検索する
  5. 検索結果に基づいて物件を提案する
  6. ユーザーからのフィードバックを受けて条件を調整する
  
  【注意点】
  - 常に丁寧で親しみやすい口調を心がけてください
  - 専門用語は避け、わかりやすい言葉で説明してください
  - ユーザーの予算や希望を尊重してください
  - 物件情報は正確に伝えてください
  - 必須項目が埋まっていない場合は、自然な会話の流れで質問してください
  - 一度に多くの質問をせず、会話を自然に進めてください
  - ユーザーの回答から複数の条件を抽出できる場合は、効率的に情報を集めてください
  
  あなたはユーザーの希望に合った物件を見つけるための頼れるパートナーです。`,
  model: openai('gpt-4o-mini'),
  tools: {
    csvParser: csvParserTool,
    initializeStore: initializeStoreTool,
    searchProperties: searchPropertiesTool,
    saveMessage: saveMessageTool,
    savePreference: savePreferenceTool,
    extractSearchCriteria: extractSearchCriteriaTool,
    findSimilarProperties: findSimilarPropertiesTool,
    recommendProperties: recommendPropertiesTool,
  },
});

// 不動産ワークフローの作成
export const realEstateWorkflow = new Workflow({
  name: 'real-estate-workflow',
  triggerSchema: z.object({
    filePath: z.string().optional().describe('CSVファイルのパスまたはディレクトリパス'),
    region: z.string().optional().describe('特定の地域のCSVファイルを読み込む場合の地域名'),
    message: z.string().optional().describe('ユーザーのメッセージ'),
    threadId: z.string().optional().describe('会話スレッドID'),
  }),
});

// ワークフローステップの定義
realEstateWorkflow
  .step(loadDataStep)
  .then(conversationStep)
  .then(searchStep)
  .then(recommendStep);

realEstateWorkflow.commit();

// ワークフロー実行関数
export async function executeRealEstateWorkflow(filePath: string, message: string, region?: string, threadId?: string) {
  try {
    const { runId, start } = realEstateWorkflow.createRun();
    
    console.log('ワークフロー実行ID:', runId);
    
    // スレッドIDが提供されている場合は設定
    if (threadId) {
      conversationMemory.setThread(threadId);
    } else {
      // ワークフロー実行IDをスレッドIDとして使用
      conversationMemory.setThread(runId);
    }
    
    const res = await start({
     triggerData: {
        filePath,
        message,
        region,
        threadId: threadId || runId,
      },
    });
    
    // StepResult doesn't have direct access to output properties
    const recommendResult = res.results.recommend as { status: string; recommendation?: string } | undefined;
    const loadDataResult = res.results['load-data'] as { regions?: string[] } | undefined;
    
    return {
      success: true,
      results: res.results,
      recommendation: recommendResult?.recommendation || '物件の提案ができませんでした。',
      regions: loadDataResult?.regions || [],
      threadId: threadId || runId, // スレッドIDを返す
    };
  } catch (error) {
    console.error('ワークフロー実行中にエラーが発生しました:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラーが発生しました',
    };
  }
}

// エージェント応答生成関数
export async function generateAgentResponse(message: string, threadId?: string) {
  try {
    // スレッドIDが提供されている場合は設定
    if (threadId) {
      conversationMemory.setThread(threadId);
    }
    
    const result = await realEstateAgent.generate(message);
    return {
      success: true,
      response: result.text,
      threadId: threadId || conversationMemory.getCurrentThreadId(),
    };
  } catch (error) {
    console.error('エージェント応答生成中にエラーが発生しました:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラーが発生しました',
    };
  }
}

// テスト用関数
async function main() {
  try {
    const csvPath = process.env.CSV_PATH || './attachments/6d3de071-7518-4fae-83f8-ead6ee9b3e7a/properties';
    const testMessage = '東京で予算10万円以内の物件を探しています。駅から近いところがいいです。';
    const region = process.env.REGION; // 特定の地域を指定する場合
    
    console.log('CSVパス:', csvPath);
    console.log('テストメッセージ:', testMessage);
    if (region) console.log('指定地域:', region);
    
    const result = await executeRealEstateWorkflow(csvPath, testMessage, region);
    
    if (result.success) {
      console.log('ワークフロー実行結果:');
      console.log(JSON.stringify(result.results, null, 2));
      console.log('\n物件提案:');
      console.log(result.recommendation);
      console.log('\n利用可能な地域:', result.regions?.join(', ') || 'なし');
    } else {
      console.error('エラー:', result.error);
    }
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
  }
}

// テスト実行（コメントアウトを解除して実行）
// main();
