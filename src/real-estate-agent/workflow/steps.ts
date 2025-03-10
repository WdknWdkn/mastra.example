import { Step } from '@mastra/core';
import { z } from 'zod';
import { conversationMemory } from '../components/memory';
import { propertyStore } from '../tools/propertyStore';

// ステップ1: 物件データの読み込み
export const loadDataStep = new Step({
  id: 'load-data',
  description: 'CSVファイルから物件データを読み込みます',
  inputSchema: z.object({
    filePath: z.string().describe('CSVファイルのパスまたはディレクトリパス'),
    region: z.string().optional().describe('特定の地域のCSVファイルを読み込む場合の地域名'),
  }),
  outputSchema: z.object({
    success: z.boolean().describe('読み込みが成功したかどうか'),
    count: z.number().describe('読み込んだ物件の数'),
    regions: z.array(z.string()).optional().describe('読み込んだ地域のリスト'),
  }),
  execute: async ({ context }) => {
    const triggerResult = context?.getStepResult<{ filePath: string; region?: string }>('trigger');
    const filePath = triggerResult?.filePath;
    const region = triggerResult?.region;
    
    if (!filePath) {
      throw new Error('ファイルパスが提供されていません');
    }
    
    // 注意: 実際のツール実行はワークフローコンテキストを通じて行われます
    // ここではステップの入出力スキーマのみを定義します
    
    return {
      success: true,
      count: 0, // 実際の値はワークフロー実行時に設定されます
      regions: [], // 実際の値はワークフロー実行時に設定されます
    };
  },
});

// ステップ2: ユーザーとの会話
export const conversationStep = new Step({
  id: 'conversation',
  description: 'ユーザーと会話して物件の希望条件を聞き出します',
  inputSchema: z.object({
    message: z.string().describe('ユーザーのメッセージ'),
  }),
  outputSchema: z.object({
    response: z.string().describe('エージェントの応答'),
    preferences: z.record(z.any()).describe('抽出された希望条件'),
  }),
  execute: async ({ context }) => {
    const message = context?.getStepResult<{ message: string }>('trigger')?.message;
    
    if (!message) {
      throw new Error('メッセージが提供されていません');
    }
    
    // 注意: 実際のツール実行はワークフローコンテキストを通じて行われます
    
    return {
      response: '応答はワークフロー実行時に生成されます',
      preferences: {}, // 実際の値はワークフロー実行時に設定されます
    };
  },
});

// ステップ3: 物件検索
export const searchStep = new Step({
  id: 'search',
  description: '希望条件に基づいて物件を検索します',
  inputSchema: z.object({
    criteria: z.record(z.any()).describe('検索条件'),
    query: z.string().optional().describe('テキスト検索クエリ'),
  }),
  outputSchema: z.object({
    properties: z.array(z.record(z.string(), z.any())).describe('検索結果の物件データ'),
    count: z.number().describe('検索結果の数'),
  }),
  execute: async ({ context }) => {
    const conversationResult = context?.getStepResult<{ preferences: Record<string, any> }>('conversation');
    const criteria = conversationResult?.preferences || {};
    const userMessage = context?.getStepResult<{ message: string }>('trigger')?.message || '';
    
    if (Object.keys(criteria).length === 0 && !userMessage) {
      return {
        properties: [],
        count: 0,
      };
    }
    
    // 注意: 実際の検索はワークフロー実行時に行われます
    
    return {
      properties: [],
      count: 0, // 実際の値はワークフロー実行時に設定されます
    };
  },
});

// ステップ4: 物件提案
export const recommendStep = new Step({
  id: 'recommend',
  description: '検索結果に基づいて物件を提案します',
  inputSchema: z.object({
    properties: z.array(z.record(z.string(), z.any())).describe('物件データ'),
  }),
  outputSchema: z.object({
    recommendation: z.string().describe('物件提案の文章'),
  }),
  execute: async ({ context }) => {
    const searchResult = context?.getStepResult<{ properties: any[]; count: number }>('search');
    
    if (!searchResult || !searchResult.properties || searchResult.properties.length === 0) {
      return {
        recommendation: '条件に合う物件が見つかりませんでした。条件を変更して再度お試しください。',
      };
    }
    
    // 物件データを整形
    const propertiesText = searchResult.properties.map((property, index) => {
      return `物件${index + 1}:
所在地: ${property['所在地名称'] || '不明'}
賃料: ${property['賃料・価格'] || '不明'}
間取り: ${property['間取り備考'] || '不明'}
面積: ${property['建物面積・専有面積'] || '不明'}㎡
最寄駅: ${property['駅1'] || '不明'}
特徴: ${property['物件の特徴'] || '特になし'}
`;
    }).join('\n');
    
    // 注意: 実際の提案文生成はワークフロー実行時に行われます
    
    return {
      recommendation: '提案文はワークフロー実行時に生成されます',
    };
  },
});
