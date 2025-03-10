import { createTool } from '@mastra/core';
import { z } from 'zod';

// 物件データを保存するクラス
class PropertyStore {
  private properties: any[] = [];
  private initialized: boolean = false;
  
  // 物件データを初期化
  initialize(properties: any[]): void {
    this.properties = properties;
    this.initialized = true;
  }
  
  // 物件データを検索
  search(criteria: Record<string, any>): any[] {
    if (!this.initialized) {
      return [];
    }
    
    return this.properties.filter(property => {
      return Object.entries(criteria).every(([key, value]) => {
        // 数値範囲の検索
        if (value && typeof value === 'object' && ('min' in value || 'max' in value)) {
          const propValue = parseFloat(property[key]);
          if (isNaN(propValue)) return false;
          
          if ('min' in value && propValue < value.min) return false;
          if ('max' in value && propValue > value.max) return false;
          return true;
        }
        
        // 文字列部分一致検索
        if (typeof value === 'string' && property[key]) {
          return property[key].includes(value);
        }
        
        // 完全一致検索
        return property[key] === value;
      });
    });
  }
  
  // 物件データを取得
  getAll(): any[] {
    return this.properties;
  }
  
  // 物件データの数を取得
  getCount(): number {
    return this.properties.length;
  }
  
  // 物件データが初期化されているか確認
  isInitialized(): boolean {
    return this.initialized;
  }
}

// シングルトンインスタンス
export const propertyStore = new PropertyStore();

// 物件ストア初期化ツール
export const initializeStoreTool = createTool({
  id: 'initialize-store',
  description: '物件データストアを初期化します',
  inputSchema: z.object({
    properties: z.array(z.record(z.string(), z.any())).describe('物件データの配列'),
  }),
  outputSchema: z.object({
    success: z.boolean().describe('初期化が成功したかどうか'),
    count: z.number().describe('保存された物件の数'),
  }),
  execute: async ({ context }) => {
    try {
      propertyStore.initialize(context.properties);
      return {
        success: true,
        count: propertyStore.getCount(),
      };
    } catch (error) {
      console.error('ストア初期化中にエラーが発生しました:', error);
      return {
        success: false,
        count: 0,
      };
    }
  },
});

// 物件検索ツール
export const searchPropertiesTool = createTool({
  id: 'search-properties',
  description: '条件に基づいて物件を検索します',
  inputSchema: z.object({
    criteria: z.record(z.any()).describe('検索条件'),
    limit: z.number().optional().describe('結果の上限数'),
  }),
  outputSchema: z.object({
    properties: z.array(z.record(z.string(), z.any())).describe('検索結果の物件データ'),
    count: z.number().describe('検索結果の数'),
    totalCount: z.number().describe('全物件数'),
  }),
  execute: async ({ context }) => {
    try {
      if (!propertyStore.isInitialized()) {
        return {
          properties: [],
          count: 0,
          totalCount: 0,
        };
      }
      
      const results = propertyStore.search(context.criteria);
      const limit = context.limit || results.length;
      
      return {
        properties: results.slice(0, limit),
        count: Math.min(results.length, limit),
        totalCount: propertyStore.getCount(),
      };
    } catch (error) {
      console.error('物件検索中にエラーが発生しました:', error);
      return {
        properties: [],
        count: 0,
        totalCount: propertyStore.getCount(),
      };
    }
  },
});
