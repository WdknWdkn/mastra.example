import { openai } from '@ai-sdk/openai';
import { Agent, Mastra, Step, Workflow } from '@mastra/core';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// 天気の状態を取得する関数
function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: '快晴',
    1: 'ほぼ晴れ',
    2: '部分的に曇り',
    3: '曇り',
    45: '霧',
    48: '霧氷',
    51: '軽い霧雨',
    53: '中程度の霧雨',
    55: '強い霧雨',
    61: '小雨',
    63: '中雨',
    65: '大雨',
    71: '小雪',
    73: '中雪',
    75: '大雪',
    95: '雷雨',
  };
  return conditions[code] || '不明';
}

// 天気エージェントの作成
const agent = new Agent({
  name: 'Weather Agent',
  instructions: `
    あなたは地元のアクティビティと旅行の専門家で、天気に基づいた計画を立てるのが得意です。天気データを分析し、実用的なアクティビティの推奨事項を提供してください。
    予報の各日について、次のように正確に回答を構成してください：
    📅 [曜日, 月 日, 年]
    ═══════════════════════════
    🌡️ 天気概要
    • 状態: [簡単な説明]
    • 気温: [X°C から A°C]
    • 降水確率: [X%]
    🌅 午前のアクティビティ
    屋外:
    • [アクティビティ名] - [特定の場所/ルートを含む簡単な説明]
      最適な時間帯: [特定の時間帯]
      注意: [関連する天気の考慮事項]
    🌞 午後のアクティビティ
    屋外:
    • [アクティビティ名] - [特定の場所/ルートを含む簡単な説明]
      最適な時間帯: [特定の時間帯]
      注意: [関連する天気の考慮事項]
    🏠 室内の代替案
    • [アクティビティ名] - [特定の会場を含む簡単な説明]
      最適な条件: [このアクティビティが適している天気条件]
    ⚠️ 特別な注意事項
    • [関連する天気の警告、UV指数、風の状態など]
    ガイドライン:
    - 1日あたり2〜3つの時間指定の屋外アクティビティを提案する
    - 1〜2つの室内バックアップオプションを含める
    - 降水確率が50%を超える場合は、室内アクティビティを優先する
    - すべてのアクティビティはその場所に固有のものであること
    - 特定の会場、トレイル、または場所を含める
    - 気温に基づいてアクティビティの強度を考慮する
    - 説明は簡潔かつ有益であること
    一貫性のために、絵文字とセクションヘッダーを示すとおりに、この正確な書式を維持してください。
  `,
  model: openai('gpt-4o-mini'),
});

// 天気予報を取得するステップ
const fetchWeather = new Step({
  id: 'fetch-weather',
  description: '指定された都市の天気予報を取得します',
  inputSchema: z.object({
    city: z.string().describe('天気を取得する都市'),
  }),
  execute: async ({ context }) => {
    const triggerData = context?.getStepResult<{ city: string }>('trigger');

    if (!triggerData) {
      throw new Error('トリガーデータが見つかりません');
    }

    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(triggerData.city)}&count=1`;
    const geocodingResponse = await fetch(geocodingUrl);
    const geocodingData = await geocodingResponse.json();

    if (!geocodingData.results?.[0]) {
      throw new Error(`場所 '${triggerData.city}' が見つかりません`);
    }

    const { latitude, longitude, name } = geocodingData.results[0];

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_mean,weathercode&timezone=auto`;
    const response = await fetch(weatherUrl);
    const data = await response.json();

    const forecast = data.daily.time.map((date: string, index: number) => ({
      date,
      maxTemp: data.daily.temperature_2m_max[index],
      minTemp: data.daily.temperature_2m_min[index],
      precipitationChance: data.daily.precipitation_probability_mean[index],
      condition: getWeatherCondition(data.daily.weathercode[index]),
      location: name,
    }));

    return forecast;
  },
});

// 予報スキーマの定義
const forecastSchema = z.array(
  z.object({
    date: z.string(),
    maxTemp: z.number(),
    minTemp: z.number(),
    precipitationChance: z.number(),
    condition: z.string(),
    location: z.string(),
  }),
);

// アクティビティを計画するステップ
const planActivities = new Step({
  id: 'plan-activities',
  description: '天気条件に基づいてアクティビティを提案します',
  inputSchema: forecastSchema,
  execute: async ({ context }) => {
    const forecast = context?.getStepResult<z.infer<typeof forecastSchema>>('fetch-weather');

    if (!forecast) {
      throw new Error('予報データが見つかりません');
    }

    const prompt = `以下の${forecast[0].location}の天気予報に基づいて、適切なアクティビティを提案してください：
      ${JSON.stringify(forecast, null, 2)}
    `;

    const response = await agent.generate(prompt);

    return {
      activities: response.text,
      forecast: forecast,
    };
  },
});

