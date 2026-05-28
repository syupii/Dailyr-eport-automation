# 日報自動化ツール

ブラウザのフォームに入力するだけで、Groq AI が職場の日報テンプレートを自動生成するローカルツールです。
過去の日報を学習して文体を合わせてくれます。

---

## 必要環境

- Node.js 18 以上
- [Groq](https://console.groq.com/) の APIキー（無料）

---

## セットアップ

```bash
# 1. 依存パッケージをインストール
npm install

# 2. .env ファイルを作成
copy .env.example .env
```

`.env` を開いて以下を設定します：

```env
GROQ_API_KEY=あなたのGroq APIキー
EMPLOYEE_NAME=あなたの氏名
USE_REAL_DATA=false
```

---

## 起動方法

### GUI（推奨）

```bash
npm run web
```

ブラウザで **http://localhost:8080** を開きます。

### CLI（CSV入力）

```bash
npm start
```

`input_data.csv` を編集してから `.env` の `USE_REAL_DATA=true` に変更して実行します。

---

## GUIの使い方

1. **基本情報** — 今日の目標・達成度・理解度を入力
2. **今日の予定** — 時間と予定名を入力（任意）
3. **作業メモ** — やったことを箇条書き（任意）
4. **AIへのヒント** — 印象に残ったこと・難しかったこと・明日の目標をキーワードで入力（AIが文章に膨らませます）
5. **参考資料** — 資料のPDF・テキストファイルを添付（任意）
6. **「日報を生成する」** をクリック → 生成された日報をコピーして提出

---

## `.env` 設定項目

| 変数名 | 説明 | 例 |
|---|---|---|
| `GROQ_API_KEY` | Groq の API キー | `gsk_xxx...` |
| `EMPLOYEE_NAME` | 日報に表示される氏名 | `山田太郎` |
| `USE_REAL_DATA` | CLI用: `true` で CSV 読込、`false` でモックデータ | `false` |

---

## ファイル構成

```
日報自動化/
├── src/
│   ├── index.ts        # CLI エントリポイント
│   ├── server.ts       # GUI サーバー（Express）
│   ├── core.ts         # 日報生成ロジック（CLI・GUI共通）
│   ├── promptBuilder.ts # LLM プロンプト構築
│   ├── llmClient.ts    # Groq API クライアント
│   ├── csvReader.ts    # input_data.csv パーサー
│   ├── historyStore.ts # 過去の日報の読み書き
│   ├── mockData.ts     # テスト用ダミーデータ
│   └── types.ts        # 型定義
├── public/
│   └── index.html      # GUI フォーム
├── input_data.csv      # CLI 用入力ファイル
├── history.json        # 過去の日報（自動生成）※gitignore対象
├── .env                # 秘密情報 ※gitignore対象
└── .env.example        # .env のテンプレート
```

---

## セキュリティ

- `.env`（APIキー）と `history.json`（日報履歴）は `.gitignore` に含まれており、Git にコミットされません
- APIキーはコードにハードコードしないでください
