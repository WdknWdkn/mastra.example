import { createTool } from '@mastra/core';
import { z } from 'zod';
import { conversationMemory } from './memory';

// 必須スロットの定義
export const requiredSlots = [
  { id: 'budget', name: '予算', prompt: '予算はいくらぐらいをお考えですか？' },
  { id: 'area', name: 'エリア', prompt: 'どのエリアをご希望ですか？' },
  { id: 'layout', name: '間取り', prompt: 'ご希望の間取りはありますか？' },
  { id: 'stationDistance', name: '駅からの距離', prompt: '駅からの距離はどのくらいが良いですか？' },
  { id: 'size', name: '広さ', prompt: 'お部屋の広さはどのくらいをご希望ですか？' },
  { id: 'features', name: '特徴', prompt: '特に重視する条件（ペット可、オートロックなど）はありますか？' },
];

// スロット状態確認ツール
export const checkSlotsTool = createTool({
  id: 'check-slots',
  description: 'ユーザーから収集した情報のスロット状態を確認します',
  inputSchema: z.object({
    threadId: z.string().optional().describe('会話スレッドID'),
  }),
  outputSchema: z.object({
    filledSlots: z.array(z.string()).describe('埋まっているスロットのID'),
    missingSlots: z.array(z.object({
      id: z.string().describe('スロットID'),
      name: z.string().describe('スロット名'),
      prompt: z.string().describe('質問プロンプト'),
    })).describe('未収集のスロット情報'),
    nextPrompt: z.string().optional().describe('次に尋ねるべき質問'),
  }),
  execute: async ({ context }) => {
    const threadId = context.threadId || conversationMemory.getCurrentThreadId();
    if (!threadId) {
      return {
        filledSlots: [],
        missingSlots: requiredSlots,
        nextPrompt: requiredSlots[0].prompt,
      };
    }
    
    // 現在の設定を取得
    const preferences = conversationMemory.getAllPreferences(threadId);
    
    // 埋まっているスロットと未収集のスロットを特定
    const filledSlots: string[] = [];
    const missingSlots: typeof requiredSlots = [];
    
    for (const slot of requiredSlots) {
      if (preferences[slot.id]) {
        filledSlots.push(slot.id);
      } else {
        missingSlots.push(slot);
      }
    }
    
    // 次に尋ねるべき質問
    const nextPrompt = missingSlots.length > 0 ? missingSlots[0].prompt : undefined;
    
    return {
      filledSlots,
      missingSlots,
      nextPrompt,
    };
  },
});

// スロット値抽出ツール
export const extractSlotValuesTool = createTool({
  id: 'extract-slot-values',
  description: 'ユーザーのメッセージからスロット値を抽出します',
  inputSchema: z.object({
    message: z.string().describe('ユーザーのメッセージ'),
    threadId: z.string().optional().describe('会話スレッドID'),
  }),
  outputSchema: z.object({
    extractedValues: z.record(z.any()).describe('抽出された値'),
    detectedSlots: z.array(z.string()).describe('検出されたスロットのID'),
  }),
  execute: async ({ context }) => {
    const message = context.message;
    const threadId = context.threadId || conversationMemory.getCurrentThreadId();
    
    if (!message) {
      return {
        extractedValues: {},
        detectedSlots: [],
      };
    }
    
    const extractedValues: Record<string, any> = {};
    const detectedSlots: string[] = [];
    
    // 予算の抽出
    const budgetMatch = message.match(/(\d+)万円/);
    if (budgetMatch) {
      const budget = parseInt(budgetMatch[1]) * 10000;
      extractedValues.budget = budget;
      detectedSlots.push('budget');
    }
    
    // エリアの抽出
    const areaMatches = message.match(/(東京|横浜|大阪|名古屋|福岡|札幌|京都|神戸|さいたま|千葉|広島|仙台|川崎|北九州|堺)/g);
    if (areaMatches && areaMatches.length > 0) {
      extractedValues.area = areaMatches[0];
      detectedSlots.push('area');
    }
    
    // 間取りの抽出
    const layoutMatch = message.match(/(1LDK|2LDK|3LDK|4LDK|1K|1DK|2K|2DK|3K|3DK|4K|4DK)/i);
    if (layoutMatch) {
      extractedValues.layout = layoutMatch[0];
      detectedSlots.push('layout');
    }
    
    // 駅からの距離の抽出
    const stationDistanceMatch = message.match(/駅.?から.?(\d+).?分/);
    if (stationDistanceMatch) {
      extractedValues.stationDistance = parseInt(stationDistanceMatch[1]);
      detectedSlots.push('stationDistance');
    }
    
    // 広さの抽出
    const sizeMatch = message.match(/(\d+)(?:畳|平米|㎡|m2)/);
    if (sizeMatch) {
      extractedValues.size = parseInt(sizeMatch[1]);
      detectedSlots.push('size');
    }
    
    // 特徴の抽出（複数可）
    const features: string[] = [];
    const featureKeywords = [
      'ペット可', 'オートロック', '宅配ボックス', '駐車場', 'バス・トイレ別',
      'エレベーター', '南向き', '角部屋', '2階以上', 'インターネット無料'
    ];
    
    for (const keyword of featureKeywords) {
      if (message.includes(keyword)) {
        features.push(keyword);
      }
    }
    
    if (features.length > 0) {
      extractedValues.features = features;
      detectedSlots.push('features');
    }
    
    // 抽出された値をメモリに保存
    if (threadId && Object.keys(extractedValues).length > 0) {
      for (const [key, value] of Object.entries(extractedValues)) {
        conversationMemory.savePreference(key, value, threadId);
      }
    }
    
    return {
      extractedValues,
      detectedSlots,
    };
  },
});

// スロット値提案ツール
export const suggestSlotValuesTool = createTool({
  id: 'suggest-slot-values',
  description: '未収集のスロットに対して提案値を生成します',
  inputSchema: z.object({
    threadId: z.string().optional().describe('会話スレッドID'),
  }),
  outputSchema: z.object({
    suggestions: z.record(z.any()).describe('スロットごとの提案値'),
  }),
  execute: async ({ context }) => {
    const threadId = context.threadId || conversationMemory.getCurrentThreadId();
    
    // 現在の設定を取得
    const preferences = threadId ? conversationMemory.getAllPreferences(threadId) : {};
    
    // 提案値を生成
    const suggestions: Record<string, any> = {};
    
    // 予算の提案
    if (!preferences.budget) {
      suggestions.budget = {
        options: ['5万円以内', '10万円以内', '15万円以内', '20万円以内'],
        prompt: '予算はどのくらいをお考えですか？',
      };
    }
    
    // エリアの提案
    if (!preferences.area) {
      suggestions.area = {
        options: ['東京', '大阪', '福岡', '横浜', '名古屋'],
        prompt: 'お探しのエリアはどちらですか？',
      };
    }
    
    // 間取りの提案
    if (!preferences.layout) {
      suggestions.layout = {
        options: ['1K', '1DK', '1LDK', '2LDK', '3LDK'],
        prompt: 'ご希望の間取りはありますか？',
      };
    }
    
    // 駅からの距離の提案
    if (!preferences.stationDistance) {
      suggestions.stationDistance = {
        options: ['徒歩5分以内', '徒歩10分以内', '徒歩15分以内', '徒歩20分以内'],
        prompt: '駅からの距離はどのくらいが良いですか？',
      };
    }
    
    return {
      suggestions,
    };
  },
});
