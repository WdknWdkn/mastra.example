# 並列ステップワークフロー

このサンプルは、Mastraを使用して複数のステップを並列に実行するワークフローを実装しています。

## 概要

このワークフローは以下の2つのステップを並列に実行します：

1. **2乗ステップ**: 入力値を2乗します
2. **立方根ステップ**: 入力値の立方根を計算します

各ステップは独立して実行され、両方とも同じ入力値を使用します。これは、シーケンシャルワークフローとは異なり、各ステップが前のステップの結果に依存しない処理フローを示しています。

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

このワークフローは、Mastraの`Workflow`と`Step`クラスを使用して実装されています。並列ステップは、`.then()`メソッドを使わずに複数の`.step()`メソッドを呼び出すことで定義されます。

```typescript
const parallelWorkflow = new Workflow({
  name: 'parallel-workflow',
  triggerSchema: z.object({
    inputValue: z.number(),
  }),
});

parallelWorkflow.step(squareStep).step(cubeRootStep);
```

## フロントエンドとの統合

このワークフローは、Next.jsとReact、TailwindCSSを使用したフロントエンドアプリケーションと統合されています。フロントエンドは、ユーザーが数値を入力し、並列に実行された各ステップの結果を表示するためのインターフェースを提供します。
