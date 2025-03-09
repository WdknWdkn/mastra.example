import { createTool } from '@mastra/core';
import { z } from 'zod';
import { propertyStore } from '../tools/propertyStore';

// 物件の特徴を抽出する関数
function extractFeatures(property: any): string {
  const features: string[] = [];
  
  // 所在地
  if (property['所在地名称']) {
    features.push(`所在地: ${property['所在地名称']}`);
  }
  
  // 駅からの距離
  if (property['駅1']) {
    features.push(`最寄駅: ${property['駅1']}`);
  }
  
  // 間取り
  if (property['間取り備考']) {
    features.push(`間取り: ${property['間取り備考']}`);
  }
  
  // 面積
  if (property['建物面積・専有面積']) {
    features.push(`面積: ${property['建物面積・専有面積']}㎡`);
  }
  
  // 特徴
  if (property['物件の特徴']) {
    features.push(`特徴: ${property['物件の特徴']}`);
  }
  
  return features.join(', ');
}

// 物件の類似度を計算する関数
function calculateSimilarity(property: any, query: string): number {
  const features = extractFeatures(property).toLowerCase();
  const queryTerms = query.toLowerCase().split(/\s+/);
  
  // 各クエリ用語がフィーチャーに含まれているかをチェック
  let matchCount = 0;
  for (const term of queryTerms) {
    if (features.includes(term)) {
      matchCount++;
    }
  }
  
  return matchCount / queryTerms.length;
}

// 類似物件検索ツール
export const findSimilarPropertiesTool = createTool({
  id: 'find-similar-properties',
  description: 'テキスト検索で類似した物件を検索します',
  inputSchema: z.object({
    query: z.string().describe('検索クエリ'),
    limit: z.number().optional().describe('結果の上限数'),
  }),
  outputSchema: z.object({
    properties: z.array(z.record(z.string(), z.any())).describe('検索結果の物件データ'),
    count: z.number().describe('検索結果の数'),
  }),
  execute: async ({ context }) => {
    try {
      if (!propertyStore.isInitialized()) {
        return {
          properties: [],
          count: 0,
        };
      }
      
      const allProperties = propertyStore.getAll();
      const limit = context.limit || 5;
      
      // 各物件の類似度を計算
      const scoredProperties = allProperties.map(property => ({
        property,
        score: calculateSimilarity(property, context.query),
      }));
      
      // スコアでソート
      scoredProperties.sort((a, b) => b.score - a.score);
      
      // 上位の結果を返す
      const results = scoredProperties
        .slice(0, limit)
        .filter(item => item.score > 0)
        .map(item => item.property);
      
      return {
        properties: results,
        count: results.length,
      };
    } catch (error) {
      console.error('類似物件検索中にエラーが発生しました:', error);
      return {
        properties: [],
        count: 0,
      };
    }
  },
});

// 物件推薦ツール
export const recommendPropertiesTool = createTool({
  id: 'recommend-properties',
  description: 'ユーザーの好みに基づいて物件を推薦します',
  inputSchema: z.object({
    preferences: z.record(z.any()).describe('ユーザーの好み'),
    limit: z.number().optional().describe('結果の上限数'),
  }),
  outputSchema: z.object({
    properties: z.array(z.record(z.string(), z.any())).describe('推薦物件データ'),
    count: z.number().describe('推薦物件の数'),
  }),
  execute: async ({ context }) => {
    try {
      if (!propertyStore.isInitialized()) {
        return {
          properties: [],
          count: 0,
        };
      }
      
      // 検索条件を構築
      const criteria: Record<string, any> = {};
      const preferences = context.preferences;
      
      // 予算範囲
      if (preferences.minBudget || preferences.maxBudget) {
        criteria['賃料・価格'] = {
          min: preferences.minBudget,
          max: preferences.maxBudget,
        };
      }
      
      // エリア
      if (preferences.area) {
        criteria['所在地名称'] = preferences.area;
      }
      
      // 検索を実行
      const results = propertyStore.search(criteria);
      const limit = context.limit || 5;
      
      return {
        properties: results.slice(0, limit),
        count: Math.min(results.length, limit),
      };
    } catch (error) {
      console.error('物件推薦中にエラーが発生しました:', error);
      return {
        properties: [],
        count: 0,
      };
    }
  },
});
