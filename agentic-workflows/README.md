# エージェンティックワークフロー

エージェンティックワークフローを作成する簡単な例です。このサンプルでは、天気予報データを取得し、それに基づいてアクティビティを提案するワークフローを作成します。

## 開発環境のセットアップ

### 前提条件

- Node.js v20.0+
- pnpm（推奨）または npm
- OpenAI APIキー

### インストール手順

1. リポジトリをクローンしてプロジェクトディレクトリに移動します：

   ```bash
   git clone https://github.com/WdknWdkn/mastra.example.git
   cd mastra.example/agentic-workflows
   ```

2. 依存関係をインストールします：

   ```bash
   pnpm install
   # または
   npm install
   ```

### OpenAI APIキーの設定

サンプルを実行するには、OpenAI APIキーが必要です：

1. 環境変数ファイルをコピーします：

   ```bash
   cp .env.example .env
   ```

2. `.env`ファイルを編集してOpenAI APIキーを追加します：

   ```env
   OPENAI_API_KEY=sk-your-api-key-here
   ```

## サンプルの実行

設定が完了したら、サンプルを実行できます：

```bash
pnpm start
# または
npm start
```

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

### ネットワークタイムアウトエラー

外部APIへのリクエスト中にタイムアウトエラーが発生する場合は、ネットワーク接続を確認してください。このサンプルでは、Open-Meteo APIを使用して天気データを取得します。
