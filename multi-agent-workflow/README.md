# マルチエージェントワークフロー

複数のエージェントを順番に呼び出してブログ記事のコンテンツを作成するシーケンシャルなエージェンティックワークフローです。

## 前提条件

- Node.js v20.0+
- pnpm（推奨）または npm
- OpenAI APIキー

## 始め方

1. リポジトリをクローンしてプロジェクトディレクトリに移動します：

   ```bash
   git clone https://github.com/WdknWdkn/mastra.example.git
   cd mastra.example/multi-agent-workflow
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

4. 例を実行します：

   ```bash
   pnpm start
   ```

## 仕組み

このサンプルでは、Mastraの`Workflow`クラスを使用して、複数のエージェントを順番に実行する方法を示しています。

1. コピーライターエージェントが最初に実行され、指定されたトピックに関するブログ記事を作成します。
2. エディターエージェントが次に実行され、コピーライターが作成した記事を編集します。
3. ワークフローは最終的な編集済み記事を結果として返します。

この例は、複雑なタスクを複数のステップに分割し、各ステップを専門のエージェントに処理させる方法を示しています。
