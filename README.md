# Mastra Examples

このリポジトリには、Mastraフレームワークを使用した様々な例が含まれています。

## プロジェクト構成

このプロジェクトは以下のディレクトリで構成されています：

- `create-workflow-example`: 基本的なワークフロー作成の例
- `sequential-workflow-example`: シーケンシャルステップを持つワークフローの例
- `parallel-workflow-example`: 並列ステップを持つワークフローの例
- `branching-workflow-example`: 条件分岐パスを持つワークフローの例
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

3. `.env`ファイルを編集して、必要なAPIキーを追加します：

```
OPENAI_API_KEY=your_openai_api_key
```

## 実行方法

### フロントエンドの起動

```bash
pnpm dev:frontend
```

### 各ワークフロー例の実行

```bash
# 基本的なワークフロー作成の例
pnpm start:create-workflow

# シーケンシャルステップを持つワークフローの例
pnpm start:sequential-workflow

# 並列ステップを持つワークフローの例
pnpm start:parallel-workflow

# 条件分岐パスを持つワークフローの例
pnpm start:branching-workflow
```

## 例の説明

各ディレクトリには、それぞれのワークフロータイプを示す例が含まれています。詳細については、各ディレクトリ内のREADME.mdファイルを参照してください。
