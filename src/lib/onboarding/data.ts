import type {
  AssessmentQuestion,
  AxisKey,
  ChecklistItem,
  LearningItem,
  PhaseMeta,
  StoreProfile,
  SupportItem,
  TaskItem,
} from './types'

export const storeProfile: StoreProfile = {
  name: 'ココ薬局 八王子みなみ野店',
  owner: 'この薬局の導入担当',
  manager: '佐藤 管理薬剤師',
  area: '東京都八王子市',
  startGoal: '在宅の初回受入を、店舗内で迷わず回せる状態にする',
  nextMeeting: '3/25 16:00 オンライン伴走ミーティング',
  readinessLabel: '受入準備を進めている段階',
  firstActionTime: '5〜10分',
}

export const assessmentQuestions: AssessmentQuestion[] = [
  {
    id: 'vision',
    category: '導入方針',
    question: 'この薬局が在宅を始める目的と、まず受けたい患者像はそろっていますか？',
    help: '管理薬剤師・オーナー・現場メンバーで言い方がそろっているほど、判断がぶれません。',
    options: [
      { label: 'まだ曖昧', score: 1.6, detail: '誰向けに始めるかが人によって違い、優先順位が決まりにくい状態です。' },
      { label: '方向性は合意済み', score: 3.8, detail: '大枠は決まっているので、患者像と優先条件を言語化すると次へ進みやすくなります。' },
      { label: '店舗内で説明できる', score: 4.8, detail: '対象患者・狙い・優先順位までそろっていて、初回受入準備に入りやすい状態です。' },
    ],
  },
  {
    id: 'role',
    category: '役割分担',
    question: '責任者・主担当・相談先・不在時の代替担当は整理されていますか？',
    help: '「誰に聞けば止まらないか」が明確だと、初回対応の不安が下がります。',
    options: [
      { label: '責任者だけ決まっている', score: 2.4, detail: '主要メンバーに確認が集中しやすく、現場が止まりやすい状態です。' },
      { label: '通常時の担当は整理済み', score: 3.2, detail: '平常時は動けるので、不在時の代替導線を埋めると安定します。' },
      { label: '代替含めて整理済み', score: 4.5, detail: '誰が休みでも判断と相談が止まりにくい状態です。' },
    ],
  },
  {
    id: 'education',
    category: '学習導線',
    question: '今必要な動画・テンプレ・資料に、迷わずたどり着けますか？',
    help: '一覧に並べるより、いま使うものへ短くつながるほうが初期導入では実用的です。',
    options: [
      { label: '探し回ることが多い', score: 1.8, detail: '必要な資料はあるが、どれを見るべきか分かりにくい状態です。' },
      { label: '一部まとまっている', score: 2.7, detail: '重要教材は見つかるが、次に作る資料へのつながりが弱い状態です。' },
      { label: '視聴→作業までつながる', score: 4.1, detail: '教材から実務へ移りやすく、店舗内で自走しやすい状態です。' },
    ],
  },
  {
    id: 'operations',
    category: '受入準備',
    question: '受入条件表・初回受入フロー・会議前確認項目はそろっていますか？',
    help: '初回患者受入前に迷う判断点を見える化できているかを確認します。',
    options: [
      { label: 'まだ口頭中心', score: 2.1, detail: '判断基準が頭の中にあり、引き継ぎや共有が難しい状態です。' },
      { label: '作成中', score: 3.1, detail: 'あと一歩で運用に乗せられるので、資料を店舗版に落とし込む段階です。' },
      { label: '実務導線まで整っている', score: 4.3, detail: '複数人で再現できる形になっていて、初回受入に入りやすい状態です。' },
    ],
  },
  {
    id: 'night',
    category: '夜間接続準備',
    question: '夜間支援へ進むか判断するための前提整理は進んでいますか？',
    help: 'ここでは夜間運用本体ではなく、進むかどうかの判断材料だけを扱います。',
    options: [
      { label: 'まだ考えていない', score: 1.0, detail: '今は昼間の受入準備を優先し、夜間は後で確認する状態です。' },
      { label: '条件を確認中', score: 1.8, detail: '必要論点は見え始めており、判断の土台を整えている状態です。' },
      { label: '判断材料はそろっている', score: 2.8, detail: '昼間運用の整備状況とあわせて、接続可否を説明しやすい状態です。' },
    ],
  },
]

export const defaultAnswers: Record<AxisKey, number> = {
  vision: 1,
  role: 1,
  education: 0,
  operations: 1,
  night: 0,
}

