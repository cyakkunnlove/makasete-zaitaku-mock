# Phase 5 Task: ミーティングフィードバック反映

## デザイン指針
- ダークテーマ: bg-[#0a0e1a], bg-gray-900/800/700
- アクセントカラー: indigo-500/600 (#6366f1)
- 注意事項: amber-500/yellow系の警告カラー
- ステータス完了: emerald-500
- モバイルファースト、レスポンシブ
- shadcn/ui + Tailwind CSS, Next.js 14 App Router

## 変更内容

### 1. types/database.ts 更新
- Patient型にinsurance_info?: string, disease_name?: string追加
- Handover型にreport_file_url?: string追加
- 新しい型 TimelineEvent: { status: string, timestamp: string, user_name: string, note?: string }
- Request型にtimeline_events?: TimelineEvent[]追加

### 2. mock-data.ts 更新
- 患者データのvisit_notesに具体的内容を追加（例: 「オートロック暗証番号: 1234※要厳守、室内に猫2匹あり（玄関開閉注意）、配薬場所: 玄関横の白い薬箱」等）
- 患者にinsurance_info, disease_name追加
- 申し送りデータにreport_file_url追加（モックURL: "/mock/report-001.pdf"等）
- 依頼データにtimeline_events配列追加（受電→FAX受領→アサイン→出発→到着→完了のモックタイムスタンプ）

### 3. 患者詳細画面ブラッシュアップ (src/app/dashboard/patients/[id]/page.tsx)
- ページ上部にvisit_notes（訪問時注意事項）を黄色/amber系のAlertカードで強調表示
- 住所の横に「地図を開く」ボタン（MapPinアイコン、Google Maps外部リンク: https://www.google.com/maps/search/?api=1&query=住所をencodeURIComponent）
- current_medicationsを下部に移動し「（任意）」ラベル付き
- 表示順: 注意事項カード→基本情報(名前/住所/電話)→緊急連絡先→医療情報→現在薬

### 4. 申し送り関連の改善
- handovers/new/page.tsx: Tabsで「手動入力」「報告書添付」を切替
  - 手動入力タブ: 既存SBAR入力をそのまま
  - 報告書添付タブ: ファイルアップロード風UI（破線ボーダーのドロップゾーン、Upload Cloudアイコン、「メディックス等で作成した報告書PDFを添付」テキスト）
- handovers/[id]/page.tsx: report_file_urlがある場合に添付報告書セクション表示（FileTextアイコン、「報告書を表示」ボタン）

### 5. 依頼詳細画面のタイムライン (src/app/dashboard/requests/[id]/page.tsx)
- ページ上部にUber Eats風の縦型ステータスタイムライン追加
- ステップ: 受電→FAX受領→アサイン→受諾→出発→到着→対応中→完了
- 完了ステップ: emerald-500チェックアイコン + 時刻 + 担当者名
- 現在ステップ: indigo-500パルスアニメーション（animate-pulse）
- 未到達ステップ: gray-600ドット
- 各ステップ間は縦線で接続

### 6. ダッシュボード改善 (src/app/dashboard/page.tsx)
- 「現在対応中」セクションにリアルタイムステータスミニカード追加
  - 患者名、薬剤師名、現在ステータスアイコン、経過時間表示
- 「本日の訪問」サマリーカード（日中: X件、夜間: Y件）

## 完了後
git add -A && git commit -m "feat: Phase 5 - meeting feedback brushup (timeline, report attachment, visit notes priority)"
