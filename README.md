# Weather Data Dashboard

## 概要

Weathernews の船橋市ページから、気温・風速・降水量を1時間ごとに自動取得し、Supabase のデータベースに保存。保存したデータを Next.js の画面上で表として閲覧できる Web アプリです。

## デモ URL

https://weather-app-chi-pied-98.vercel.app/

## 主な機能

- Weathernews の船橋市ページから気温・風速・降水量をスクレイピングで取得
- 取得したデータを Supabase に保存
- `datetime` と `area` の組み合わせで重複保存を防止（upsert）
- 保存されたデータを表形式で一覧表示
- GitHub Actions を使って1時間ごとにデータ取得を自動実行
- Vercel でデプロイ・公開

## 使用技術

| 技術 | 用途 |
|------|------|
| Next.js (App Router) | フロントエンド・API Routes |
| TypeScript | 型安全な開発 |
| Tailwind CSS | スタイリング |
| Supabase | データベース（PostgreSQL） |
| Cheerio | HTML スクレイピング |
| Vercel | ホスティング・デプロイ |
| GitHub Actions | 定期実行（Cron） |

## システム構成

```
GitHub Actions（1時間ごと）
        ↓
  GET /api/collect
        ↓
  Weathernews をスクレイピング
        ↓
  Supabase に upsert 保存
        ↓
  ブラウザ → Next.js ページでデータ表示
```

## DB 設計

テーブル名：`weather_records`

| カラム名 | 型 | 説明 |
|----------|----|------|
| id | uuid | 主キー（自動生成） |
| datetime | timestamptz | 観測日時（1時間単位） |
| area | text | 地域名（例：千葉県船橋市） |
| temperature | float | 気温（℃） |
| wind_speed | float | 風速（m/s） |
| precipitation | float | 降水量（mm/h） |
| created_at | timestamptz | レコード作成日時 |

**重複防止：** `unique(datetime, area)` を設定し、同じ日時・地域のデータは上書き（upsert）されます。

## 自動実行の仕組み

Vercel の Hobby プランでは1時間ごとの Cron 実行に制限があるため、GitHub Actions の `schedule` 機能を代替として使用しています。

```yaml
on:
  schedule:
    - cron: "0 * * * *"  # 毎時0分に実行
```

毎時0分に GitHub Actions が起動し、Vercel 上の `/api/collect` を `curl` で呼び出します。

## ローカルでの起動方法

```bash
# 1. リポジトリをクローン
git clone https://github.com/fu17720takeru-lgtm/weather-app
cd weather-app

# 2. 依存パッケージをインストール
npm install

# 3. 環境変数を設定（下記参照）

# 4. 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:3000 を開くと画面が表示されます。

## 環境変数

プロジェクト直下に `.env.local` を作成し、以下を設定してください。

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Supabase の値はプロジェクトの「Settings → API」から取得できます。

## 工夫した点

- **重複防止の設計：** 同じ日時・地域のデータを何度 API が呼ばれても重複しないよう、DB に unique 制約を設け upsert で対応しました。
- **Cron の代替手段：** Vercel 無料プランの制限を回避するため、GitHub Actions の schedule を活用しました。コスト0でサーバーサイドの定期実行を実現しています。
- **スクレイピングの安定化：** Weathernews のページ構造に合わせた正規表現でデータを抽出し、取得失敗時は明確なエラーメッセージを返すようにしました。

## 今後の改善点

- 複数地域への対応
- グラフでのデータ可視化
- データ取得失敗時のリトライ処理
- 取得エラーの通知機能（Slack など）
