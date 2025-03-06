# システムプロンプト付きエージェント

システムプロンプトを使用してエージェントを作成する簡単な例です。

## 前提条件

- Node.js v20.0+
- pnpm（推奨）または npm
- OpenAI APIキー

## 始め方

1. リポジトリをクローンしてプロジェクトディレクトリに移動します：

   ```bash
   git clone https://github.com/WdknWdkn/mastra.example.git
   cd mastra.example/system-prompt
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

   ```
   pnpm install
   ```

4. サンプルを実行します：

   ```bash
   pnpm start
   ```
