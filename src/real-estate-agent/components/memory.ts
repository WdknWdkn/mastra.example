import { createTool } from '@mastra/core';
import { z } from 'zod';

// 会話履歴を保存するクラス
class ConversationMemory {
  private threads: Record<string, {
    messages: { role: string; content: string }[];
    preferences: Record<string, any>;
  }> = {};
  private currentThreadId: string | null = null;
  
  // スレッドを設定
  setThread(threadId: string): void {
    if (!this.threads[threadId]) {
      this.threads[threadId] = {
        messages: [],
        preferences: {},
      };
    }
    this.currentThreadId = threadId;
  }
  
  // 現在のスレッドIDを取得
  getCurrentThreadId(): string | null {
    return this.currentThreadId;
  }
  
  // メッセージを追加
  addMessage(role: string, content: string, threadId?: string): void {
    const tid = threadId || this.currentThreadId;
    if (!tid) throw new Error('スレッドIDが設定されていません');
    
    if (!this.threads[tid]) this.setThread(tid);
    
    this.threads[tid].messages.push({ role, content });
  }
  
  // 会話履歴を取得
  getMessages(threadId?: string): { role: string; content: string }[] {
    const tid = threadId || this.currentThreadId;
    if (!tid) return [];
    
    if (!this.threads[tid]) return [];
    
    return [...this.threads[tid].messages];
  }
  
  // 会話履歴をクリア
  clearMessages(threadId?: string): void {
    const tid = threadId || this.currentThreadId;
    if (!tid) return;
    
    if (this.threads[tid]) {
      this.threads[tid].messages = [];
    }
  }
  
  // ユーザー設定を保存
  savePreference(key: string, value: any, threadId?: string): void {
    const tid = threadId || this.currentThreadId;
    if (!tid) throw new Error('スレッドIDが設定されていません');
    
    if (!this.threads[tid]) this.setThread(tid);
    
    this.threads[tid].preferences[key] = value;
  }
  
  // ユーザー設定を取得
  getPreference(key: string, threadId?: string): any {
    const tid = threadId || this.currentThreadId;
    if (!tid) return undefined;
    
    if (!this.threads[tid]) return undefined;
    
    return this.threads[tid].preferences[key];
  }
  
  // すべてのユーザー設定を取得
  getAllPreferences(threadId?: string): Record<string, any> {
    const tid = threadId || this.currentThreadId;
    if (!tid) return {};
    
    if (!this.threads[tid]) return {};
    
    return { ...this.threads[tid].preferences };
  }
  
  // ユーザー設定をクリア
  clearPreferences(threadId?: string): void {
    const tid = threadId || this.currentThreadId;
    if (!tid) return;
    
    if (this.threads[tid]) {
      this.threads[tid].preferences = {};
    }
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
    threadId: z.string().optional().describe('会話スレッドID'),
  }),
  outputSchema: z.object({
    success: z.boolean().describe('保存が成功したかどうか'),
  }),
  execute: async ({ context }) => {
    try {
      conversationMemory.addMessage(context.role, context.content, context.threadId);
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
    threadId: z.string().optional().describe('会話スレッドID'),
  }),
  outputSchema: z.object({
    success: z.boolean().describe('保存が成功したかどうか'),
  }),
  execute: async ({ context }) => {
    try {
      conversationMemory.savePreference(context.key, context.value, context.threadId);
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
  inputSchema: z.object({
    threadId: z.string().optional().describe('会話スレッドID'),
  }),
  outputSchema: z.object({
    criteria: z.record(z.any()).describe('抽出された検索条件'),
  }),
  execute: async ({ context }) => {
    try {
      // 保存されたユーザー設定から検索条件を構築
      const preferences = conversationMemory.getAllPreferences(context.threadId);
      
      // 検索条件のマッピング
      const criteria: Record<string, any> = {};
      
      // 予算範囲
      if (preferences.budget) {
        criteria['賃料・価格'] = {
          max: preferences.budget,
        };
      } else if (preferences.minBudget || preferences.maxBudget) {
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
      if (preferences.stationDistance) {
        // 駅からの距離は分単位で保存されていることが多い
        criteria['最寄駅距離'] = {
          max: preferences.stationDistance,
        };
      } else if (preferences.maxStationDistance) {
        criteria['最寄駅距離'] = {
          max: preferences.maxStationDistance,
        };
      }
      
      // 面積
      if (preferences.size) {
        criteria['建物面積・専有面積'] = {
          min: preferences.size,
        };
      } else if (preferences.minArea || preferences.maxArea) {
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
