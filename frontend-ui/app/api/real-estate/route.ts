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

// CSVファイルのディレクトリパス
const CSV_DIR = path.join(process.cwd(), '..', 'attachments', '6d3de071-7518-4fae-83f8-ead6ee9b3e7a', 'properties');

// 物件データのキャッシュ（地域ごと）
interface PropertyCache {
  [region: string]: any[];
}
let propertiesCache: PropertyCache = {};
let allPropertiesCache: any[] = [];

// 利用可能な地域のリスト
const REGIONS = ['tokyo', 'osaka', 'fukuoka'];

// CSVファイルを読み込む関数
async function loadPropertiesFromCSV(limit = 100, region?: string): Promise<any[]> {
  try {
    // ディレクトリの存在確認
    if (!fs.existsSync(CSV_DIR)) {
      console.error('CSVディレクトリが見つかりません:', CSV_DIR);
      return [];
    }

    // 全地域のデータがキャッシュされていて、特定の地域が指定されていない場合
    if (Object.keys(propertiesCache).length > 0 && !region) {
      return allPropertiesCache.slice(0, limit);
    }

    // 特定の地域が指定されていて、キャッシュに存在する場合
    if (region && propertiesCache[region]) {
      return propertiesCache[region].slice(0, limit);
    }

    // 読み込む地域のリスト
    const regionsToLoad = region ? [region] : REGIONS;
    let allProperties: any[] = [];

    // 各地域のCSVファイルを読み込む
    for (const r of regionsToLoad) {
      const csvPath = path.join(CSV_DIR, `${r}.csv`);
      
      if (!fs.existsSync(csvPath)) {
        console.warn(`CSVファイルが見つかりません: ${csvPath}`);
        continue;
      }

      // CSVファイルを読み込む
      const fileContent = fs.readFileSync(csvPath, 'utf8');
      
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
        // 地域情報を追加
        property['地域'] = r;
        return property;
      });

      // 地域ごとのキャッシュを更新
      propertiesCache[r] = properties;
      
      // 全物件リストに追加
      allProperties = [...allProperties, ...properties];
    }

    // 全物件キャッシュを更新
    if (!region) {
      allPropertiesCache = allProperties;
    }

    return region ? propertiesCache[region].slice(0, limit) : allProperties.slice(0, limit);
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
    const { message, isInitialLoad, threadId } = await req.json();

    // 初回ロード時は物件データを読み込む
    if (isInitialLoad) {
      try {
        // キャッシュが空の場合はCSVから読み込む
        if (Object.keys(propertiesCache).length === 0) {
          await loadPropertiesFromCSV(100);
        }

        return NextResponse.json({
          success: true,
          message: `物件データを読み込みました（${allPropertiesCache.length}件）`,
          properties: allPropertiesCache.slice(0, 5), // サンプルとして最初の5件を返す
          regions: REGIONS, // 利用可能な地域のリストを返す
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
    if (Object.keys(propertiesCache).length === 0) {
      await loadPropertiesFromCSV(100);
    }

    // CSVディレクトリパス
    const csvPath = path.join(process.cwd(), '..', 'attachments', '6d3de071-7518-4fae-83f8-ead6ee9b3e7a', 'properties');
    
    // ワークフローを実行
    const result = await executeRealEstateWorkflow(csvPath, message, undefined, threadId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'ワークフロー実行中にエラーが発生しました' },
        { status: 500 }
      );
    }
    
    // 検索結果から物件データを取得
    const searchResult = result.results?.search as { properties?: any[] } | undefined;
    const workflowProperties = searchResult?.properties || [];

    // 地域の抽出
    const regionMatch = message.match(/(東京|大阪|福岡)/g);
    let regionProperties: any[] = [];
    
    // 特定の地域が指定されている場合、その地域の物件も返す
    if (regionMatch && regionMatch.length > 0) {
      const regionMap: Record<string, string> = {
        '東京': 'tokyo',
        '大阪': 'osaka',
        '福岡': 'fukuoka'
      };
      
      const region = regionMap[regionMatch[0]];
      if (region && propertiesCache[region]) {
        regionProperties = propertiesCache[region].slice(0, 5);
      }
    }

    return NextResponse.json({
      success: true,
      response: result.recommendation,
      properties: workflowProperties.length > 0 ? workflowProperties : allPropertiesCache.slice(0, 5),
      regionProperties: regionProperties.length > 0 ? regionProperties : undefined,
      regions: result.regions || REGIONS,
      threadId: result.threadId, // スレッドIDを返す
    });
  } catch (error) {
    console.error('リクエスト処理中にエラーが発生しました:', error);
    return NextResponse.json(
      { error: 'リクエストの処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
