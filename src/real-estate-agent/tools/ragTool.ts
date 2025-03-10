import { createTool } from '@mastra/core';
import { z } from 'zod';
import { propertyStore } from './propertyStore';

// 物件説明文からEmbeddingを生成するための簡易実装
// 実際の実装ではOpenAIのEmbedding APIなどを使用することを推奨
class SimpleEmbeddingGenerator {
  // 物件の説明文からキーワードを抽出
  extractKeywords(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }
  
  // 簡易的なEmbedding生成（実際の実装ではOpenAI APIなどを使用）
  generateEmbedding(text: string): number[] {
    const keywords = this.extractKeywords(text);
    // 簡易的なベクトル表現（実際の実装では高次元ベクトルを使用）
    const embedding = new Array(100).fill(0);
    
    keywords.forEach((word, index) => {
      const position = this.hashString(word) % 100;
      embedding[position] += 1;
    });
    
    return this.normalizeVector(embedding);
  }
  
  // 文字列のハッシュ値を計算
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
  
  // ベクトルの正規化
  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return vector;
    return vector.map(val => val / magnitude);
  }
  
  // コサイン類似度の計算
  calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('ベクトルの次元が一致しません');
    }
    
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }
    
    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);
    
    if (mag1 === 0 || mag2 === 0) return 0;
    
    return dotProduct / (mag1 * mag2);
  }
}

// シングルトンインスタンス
const embeddingGenerator = new SimpleEmbeddingGenerator();

// 物件説明文のインデックスを構築
class PropertyTextIndex {
  private propertyEmbeddings: Map<string, number[]> = new Map();
  private initialized: boolean = false;
  
  // インデックスを初期化
  initialize(properties: any[]): void {
    this.propertyEmbeddings.clear();
    
    properties.forEach(property => {
      const propertyId = property['物件ID'] || property['管理番号'];
      if (!propertyId) return;
      
      // 物件の説明文を結合
      const description = this.extractPropertyDescription(property);
      if (!description) return;
      
      // Embeddingを生成
      const embedding = embeddingGenerator.generateEmbedding(description);
      this.propertyEmbeddings.set(propertyId, embedding);
    });
    
    this.initialized = true;
    console.log(`物件テキストインデックスを構築しました: ${this.propertyEmbeddings.size}件`);
  }
  
  // 物件の説明文を抽出
  private extractPropertyDescription(property: any): string {
    const fields = [
      '物件名称',
      '所在地名称',
      '物件の特徴',
      '間取り備考',
      '駅1',
      '駅2',
      '駅3'
    ];
    
    return fields
      .map(field => property[field])
      .filter(Boolean)
      .join(' ');
  }
  
  // クエリに類似した物件を検索
  search(query: string, properties: any[], limit: number = 5): any[] {
    if (!this.initialized || this.propertyEmbeddings.size === 0) {
      return [];
    }
    
    // クエリのEmbeddingを生成
    const queryEmbedding = embeddingGenerator.generateEmbedding(query);
    
    // 各物件との類似度を計算
    const scoredProperties = properties.map(property => {
      const propertyId = property['物件ID'] || property['管理番号'];
      if (!propertyId || !this.propertyEmbeddings.has(propertyId)) {
        return { property, score: 0 };
      }
      
      const propertyEmbedding = this.propertyEmbeddings.get(propertyId)!;
      const similarity = embeddingGenerator.calculateCosineSimilarity(
        queryEmbedding,
        propertyEmbedding
      );
      
      return { property, score: similarity };
    });
    
    // スコアでソート
    scoredProperties.sort((a, b) => b.score - a.score);
    
    // 上位の結果を返す
    return scoredProperties
      .slice(0, limit)
      .filter(item => item.score > 0.1) // 閾値以上のみ
      .map(item => item.property);
  }
  
  // インデックスが初期化されているか確認
  isInitialized(): boolean {
    return this.initialized;
  }
}

// シングルトンインスタンス
export const propertyTextIndex = new PropertyTextIndex();

// RAGインデックス初期化ツール
export const initializeRAGIndexTool = createTool({
  id: 'initialize-rag-index',
  description: '物件説明文のRAGインデックスを初期化します',
  inputSchema: z.object({
    properties: z.array(z.record(z.string(), z.any())).describe('物件データの配列'),
  }),
  outputSchema: z.object({
    success: z.boolean().describe('初期化が成功したかどうか'),
    count: z.number().describe('インデックス化された物件の数'),
  }),
  execute: async ({ context }) => {
    try {
      propertyTextIndex.initialize(context.properties);
      return {
        success: true,
        count: context.properties.length,
      };
    } catch (error) {
      console.error('RAGインデックス初期化中にエラーが発生しました:', error);
      return {
        success: false,
        count: 0,
      };
    }
  },
});

// RAG検索ツール
export const ragSearchTool = createTool({
  id: 'rag-search',
  description: 'テキスト検索で物件を検索します（RAG）',
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
      if (!propertyStore.isInitialized() || !propertyTextIndex.isInitialized()) {
        return {
          properties: [],
          count: 0,
        };
      }
      
      const allProperties = propertyStore.getAll();
      const limit = context.limit || 5;
      
      // RAG検索を実行
      const results = propertyTextIndex.search(context.query, allProperties, limit);
      
      return {
        properties: results,
        count: results.length,
      };
    } catch (error) {
      console.error('RAG検索中にエラーが発生しました:', error);
      return {
        properties: [],
        count: 0,
      };
    }
  },
});

// ハイブリッド検索ツール（構造化検索 + RAG）
export const hybridSearchTool = createTool({
  id: 'hybrid-search',
  description: '構造化条件とテキスト検索を組み合わせて物件を検索します',
  inputSchema: z.object({
    criteria: z.record(z.any()).optional().describe('構造化検索条件'),
    query: z.string().describe('テキスト検索クエリ'),
    limit: z.number().optional().describe('結果の上限数'),
  }),
  outputSchema: z.object({
    properties: z.array(z.record(z.string(), z.any())).describe('検索結果の物件データ'),
    count: z.number().describe('検索結果の数'),
  }),
  execute: async ({ context }) => {
    try {
      if (!propertyStore.isInitialized() || !propertyTextIndex.isInitialized()) {
        return {
          properties: [],
          count: 0,
        };
      }
      
      // 構造化検索を実行（条件がある場合）
      let filteredProperties = propertyStore.getAll();
      if (context.criteria && Object.keys(context.criteria).length > 0) {
        filteredProperties = propertyStore.search(context.criteria);
      }
      
      const limit = context.limit || 5;
      
      // 構造化検索結果に対してRAG検索を実行
      const results = propertyTextIndex.search(context.query, filteredProperties, limit);
      
      return {
        properties: results,
        count: results.length,
      };
    } catch (error) {
      console.error('ハイブリッド検索中にエラーが発生しました:', error);
      return {
        properties: [],
        count: 0,
      };
    }
  },
});
