# Mastra Examples

このリポジトリには、Mastraを使用した様々な例が含まれています。

## 例の一覧

- [システムプロンプト付きエージェント](./system-prompt/README.md) - システムプロンプトを使用してエージェントを作成する簡単な例
- [エージェンティックワークフロー](./agentic-workflows/README.md) - エージェンティックワークフローを作成する簡単な例
- [猫の専門家チャットフロントエンド](./frontend-ui/README.md) - システムプロンプト付きエージェントを使用したフロントエンドUI

## 開発環境のセットアップ

### 前提条件

各例には独自の前提条件がありますが、一般的には以下が必要です：

- Node.js v20.0+
- pnpm（推奨）または npm
- OpenAI APIキー

### リポジトリのクローン

```bash
git clone https://github.com/WdknWdkn/mastra.example.git
cd mastra.example
```

### OpenAI APIキーの設定

各サンプルを実行するには、OpenAI APIキーが必要です。各ディレクトリ内の`.env.example`ファイルを`.env`にコピーし、APIキーを設定してください：

```bash
cp <サンプルディレクトリ>/.env.example <サンプルディレクトリ>/.env
```

次に`.env`ファイルを編集して、OpenAI APIキーを追加します：

```env
OPENAI_API_KEY=sk-your-api-key-here
```

### 始め方

各例のディレクトリに移動し、それぞれのREADME.mdファイルの詳細な指示に従ってください。

## トラブルシューティング

### OpenAI APIキーエラー

以下のようなエラーが表示される場合は、OpenAI APIキーが正しく設定されていません：

```
LoadAPIKeyError [AI_LoadAPIKeyError]: OpenAI API key is missing. Pass it using the 'apiKey' parameter or the OPENAI_API_KEY environment variable.
```

解決方法：
1. `.env.example`ファイルを`.env`にコピーしたことを確認
2. `.env`ファイルに有効なOpenAI APIキーが設定されていることを確認
3. アプリケーションを再起動
