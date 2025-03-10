import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { generateAgentResponse as realEstateAgentResponse, executeRealEstateWorkflow } from '../../../../src/real-estate-agent/index';

// 物件エージェントのインポート
// モック実装のためのインターフェース
interface AgentResponse {
  success: boolean;
  response: string;
  error?: string;
}

// モックエージェント応答生成関数（実際のエージェントが利用できない場合のフォールバック）
async function generateMockResponse(message: string): Promise<AgentResponse> {
  // モック応答
  return {
    success: true,
    response: `ご希望の条件をお聞かせください。${message}に関連する物件を探してみます。予算、エリア、間取りなどの条件をより詳しくお伝えいただければ、最適な物件をご提案いたします。`
  };
}

// CSVパーサーを直接実装
// 簡易的なCSVパーサー
function parseCSV(content: string, options: { limit?: number } = {}): any[][] {
  const lines = content.split('\n');
  const limit = options.limit || lines.length;
  
  return lines.slice(0, limit).map(line => {
    // カンマで分割するが、引用符内のカンマは無視
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // 最後の値を追加
    values.push(currentValue);
    
    return values;
  });
}

// CSVファイルのパス
const CSV_PATH = path.join(process.cwd(), '..', 'attachments', '6d3de071-7518-4fae-83f8-ead6ee9b3e7a', '1.csv');

// 物件データのキャッシュ
let propertiesCache: any[] = [];

// CSVファイルを読み込む関数
async function loadPropertiesFromCSV(limit = 100): Promise<any[]> {
  try {
    // CSVファイルの存在確認
    if (!fs.existsSync(CSV_PATH)) {
      console.error('CSVファイルが見つかりません:', CSV_PATH);
      return [];
    }

    // CSVファイルを読み込む
    const fileContent = fs.readFileSync(CSV_PATH, 'utf8');
    
    // CSVをパース
    const records = parseCSV(fileContent, { limit: limit + 1 });

    // 最初の行をヘッダーとして使用
    const headers = [
      '物件ID', '更新日', '公開日', '物件種別', '賃貸区分', '取引態様', '物件番号', '管理番号',
      '物件画像URL', '物件名称', '物件名称カナ', '価格タイプ', '賃料・価格', '管理費', '号室',
      '郵便番号', '都道府県コード', '所在地名称', '所在地名称2', '所在地名称3', '緯度経度', '最寄駅コード',
      '最寄駅距離', '駅1', '駅2', '駅3', '間取り', '間取り備考', '建物面積・専有面積', '土地面積',
      '築年月', '物件の特徴'
    ];

    // レコードを整形
    const properties = records.slice(1, limit + 1).map((record: any[]) => {
      const property: Record<string, any> = {};
      headers.forEach((header, index) => {
        if (index < record.length) {
          property[header] = record[index];
        }
      });
      return property;
    });

    return properties;
  } catch (error) {
    console.error('CSVファイル読み込み中にエラーが発生しました:', error);
    return [];
  }
}

// 物件を検索する関数
function searchProperties(properties: any[], criteria: Record<string, any>, limit = 5): any[] {
  try {
    // 検索条件がない場合は空配列を返す
    if (!criteria || Object.keys(criteria).length === 0) {
      return properties.slice(0, limit);
    }

    // 検索条件に基づいてフィルタリング
    const filteredProperties = properties.filter(property => {
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

    return filteredProperties.slice(0, limit);
  } catch (error) {
    console.error('物件検索中にエラーが発生しました:', error);
    return [];
  }
}

// APIルート
export async function POST(req: NextRequest) {
  try {
    const { message, isInitialLoad } = await req.json();

    // 初回ロード時は物件データを読み込む
    if (isInitialLoad) {
      try {
        // キャッシュが空の場合はCSVから読み込む
        if (propertiesCache.length === 0) {
          propertiesCache = await loadPropertiesFromCSV(100);
        }

        return NextResponse.json({
          success: true,
          message: `物件データを読み込みました（${propertiesCache.length}件）`,
          properties: propertiesCache.slice(0, 5), // サンプルとして最初の5件を返す
        });
      } catch (error) {
        console.error('物件データ読み込み中にエラーが発生しました:', error);
        return NextResponse.json(
          { error: '物件データの読み込みに失敗しました' },
          { status: 500 }
        );
      }
    }

    // メッセージが提供されていない場合
    if (!message) {
      return NextResponse.json(
        { error: 'メッセージが提供されていません' },
        { status: 400 }
      );
    }

    // キャッシュが空の場合はCSVから読み込む
    if (propertiesCache.length === 0) {
      propertiesCache = await loadPropertiesFromCSV(100);
    }

    // エージェントに応答を生成させる
    // 実際のエージェント実装を使用
    let agentResponse;
    try {
      const result = await realEstateAgentResponse(message);
      agentResponse = result.response;
    } catch (error) {
      console.error('エージェント応答生成中にエラーが発生しました:', error);
      // モック応答を生成
      const mockResult = await generateMockResponse(message);
      agentResponse = mockResult.response;
    }

    // 簡易的な条件抽出（実際のプロダクションでは、より高度なNLPを使用）
    const extractedCriteria: Record<string, any> = {};
    
    // 予算の抽出
    const budgetMatch = message.match(/(\d+)万円/);
    if (budgetMatch) {
      const budget = parseInt(budgetMatch[1]) * 10000;
      extractedCriteria['賃料・価格'] = { max: budget };
    }
    
    // エリアの抽出
    const areaMatches = message.match(/(東京|横浜|大阪|名古屋|福岡|札幌|京都|神戸|さいたま|千葉|広島|仙台|川崎|北九州|堺)/g);
    if (areaMatches && areaMatches.length > 0) {
      extractedCriteria['所在地名称'] = areaMatches[0];
    }
    
    // 間取りの抽出
    const layoutMatch = message.match(/(1LDK|2LDK|3LDK|4LDK|1K|1DK|2K|2DK|3K|3DK|4K|4DK)/i);
    if (layoutMatch) {
      extractedCriteria['間取り備考'] = layoutMatch[0];
    }

    // 検索条件に基づいて物件を検索
    const properties = searchProperties(propertiesCache, extractedCriteria, 5);

    return NextResponse.json({
      success: true,
      response: agentResponse,
      properties: properties,
      preferences: extractedCriteria,
    });
  } catch (error) {
    console.error('リクエスト処理中にエラーが発生しました:', error);
    return NextResponse.json(
      { error: 'リクエストの処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
