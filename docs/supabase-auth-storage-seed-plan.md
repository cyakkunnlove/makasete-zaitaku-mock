# Supabase Auth / Storage / Seed Plan v0.1

この文書は、Supabase プロジェクト作成後にすぐ着手するための実務メモです。

## 1. Auth 方針

### 1-1. 初期認証方式
- まずは Email / Password で開始
- 共有アカウントは禁止
- 全ロール個人アカウント前提

### 1-2. ロール別 MFA 方針
#### MFA 必須候補
- system_admin
- regional_admin
- pharmacy_admin
- night_pharmacist

#### MFA 推奨
- pharmacy_staff

### 1-3. Auth と public.users の関係
- auth.users を認証の元テーブルとする
- public.users に業務プロフィールを持つ
- id は auth.users.id をそのまま public.users.id に使う

### 1-4. 初期運用
- 招待 or 仮パスワード配布のどちらか
- 初回ログイン後にパスワード変更
- 後で magic link を検討してもよいが、最初は管理しやすさ優先

---

## 2. Storage 方針

### 2-1. 想定バケット
1. `fax-images`
2. `handover-reports`
3. `exports`（必要なら）

### 2-2. 保存対象
#### fax-images
- FAX原本
- 患者照合用FAX画像

#### handover-reports
- 申し送りPDF
- 報告書添付

#### exports
- CSV出力
- 将来の監査用出力物

### 2-3. 基本ルール
- 公開バケットは使わない
- signed URL 前提
- URLの長寿命化は避ける
- ダウンロード/表示は audit に残す前提

---

## 3. Seed 方針

### 3-1. 最小 seed セット
#### organization
- 1件

#### region
- 1件（例: 世田谷・城南リージョン）

#### operation_unit
- 1件（例: 田中夜間運用ユニット）

#### pharmacies
- 2〜3件
  - 城南みらい薬局
  - 港北さくら薬局
  - 中野しらさぎ薬局

#### users
- system_admin 1
- regional_admin 1
- night_pharmacist 2〜3
- pharmacy_admin 2〜3
- pharmacy_staff 数名

#### patients
- 各 pharmacy に数件ずつ

#### requests
- 進行中 / 完了 / 未特定 を混ぜる

#### handovers
- staff確認前
- staff確認済み
- admin最終確認済み
を混ぜる

### 3-2. Seed の目的
- UI確認
- ロール別確認
- 監査ログ確認
- handover責任線確認

---

## 4. ローカルモック → DB 切替方針

### 第1段階
- repository 層だけ Supabase に切替
- UI は極力そのまま

### 第2段階
- patients / requests / handovers を DB参照化
- localStorage patient master を段階的に外す

### 第3段階
- audit / notification / assignments / shifts を DBへ寄せる

---

## 5. DB開始後の実施順
1. Supabase project 作成
2. env 設定
3. migration 実行
4. storage bucket 作成
5. auth 設定
6. seed 実行
7. repository 切替
8. UI確認
9. ログ確認

---

## 6. 保留論点
- night_pharmacist が intake まで持つか
- regional_admin の患者閲覧粒度の最終化
- 実際の招待運用（メール招待 / 手動作成）
