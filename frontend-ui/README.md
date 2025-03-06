# 猫の専門家チャットフロントエンド

このプロジェクトは、Mastraを使用した猫の専門家エージェントとチャットできるフロントエンドUIを提供します。

## 前提条件

- Node.js v20.0+
- npm または yarn
- OpenAI APIキー

## 始め方

1. リポジトリをクローンしてプロジェクトディレクトリに移動します：

   ```bash
   git clone https://github.com/WdknWdkn/mastra.example.git
   cd mastra.example/frontend-ui
   ```

2. 環境変数ファイルをコピーしてOpenAI APIキーを追加します：

   ```bash
   cp .env.example .env
   ```

   次に`.env`を編集してOpenAI APIキーを追加します：

   ```env
   OPENAI_API_KEY=sk-your-api-key-here
   ```

3. 依存関係をインストールします：

   ```bash
   npm install
   # または
   yarn install
   ```

4. 開発サーバーを起動します：

   ```bash
   npm run dev
   # または
   yarn dev
   ```

5. ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを表示します。

## 機能

- 猫に関する質問をチャットインターフェースで送信
- 猫の専門家AIからの応答を受信（常に興味深い猫の事実を含む）
- レスポンシブデザインで様々なデバイスに対応
