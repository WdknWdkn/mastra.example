import fs from 'fs';
import { createTool } from '@mastra/core';
import { z } from 'zod';
import path from 'path';

// CSVパーサーツール
export const csvParserTool = createTool({
  id: 'csv-parser',
  description: '物件データのCSVファイルを読み込み、JSONに変換します',
  inputSchema: z.object({
    filePath: z.string().describe('CSVファイルのパス（ディレクトリの場合は全ファイルを読み込みます）'),
    region: z.string().optional().describe('特定の地域のCSVファイルを読み込む場合の地域名'),
    limit: z.number().optional().describe('読み込む行数の上限（オプション）'),
  }),
  outputSchema: z.object({
    properties: z.array(z.record(z.string(), z.any())).describe('物件データの配列'),
    count: z.number().describe('読み込んだ物件の数'),
    regions: z.array(z.string()).optional().describe('読み込んだ地域のリスト'),
  }),
  execute: async ({ context }) => {
    try {
      const filePath = context.filePath;
      const region = context.region;
      const limit = context.limit || Infinity;
      
      // ファイルパスの存在確認
      if (!fs.existsSync(filePath)) {
        throw new Error(`パスが見つかりません: ${filePath}`);
      }
      
      const stats = fs.statSync(filePath);
      let allProperties: Record<string, any>[] = [];
      let regions: string[] = [];
      
      // ディレクトリの場合は全ファイルを読み込む
      if (stats.isDirectory()) {
        const files = fs.readdirSync(filePath)
          .filter(file => file.endsWith('.csv'))
          .filter(file => !region || file.startsWith(region));
        
        for (const file of files) {
          const regionName = file.replace('.csv', '');
          regions.push(regionName);
          
          const fullPath = path.join(filePath, file);
          const fileProperties = parseCSVFile(fullPath, limit);
          
          // 地域情報を追加
          fileProperties.forEach(property => {
            property['地域'] = regionName;
          });
          
          allProperties = [...allProperties, ...fileProperties];
        }
      } else {
        // 単一ファイルの場合
        allProperties = parseCSVFile(filePath, limit);
        
        // ファイル名から地域を抽出
        const fileName = path.basename(filePath, '.csv');
        regions.push(fileName);
        
        // 地域情報を追加
        allProperties.forEach(property => {
          property['地域'] = fileName;
        });
      }
      
      return {
        properties: allProperties,
        count: allProperties.length,
        regions,
      };
    } catch (error) {
      console.error('CSVパース中にエラーが発生しました:', error);
      return {
        properties: [],
        count: 0,
        regions: [],
      };
    }
  },
});

// CSVファイルを解析する関数
function parseCSVFile(filePath: string, limit: number): Record<string, any>[] {
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
  
  return properties;
}

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