export const tasks: TaskItem[] = [
  {
    id: 'task-acceptance',
    title: '受入条件表をこの薬局向けに埋める',
    owner: '佐藤 管理薬剤師',
    due: '3/24',
    status: '進行中',
    note: '施設系・個人宅・緊急時の3ケースで受入条件を分けて整理します。',
    review: '伴走コメント: 曖昧語を減らし、「誰が判断するか」を各欄に入れると使いやすくなります。',
    deliverable: '受入条件表 v1',
    relatedContentId: 'learning-template',
    nextAction: 'まず3ケースの受入可否と相談先を入力する。',
    successMetric: '責任者以外が見ても、受入判断と相談先が止まらない状態',
  },
  {
    id: 'task-flow',
    title: '初回患者受入フローを1枚にする',
    owner: '高橋 事務',
    due: '3/26',
    status: '未着手',
    note: '問い合わせから初回訪問後の共有まで、1枚で追えるように整理します。',
    review: '添削予定: 医師連携と家族説明の受け渡しポイントを追記すると現場で使いやすくなります。',
    deliverable: '初回受入フロー図',
    relatedContentId: 'learning-document',
    nextAction: '薬局内 / 医師連携 / 家族説明の3レーンで下書きを作る。',
    successMetric: '初回受入時に「次に誰が動くか」で止まらない状態',
  },
  {
    id: 'task-video',
    title: '最初の5分動画を見て、質問を3つ残す',
    owner: '店舗チーム',
    due: '3/28',
    status: '未着手',
    note: '視聴だけで終わらず、この薬局で使う言い回しまで確認します。',
    review: '伴走コメント: 次の会議までに「うちだとどうするか」を3点メモしておくと相談が進みます。',
    deliverable: '質問メモ + 現場メモ',
    relatedContentId: 'learning-video',
    nextAction: '視聴後に、患者説明で使う表現を3つ書き出す。',
    successMetric: '店舗内で説明の言い回しがそろい始める状態',
  },
  {
    id: 'task-comment',
    title: '伴走担当へ下書きコメントを依頼する',
    owner: 'この薬局の導入担当',
    due: '3/29',
    status: '未着手',
    note: '受入条件表または受入フローのどちらかを先に送り、赤入れをもらいます。',
    review: '伴走コメント: 完成前でも送って大丈夫です。早い段階の共有の方が修正コストが下がります。',
    deliverable: 'コメント依頼送信',
    relatedContentId: 'learning-template',
    nextAction: '今日作業した下書きのURLまたはPDFを添えて送る。',
    successMetric: '次の会議前に、修正ポイントが見えている状態',
  },
  {
    id: 'task-role',
    title: '役割分担表の最終確認',
    owner: 'オーナー',
    due: '3/18',
    status: '完了',
    note: '責任者・連絡先・意思決定者は確定済みです。',
    review: '確認済み: 次は不在時の代替動線を1行追加すると、現場でより使いやすくなります。',
    deliverable: '役割分担表',
    relatedContentId: 'learning-template',
    nextAction: '不在時の代替責任者を追記する。',
    successMetric: '誰が休みでも意思決定と相談先が止まらない状態',
  },
]

export const learningItems: LearningItem[] = [
  {
    id: 'learning-video',
    title: 'まず見る動画：初回受入までの流れ',
    type: '動画',
    target: '導入担当 / 店舗チーム',
    description: 'この薬局が最初の1件を受けるまでに、何を順番に決めるかを5分で確認します。',
    duration: '5分',
    outcome: '今週の優先順位がそろう',
    linkedTaskId: 'task-video',
    previewTitle: '動画の見どころ',
    previewMeta: '最初に見る前提整理',
    previewLines: ['初回受入前に決めること', '会議までに残す質問の例', '資料作成へつなぐ見方'],
    ctaLabel: '動画を見る',
  },
  {
    id: 'learning-template',
    title: 'まず作る資料：受入条件表テンプレ',
    type: 'テンプレ',
    target: '管理薬剤師 / 導入担当',
    description: '患者受入判断を、この薬局用に落とし込むための雛形です。',
    duration: '15分',
    outcome: '受入可否の判断基準がそろう',
    linkedTaskId: 'task-acceptance',
    previewTitle: 'テンプレに入っている項目',
    previewMeta: 'A4 1枚で使う想定',
    previewLines: ['受入可否の判断欄', '迷いやすいケースの補足欄', '相談先・判断者の記入欄'],
    ctaLabel: 'テンプレを確認する',
  },
  {
    id: 'learning-document',
    title: '次の会議までに作る：初回受入フローたたき台',
    type: '資料',
    target: '事務 / 現場メンバー',
    description: '問い合わせから初回訪問後の共有までを、1枚で見えるようにするための資料です。',
    duration: '10分',
    outcome: '受入フローを店舗内で説明できる',
    linkedTaskId: 'task-flow',
    previewTitle: '資料で整理する場面',
    previewMeta: '会議用の下書きに最適',
    previewLines: ['問い合わせ受付', '医師・家族との連携', '初回訪問後の共有'],
    ctaLabel: '資料を見る',
  },
  {
    id: 'learning-guide',
    title: '必要になったら見る：夜間接続前チェック',
    type: '資料',
    target: '管理薬剤師 / 伴走担当',
    description: '昼間運用が安定してから、夜間支援へ進むか判断するための整理資料です。',
    duration: '8分',
    outcome: '夜間導線に進む判断ができる',
    linkedTaskId: 'task-comment',
    previewTitle: '確認する3観点',
    previewMeta: '今すぐ必須ではない資料',
    previewLines: ['方針の有無', '受入体制の安定度', '連絡先・責任者の整理'],
    ctaLabel: 'ガイドを見る',
  },
]

