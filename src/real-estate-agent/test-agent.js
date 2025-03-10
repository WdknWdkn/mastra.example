// モックエージェント応答生成関数
async function generateAgentResponse(message) {
  console.log(`ユーザーメッセージ: ${message}`);
  
  // 簡易的な条件抽出
  const extractedCriteria = {};
  
  // 予算の抽出
  const budgetMatch = message.match(/(\d+)万円/);
  if (budgetMatch) {
    const budget = parseInt(budgetMatch[1]) * 10000;
    extractedCriteria['賃料・価格'] = { max: budget };
    console.log(`予算条件を抽出しました: ${budget}円以下`);
  }
  
  // エリアの抽出
  const areaMatches = message.match(/(東京|横浜|大阪|名古屋|福岡|札幌|京都|神戸|さいたま|千葉|広島|仙台|川崎|北九州|堺)/g);
  if (areaMatches && areaMatches.length > 0) {
    extractedCriteria['所在地名称'] = areaMatches[0];
    console.log(`エリア条件を抽出しました: ${areaMatches[0]}`);
  }
  
  // 間取りの抽出
  const layoutMatch = message.match(/(1LDK|2LDK|3LDK|4LDK|1K|1DK|2K|2DK|3K|3DK|4K|4DK)/i);
  if (layoutMatch) {
    extractedCriteria['間取り備考'] = layoutMatch[0];
    console.log(`間取り条件を抽出しました: ${layoutMatch[0]}`);
  }
  
  console.log('抽出された条件:', extractedCriteria);
  
  // モック応答を生成
  let response = '';
  if (Object.keys(extractedCriteria).length > 0) {
    response = 'ご希望の条件を承りました。';
    
    if (extractedCriteria['賃料・価格']) {
      response += ` 予算は${extractedCriteria['賃料・価格'].max / 10000}万円以下ですね。`;
    }
    
    if (extractedCriteria['所在地名称']) {
      response += ` ${extractedCriteria['所在地名称']}エリアをご希望ですね。`;
    }
    
    if (extractedCriteria['間取り備考']) {
      response += ` ${extractedCriteria['間取り備考']}の間取りをお探しですね。`;
    }
    
    response += ' これらの条件に合った物件をお探しします。';
  } else {
    response = 'ご希望の条件をお聞かせください。予算、エリア、間取りなどの条件をお伝えいただければ、最適な物件をご提案いたします。';
  }
  
  console.log(`エージェント応答: ${response}`);
  
  return {
    success: true,
    response: response,
    extractedCriteria: extractedCriteria
  };
}

// テスト関数
async function testAgentFunctionality() {
  console.log('===== 不動産エージェント機能テスト =====');
  
  // テストケース1: 条件なし
  console.log('\nテストケース1: 条件なし');
  await generateAgentResponse('こんにちは、物件を探しています。');
  
  // テストケース2: 予算のみ
  console.log('\nテストケース2: 予算のみ');
  await generateAgentResponse('予算は15万円以下で探しています。');
  
  // テストケース3: エリアのみ
  console.log('\nテストケース3: エリアのみ');
  await generateAgentResponse('東京で物件を探しています。');
  
  // テストケース4: 間取りのみ
  console.log('\nテストケース4: 間取りのみ');
  await generateAgentResponse('2LDKの物件を探しています。');
  
  // テストケース5: 複数条件
  console.log('\nテストケース5: 複数条件');
  await generateAgentResponse('横浜で予算20万円以下の1LDKを探しています。');
  
  console.log('\n===== テスト完了 =====');
}

// テスト実行
testAgentFunctionality();
