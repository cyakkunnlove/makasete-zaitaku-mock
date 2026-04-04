# Pre-DB-Start TODO v0.1

田中社長の「DB稼働開始OK」前に進めておく項目。

## すでに完了
- ロール定義の整理
- 主要ロールごとのUI整理
- 監査ログ設計のドラフト
- Supabase schema draft
- migration draft
- RLS draft
- trigger / index draft
- repository scaffolding

## DB開始前にさらに進める項目
### A. 設計・文書
- [ ] Auth / Storage / Seed 設計の更新
- [ ] DB開始後の切替手順を文書化
- [ ] 未確定論点一覧の整理

### B. 実装準備
- [ ] repository を使う方向への依存整理
- [ ] local mock 依存箇所の棚卸し
- [ ] storage 対象ファイルの一覧化

### C. 運用準備
- [ ] 初期ユーザー作成方針
- [ ] seed データ粒度の確定
- [ ] MFA 対象ロールの仮確定

## GO が出たらすぐやる項目
- [ ] Supabase project 作成
- [ ] env 設定
- [ ] migrations 実行
- [ ] storage bucket 作成
- [ ] seed 実行
- [ ] repository 経由へ切替開始
