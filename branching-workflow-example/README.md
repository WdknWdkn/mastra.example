# 分岐パスワークフロー

このサンプルは、Mastraを使用して条件分岐を持つワークフローを実装する方法を示しています。

## 概要

このワークフローは以下のステップで構成されています：

1. **ステップ1**: 入力値を2倍にします
2. **ステップ2**: ステップ1の結果に1を加え、結果が偶数か奇数かを判定します
3. **条件分岐**:
   - **偶数パス**: ステップ2の結果が偶数の場合、値を2倍にします
   - **奇数パス**: ステップ2の結果が奇数の場合、値を3倍にします

このサンプルは、前のステップの結果に基づいて異なる処理パスを選択する方法を示しています。

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

このワークフローは、Mastraの`Workflow`と`Step`クラスを使用して実装されています。条件分岐は`.after()`メソッドを使用して定義されます：

```typescript
branchingWorkflow
  .step(stepOne)
  .then(stepTwo)
  .after(stepTwo, (context) => {
    const stepTwoResult = context.getStepResult('stepTwo');
    return stepTwoResult.isEven ? evenPathStep : oddPathStep;
  });
```

`.after()`メソッドは、前のステップの結果に基づいて次に実行するステップを動的に決定します。この例では、ステップ2の結果が偶数か奇数かによって異なるパスを選択します。

## フロントエンドとの統合

このワークフローは、Next.jsとReact、TailwindCSSを使用したフロントエンドアプリケーションと統合されています。フロントエンドは、ユーザーが数値を入力し、ワークフローの実行パスと結果を視覚的に確認するためのインターフェースを提供します。
