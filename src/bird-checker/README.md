# 鳥チェッカーエージェント

画像に鳥が含まれているかどうかを判断するシンプルなエージェントの例です。

## 前提条件

- Node.js v20.0+
- pnpm（推奨）または npm
- Anthropic APIキー または OpenAI APIキー
- Unsplash アクセストークン

## 始め方

1. リポジトリをクローンしてプロジェクトディレクトリに移動します：

   ```bash
   git clone https://github.com/WdknWdkn/mastra.example.git
   cd mastra.example/bird-checker
   ```

2. 環境変数ファイルをコピーしてAPIキーを追加します：

   ```bash
   cp .env.example .env
   ```

   次に`.env`を編集してAnthropicまたはOpenAI APIキーを追加します：

   ```env
   ANTHROPIC_API_KEY=sk-your-api-key-here
   ```

   または

   ```env
   OPENAI_API_KEY=sk-your-api-key-here
   ```

   最後にUnsplashアクセストークンを追加します：

   ```env
   UNSPLASH_ACCESS_KEY=your-unsplash-access-key-here
   ```

3. 依存関係をインストールします：

   ```
   pnpm install
   ```

4. 例を実行します：

   ```bash
   pnpm start
   ```

## 仕組み

このサンプルでは、Mastraの`Agent`クラスを使用して、画像を分析し、鳥が含まれているかどうかを判断するエージェントを作成します。

1. エージェントはUnsplashから鳥に関連するランダムな画像を取得します
2. 画像はAnthropicのClaude-3-Haikuモデル（またはOpenAIのGPT-4 Visionモデル）に送信されます
3. エージェントは画像に鳥が含まれているかどうかを判断し、鳥の種類と撮影場所を特定します
4. 応答はZodスキーマ検証を使用して構造化されます

## フロントエンドインターフェース

このエージェントのフロントエンドインターフェースは、`frontend-ui`ディレクトリにあります。フロントエンドを使用すると、ランダムな鳥の画像を取得して分析したり、独自の画像URLを提供して分析したりすることができます。

フロントエンドを実行するには：

```bash
cd ../frontend-ui
pnpm dev
```

その後、ブラウザで鳥チェッカーページにアクセスできます。