// 天気ワークフローの作成
const weatherWorkflow = new Workflow({
  name: 'weather-workflow',
  triggerSchema: z.object({
    city: z.string().describe('天気を取得する都市'),
  }),
})
  .step(fetchWeather)
  .then(planActivities);

weatherWorkflow.commit();

// Mastraインスタンスの作成
const mastra = new Mastra({
  workflows: {
    weatherWorkflow,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { city } = await req.json();

    if (!city) {
      return NextResponse.json(
        { error: '都市名が必要です' },
        { status: 400 }
      );
    }

    // 天気予報を直接取得
    try {
      // 位置情報を取得
      const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
      
      // タイムアウト付きのfetch関数
      const fetchWithTimeout = async (url: string, options = {}, timeout = 10000) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        
        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal
          });
          clearTimeout(id);
          return response;
        } catch (error) {
          clearTimeout(id);
          throw error;
        }
      };
      
      console.log('位置情報APIにリクエスト送信中...');
      const geocodingResponse = await fetchWithTimeout(geocodingUrl);
      console.log('位置情報APIからレスポンス受信');
      const geocodingData = await geocodingResponse.json();

      if (!geocodingData.results?.[0]) {
        return NextResponse.json(
          { error: `場所 '${city}' が見つかりません` },
          { status: 404 }
        );
      }

      const { latitude, longitude, name } = geocodingData.results[0];

      // 天気予報を取得
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_mean,weathercode&timezone=auto`;
      
      console.log('天気予報APIにリクエスト送信中...');
      const weatherResponse = await fetchWithTimeout(weatherUrl, {}, 15000);
      console.log('天気予報APIからレスポンス受信');
      const data = await weatherResponse.json();

      // 予報データを整形
      const forecast = data.daily.time.map((date: string, index: number) => ({
        date,
        maxTemp: data.daily.temperature_2m_max[index],
        minTemp: data.daily.temperature_2m_min[index],
        precipitationChance: data.daily.precipitation_probability_mean[index],
        condition: getWeatherCondition(data.daily.weathercode[index]),
        location: name,
      }));

      // エージェントにアクティビティを提案させる
      const prompt = `以下の${name}の天気予報に基づいて、適切なアクティビティを提案してください：
        ${JSON.stringify(forecast, null, 2)}
      `;

      const agentResponse = await agent.generate(prompt);

      return NextResponse.json({
        activities: agentResponse.text,
        forecast: forecast,
      });
    } catch (innerError: any) {
      console.error('天気データの取得中にエラーが発生しました:', innerError);
      
      // モックデータを提供（APIが利用できない場合のフォールバック）
      if (innerError.name === 'AbortError' || innerError.cause?.code === 'ETIMEDOUT') {
        console.log('APIタイムアウト - モックデータを使用します');
        
        // 東京のモックデータ
        const mockForecast = [
          {
            date: new Date().toISOString().split('T')[0],
            maxTemp: 22,
            minTemp: 15,
            precipitationChance: 10,
            condition: '晴れ',
            location: city || '東京',
          },
          {
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            maxTemp: 23,
            minTemp: 16,
            precipitationChance: 20,
            condition: '晴れ時々曇り',
            location: city || '東京',
          },
          {
            date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
            maxTemp: 21,
            minTemp: 14,
            precipitationChance: 30,
            condition: '曇り',
            location: city || '東京',
          }
        ];
        
        // モックデータを使用してアクティビティを提案
        try {
          const mockPrompt = `以下の${city || '東京'}の天気予報に基づいて、適切なアクティビティを提案してください：
            ${JSON.stringify(mockForecast, null, 2)}
          `;
          
          const agentResponse = await agent.generate(mockPrompt);
          
          return NextResponse.json({
            activities: agentResponse.text,
            forecast: mockForecast,
            isMockData: true
          });
        } catch (agentError: any) {
          console.error('エージェントの実行中にエラーが発生しました:', agentError);
          return NextResponse.json(
            { 
              error: 'ネットワークエラーが発生し、代替データの生成にも失敗しました。インターネット接続を確認してください。',
              details: agentError.message
            },
            { status: 500 }
          );
        }
      }
      
      // その他のエラー
      return NextResponse.json(
        { 
          error: '天気データの取得中にエラーが発生しました', 
          details: innerError.message,
          code: innerError.cause?.code
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('リクエストの処理中にエラーが発生しました:', error);
    return NextResponse.json(
      { error: 'リクエストの処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
