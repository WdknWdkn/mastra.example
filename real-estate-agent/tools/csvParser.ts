import fs from 'fs';
import { createTool } from '@mastra/core';
import { z } from 'zod';
import path from 'path';

// CSVパーサーツール
export const csvParserTool = createTool({
  id: 'csv-parser',
  description: '物件データのCSVファイルを読み込み、JSONに変換します',
  inputSchema: z.object({
    filePath: z.string().describe('CSVファイルのパス'),
    limit: z.number().optional().describe('読み込む行数の上限（オプション）'),
  }),
  outputSchema: z.object({
    properties: z.array(z.record(z.string(), z.any())).describe('物件データの配列'),
    count: z.number().describe('読み込んだ物件の数'),
  }),
  execute: async ({ context }) => {
    try {
      const filePath = context.filePath;
      const limit = context.limit || Infinity;
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`ファイルが見つかりません: ${filePath}`);
      }
      
      // CSVファイルを読み込む
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n');
      
      // ヘッダー行を解析
      const headers = parseCSVLine(lines[0]);
      
      // データ行を解析（制限付き）
      const properties: Record<string, any>[] = [];
      for (let i = 1; i < Math.min(lines.length, limit + 1); i++) {
        if (lines[i].trim() === '') continue;
        
        const values = parseCSVLine(lines[i]);
        const property: Record<string, any> = {};
        
        headers.forEach((header, index) => {
          property[header] = values[index] || '';
        });
        
        properties.push(property);
      }
      
      return {
        properties,
        count: properties.length,
      };
    } catch (error) {
      console.error('CSVパース中にエラーが発生しました:', error);
      return {
        properties: [],
        count: 0,
      };
    }
  },
});

// CSVの行を解析する関数
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.replace(/^"|"$/g, ''));
  return result;
}
