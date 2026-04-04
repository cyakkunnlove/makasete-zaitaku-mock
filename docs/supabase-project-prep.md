# Supabase Project Prep v0.1

このメモは、Supabase プロジェクトを実際に作成する前に必要な準備をまとめたものです。

## 1. 今の前提
- ロール設計は system_admin / regional_admin / pharmacy_admin / pharmacy_staff / night_pharmacist
- 所属は pharmacy_id + region_id / operation_unit_id
- 申し送り確認は pharmacy_staff の確認 + pharmacy_admin の最終確認
- night_pharmacist の受付主体は一部未確定

## 2. プロジェクト作成前に固めておくこと
### 必須
1. Supabase プロジェクト名
2. リージョン
3. auth を email/password で始めるか
4. ストレージバケット方針
   - fax-images
   - handover-reports
5. 環境変数名
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY

### できれば先に決める
1. 本番 / 検証 環境を分けるか
2. 開発データ投入方法
3. auth.users と public.users の同期方法
4. MFA をどのロールで必須にするか

## 3. マイグレーション適用順
1. 001_create_tables.sql
2. 002_create_rls.sql
3. 003_create_triggers.sql
4. 004_create_indexes.sql

## 4. 初期 seed で入れたいもの
- 1 organization
- 1 region
- 1 operation_unit
- regional_admin 1
- night_pharmacist 2-3
- pharmacy 2-3
- pharmacy_admin / pharmacy_staff 数名
- patients / requests / handovers 少量

## 5. 返答待ちで保留の論点
1. night_pharmacist が受付主体まで持つか
2. regional_admin と night_pharmacist の最終境界
3. regional_admin が患者本文をどこまで見られるかの最終粒度

## 6. Supabase 作成直後にやること
1. migrations 実行
2. storage bucket 作成
3. auth 設定
4. seed 実行
5. .env.local 設定
6. local mock と Supabase 切替フラグ導入

## 7. 実装側で次に必要なこと
- src/lib/supabase/client.ts
- src/lib/supabase/server.ts
- users / patients / requests / handovers の repository 層
- localStorage モックから repository 呼び出しへ移行