export const checklistItems: ChecklistItem[] = [
  { id: 'check-store', title: '店舗情報を確認する', description: '責任者・連絡先・次回会議日程を最初に確認。', done: true, link: '/onboarding/setup', linkLabel: '店舗情報を見る' },
  { id: 'check-assessment', title: '簡易診断を始める', description: 'いま詰まりやすい点を5軸で確認。', done: true, link: '/onboarding/assessment', linkLabel: '診断へ進む' },
  { id: 'check-position', title: 'この薬局の現在地を確認する', description: 'どの段階にいるかと、次に進む条件を把握。', done: false, link: '/onboarding/result', linkLabel: '現在地を見る' },
  { id: 'check-week', title: '今週やることを決める', description: '次回会議までに終えるものを1〜2件に絞る。', done: false, link: '/onboarding/tasks', linkLabel: '今週のタスクを見る' },
  { id: 'check-support', title: '必要なら伴走依頼を送る', description: 'コメント依頼・添削依頼・困りごとの共有を早めに出す。', done: false, link: '/onboarding/support', linkLabel: '相談する' },
]

export const supportItems: SupportItem[] = [
  { id: 'comment', title: 'コメントをもらう', description: '作成途中の資料でも送ってOK。方向性の確認を先に進めます。', action: '受入条件表にコメント依頼を出す' },
  { id: 'review', title: '添削を依頼する', description: '初回受入フローや説明文の赤入れを依頼できます。', action: '下書きを送って添削依頼を出す' },
  { id: 'trouble', title: '困りごとを共有する', description: '人手・役割分担・患者選定など、詰まりをそのまま共有できます。', action: '困っていることを1件送る' },
]

export const phaseOrder: PhaseMeta[] = [
  { id: 0, key: 'phase0', label: 'Phase 0', shortLabel: '導入前整理', title: '導入の目的をそろえる', icon: '🧭', summary: 'この薬局で、なぜ在宅を始めるのかをそろえる段階です。', gate: '目的・優先患者像・責任者を同じ言葉で説明できる', milestone: '導入方針メモ', tone: 'info' },
  { id: 1, key: 'phase1', label: 'Phase 1', shortLabel: '役割整理', title: '役割と相談先を決める', icon: '👥', summary: '誰が判断し、誰に聞けば止まらないかを整理する段階です。', gate: '責任者・主担当・代替担当が見える', milestone: '役割分担表', tone: 'info' },
  { id: 2, key: 'phase2', label: 'Phase 2', shortLabel: '受入準備', title: '初回受入の前提を作る', icon: '🧩', summary: '受入条件表や初回フローを形にして、迷いを減らす段階です。', gate: '受入可否と初回の流れを複数人で説明できる', milestone: '受入条件表 / 初回受入フロー', tone: 'warn' },
  { id: 3, key: 'phase3', label: 'Phase 3', shortLabel: '初回受入', title: '1件目を回しながら整える', icon: '🚀', summary: '実際に初回受入を進め、詰まりを潰しながら整える段階です。', gate: '受入実績が出て、改善点を回収できている', milestone: '初回受入レビュー', tone: 'good' },
  { id: 4, key: 'phase4', label: 'Phase 4', shortLabel: '標準化', title: '教育と再現性を持たせる', icon: '📚', summary: '動画・テンプレ・説明文を整理し、店舗内で再現できる段階です。', gate: '責任者以外も同じ説明と判断で動ける', milestone: '教育導線 / 標準資料', tone: 'good' },
  { id: 5, key: 'phase5', label: 'Phase 5', shortLabel: '夜間接続判定', title: '次の運用に進むか判断する', icon: '🌙', summary: '昼間運用が安定してから、夜間支援への接続可否を判断する段階です。', gate: '方針・体制・連絡先がそろい、判断理由を説明できる', milestone: '接続判定メモ', tone: 'info' },
]

export const comparisonBars = [
  { name: 'この薬局', value: 58, color: '#2f6fed' },
  { name: '先行店舗', value: 76, color: '#00a884' },
  { name: '導入初期店', value: 41, color: '#f08c00' },
]
