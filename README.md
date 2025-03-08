# Mastra Examples

Mastraフレームワークを使用した様々なワークフローの例を提供するリポジトリです。

## プロジェクト構造

このプロジェクトは以下のディレクトリで構成されています：

- `create-workflow-example`: 基本的なワークフロー作成の例
- `sequential-workflow-example`: シーケンシャルワークフローの例
- `parallel-workflow-example`: 並列ワークフローの例
- `branching-workflow-example`: 分岐パスワークフローの例
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
```

## ライセンス

MIT
