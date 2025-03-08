# 3ステップブログ記事ジェネレーター

このサンプルは、Mastraを使用して3つのエージェントを連携させ、ブログ記事を生成するワークフローを実装しています。

## 概要

このワークフローは以下の3つのステップで構成されています：

1. **企画ステップ**: トピックに基づいて記事の構成を計画します
2. **執筆ステップ**: 計画された構成に基づいて記事を作成します
3. **編集ステップ**: 作成された記事を編集し、品質を向上させます

各ステップは専用のAIエージェントによって処理され、前のステップの出力を次のステップの入力として使用します。

## 使用方法

### 前提条件

- Node.js v20.0+
- pnpm（推奨）または npm
- OpenAI APIキー

### セットアップ

1. `.env.example`ファイルを`.env`にコピーします：

```bash
cp .env.example .env
```

2. `.env`ファイルを編集して、OpenAI APIキーを追加します：

```env
OPENAI_API_KEY=sk-your-api-key-here
```

3. 依存関係をインストールします：

```bash
pnpm install
```

### 実行

以下のコマンドでワークフローを実行できます：

```bash
pnpm start
```

## 実装の詳細

このワークフローは、Mastraの`Workflow`、`Step`、`Agent`クラスを使用して実装されています。各エージェントは特定のタスクに特化しており、ワークフローはこれらのエージェントを順番に実行して最終的な記事を生成します。

```typescript
const createWorkflow = new Workflow({
  name: 'create-workflow',
  triggerSchema: z.object({
    topic: z.string(),
  }),
});

createWorkflow.step(plannerStep).then(copywriterStep).then(editorStep).commit();
```

## フロントエンドとの統合

このワークフローは、Next.jsとReact、TailwindCSSを使用したフロントエンドアプリケーションと統合されています。フロントエンドは、ユーザーがトピックを入力し、生成されたブログ記事を表示するためのインターフェースを提供します。
