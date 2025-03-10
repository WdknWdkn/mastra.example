import { NextRequest, NextResponse } from 'next/server';
import { createBirdCheckerAgent, runBirdChecker } from '../../../../src/bird-checker/index';

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();
    
    // If an image URL is provided, use it to analyze
    if (imageUrl) {
      // Implementation for custom image URL will be added later
      return NextResponse.json(
        { error: 'カスタム画像URLの分析は現在実装中です' },
        { status: 501 }
      );
    }
    
    // Otherwise, run the bird checker with a random image
    const result = await runBirdChecker();
    
    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in bird-checker API:', error);
    return NextResponse.json(
      { error: '鳥チェッカーAPIでエラーが発生しました' },
      { status: 500 }
    );
  }
}
