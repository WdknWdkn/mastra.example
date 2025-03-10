# Mastra Examples

Mastraフレームワークを使用した様々なワークフローの例を提供するリポジトリです。

## プロジェクト構造

このプロジェクトは以下のディレクトリで構成されています：

- `src/create-workflow-example`: 基本的なワークフロー作成の例
- `src/sequential-workflow-example`: シーケンシャルワークフローの例
- `src/parallel-workflow-example`: 並列ワークフローの例
- `src/branching-workflow-example`: 分岐パスワークフローの例
- `src/agentic-workflows`: エージェンティックワークフローの例
- `src/bird-checker`: 鳥チェッカーの例
- `src/hierarchical-multi-agent`: 階層的マルチエージェントの例
- `src/multi-agent-workflow`: マルチエージェントワークフローの例
- `src/real-estate-agent`: 不動産エージェントの例
- `src/system-prompt`: システムプロンプトの例
- `src/using-a-tool`: ツールを使用するエージェントの例
- `frontend-ui`: すべての例のフロントエンドインターフェース

## セットアップ

1. 依存関係をインストールします：

```bash
pnpm install
```

2. 環境変数を設定します：

```bash
cp .env.example .env
```

3. `.env` ファイルを編集して、OpenAI APIキーを追加します：

```
OPENAI_API_KEY=your_api_key_here
```

## 使用方法

### フロントエンドの実行

```bash
pnpm dev:frontend
```

フロントエンドは http://localhost:3000 で利用できます。

### バックエンドの例の実行

各ワークフロー例を実行するには：

```bash
# 基本的なワークフロー作成
pnpm start:create-workflow

# シーケンシャルワークフロー
pnpm start:sequential-workflow

# 並列ワークフロー
pnpm start:parallel-workflow

# 分岐パスワークフロー
pnpm start:branching-workflow

# その他の例を実行するには、srcディレクトリ内の対応するディレクトリに移動して実行します
# 例: cd src/system-prompt && pnpm install && pnpm start
```

## ライセンス

MIT
