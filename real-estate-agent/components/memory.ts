import { createTool } from '@mastra/core';
import { z } from 'zod';

// 会話履歴を保存するクラス
class ConversationMemory {
  private messages: { role: string; content: string }[] = [];
  private preferences: Record<string, any> = {};
  
  // メッセージを追加
  addMessage(role: string, content: string): void {
    this.messages.push({ role, content });
  }
  
  // 会話履歴を取得
  getMessages(): { role: string; content: string }[] {
    return this.messages;
  }
  
  // 会話履歴をクリア
  clearMessages(): void {
    this.messages = [];
  }
  
  // ユーザー設定を保存
  savePreference(key: string, value: any): void {
    this.preferences[key] = value;
  }
  
  // ユーザー設定を取得
  getPreference(key: string): any {
    return this.preferences[key];
  }
  
  // すべてのユーザー設定を取得
  getAllPreferences(): Record<string, any> {
    return { ...this.preferences };
  }
  
  // ユーザー設定をクリア
  clearPreferences(): void {
    this.preferences = {};
  }
}

// シングルトンインスタンス
export const conversationMemory = new ConversationMemory();

// 会話履歴保存ツール
export const saveMessageTool = createTool({
  id: 'save-message',
  description: '会話履歴にメッセージを保存します',
  inputSchema: z.object({
    role: z.string().describe('メッセージの役割（user/assistant）'),
    content: z.string().describe('メッセージの内容'),
  }),
  outputSchema: z.object({
    success: z.boolean().describe('保存が成功したかどうか'),
  }),
  execute: async ({ context }) => {
    try {
      conversationMemory.addMessage(context.role, context.content);
      return { success: true };
    } catch (error) {
      console.error('メッセージ保存中にエラーが発生しました:', error);
      return { success: false };
    }
  },
});

// ユーザー設定保存ツール
export const savePreferenceTool = createTool({
  id: 'save-preference',
  description: 'ユーザーの物件検索条件を保存します',
  inputSchema: z.object({
    key: z.string().describe('設定キー'),
    value: z.any().describe('設定値'),
  }),
  outputSchema: z.object({
    success: z.boolean().describe('保存が成功したかどうか'),
  }),
  execute: async ({ context }) => {
    try {
      conversationMemory.savePreference(context.key, context.value);
      return { success: true };
    } catch (error) {
      console.error('設定保存中にエラーが発生しました:', error);
      return { success: false };
    }
  },
});

// 検索条件抽出ツール
export const extractSearchCriteriaTool = createTool({
  id: 'extract-search-criteria',
  description: '会話履歴から物件検索条件を抽出します',
  inputSchema: z.object({}),
  outputSchema: z.object({
    criteria: z.record(z.any()).describe('抽出された検索条件'),
  }),
  execute: async () => {
    try {
      // 保存されたユーザー設定から検索条件を構築
      const preferences = conversationMemory.getAllPreferences();
      
      // 検索条件のマッピング
      const criteria: Record<string, any> = {};
      
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
      
      // 間取り
      if (preferences.layout) {
        criteria['間取り備考'] = preferences.layout;
      }
      
      // 駅からの距離
      if (preferences.maxStationDistance) {
        // 駅からの距離は分単位で保存されていることが多い
        criteria['駅1'] = {
          max: preferences.maxStationDistance,
        };
      }
      
      // 面積
      if (preferences.minArea || preferences.maxArea) {
        criteria['建物面積・専有面積'] = {
          min: preferences.minArea,
          max: preferences.maxArea,
        };
      }
      
      // 特徴
      if (preferences.features && Array.isArray(preferences.features)) {
        criteria['物件の特徴'] = preferences.features.join('|');
      }
      
      return { criteria };
    } catch (error) {
      console.error('検索条件抽出中にエラーが発生しました:', error);
      return { criteria: {} };
    }
  },
});
