import type {
  User,
  UserRole,
  RequestStatus,
  RequestPriority,
  BillingStatus,
  ChecklistType,
  ChecklistItem,
} from '@/types/database'

// ─── Users ───
export const MOCK_USERS: Record<string, User> = {
  admin: {
    id: 'mock-admin-001',
    organization_id: 'org-001',
    pharmacy_id: null,
    role: 'admin',
    full_name: '田中 直樹',
    phone: '090-4400-1022',
    email: 'tanaka@makasete.jp',
    line_user_id: null,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-03-05T00:00:00Z',
  },
  pharmacist: {
    id: 'mock-pharmacist-001',
    organization_id: 'org-001',
    pharmacy_id: null,
    role: 'pharmacist',
    full_name: '佐藤 健一',
    phone: '090-1122-5566',
    email: 'sato@makasete.jp',
    line_user_id: null,
    is_active: true,
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-03-05T00:00:00Z',
  },
  pharmacy_admin: {
    id: 'mock-pharm-admin-001',
    organization_id: 'org-001',
    pharmacy_id: 'PH-01',
    role: 'pharmacy_admin',
    full_name: '山田 美咲',
    phone: '090-3301-7145',
    email: 'yamada@jonan-ph.jp',
    line_user_id: null,
    is_active: true,
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-03-05T00:00:00Z',
  },
}

export const DEMO_ROLE = 'admin'

// ─── Staff ───
export interface StaffItem {
  id: string
  name: string
  role: UserRole
  phone: string
  email: string
  status: 'active' | 'inactive'
}

export const staffData: StaffItem[] = [
  { id: 'ST-01', name: '田中 直樹', role: 'admin', phone: '090-4400-1022', email: 'tanaka.n@makasete.jp', status: 'active' },
  { id: 'ST-02', name: '佐藤 健一', role: 'pharmacist', phone: '090-1122-5566', email: 'sato.k@makasete.jp', status: 'active' },
  { id: 'ST-03', name: '高橋 奈央', role: 'pharmacist', phone: '080-7766-1188', email: 'takahashi.n@makasete.jp', status: 'active' },
  { id: 'ST-04', name: '山口 美咲', role: 'pharmacist', phone: '090-8821-5544', email: 'yamaguchi.m@makasete.jp', status: 'inactive' },
  { id: 'ST-05', name: '山田 美咲', role: 'pharmacy_admin', phone: '090-3301-7145', email: 'yamada.m@jonan-ph.jp', status: 'active' },
  { id: 'ST-06', name: '小林 恒一', role: 'pharmacy_admin', phone: '080-6142-9021', email: 'kobayashi.k@minami-ph.jp', status: 'active' },
  { id: 'ST-07', name: '伊藤 真理', role: 'pharmacy_staff', phone: '080-2277-6631', email: 'ito.m@jonan-ph.jp', status: 'active' },
  { id: 'ST-08', name: '木村 恒一', role: 'pharmacy_staff', phone: '070-4377-1991', email: 'kimura.k@kita-ph.jp', status: 'inactive' },
  { id: 'ST-09', name: '中村 玲子', role: 'pharmacy_staff', phone: '070-6622-8900', email: 'nakamura.r@nishi-ph.jp', status: 'active' },
  { id: 'ST-10', name: '佐々木 翔', role: 'pharmacist', phone: '080-4488-2255', email: 'sasaki.s@makasete.jp', status: 'active' },
]

// ─── Pharmacies ───
export type PharmacyStatus = 'active' | 'pending' | 'suspended'

export interface PharmacyItem {
  id: string
  name: string
  area: string
  address: string
  phone: string
  fax: string
  forwardingPhone: string
  patientCount: number
  status: PharmacyStatus
  forwarding: boolean
  contractDate: string
  saasFee: number
  nightFee: number
}

export const pharmacyData: PharmacyItem[] = [
  { id: 'PH-01', name: '城南みらい薬局', area: '世田谷区', address: '東京都世田谷区上馬3-14-6', phone: '03-3412-2290', fax: '03-3412-2291', forwardingPhone: '03-3412-2295', patientCount: 84, status: 'active', forwarding: true, contractDate: '2025-09-01', saasFee: 40000, nightFee: 100000 },
  { id: 'PH-02', name: '港北さくら薬局', area: '横浜市港北区', address: '神奈川県横浜市港北区篠原西町18-4', phone: '045-533-1870', fax: '045-533-1871', forwardingPhone: '045-533-1875', patientCount: 62, status: 'active', forwarding: true, contractDate: '2025-10-15', saasFee: 38000, nightFee: 100000 },
  { id: 'PH-03', name: '中野しらさぎ薬局', area: '中野区', address: '東京都中野区白鷺1-25-8', phone: '03-5327-2288', fax: '03-5327-2289', forwardingPhone: '03-5327-2290', patientCount: 47, status: 'pending', forwarding: false, contractDate: '2026-01-20', saasFee: 35000, nightFee: 100000 },
  { id: 'PH-04', name: '池袋みどり薬局', area: '豊島区', address: '東京都豊島区南池袋3-9-12', phone: '03-5985-6620', fax: '03-5985-6621', forwardingPhone: '03-5985-6625', patientCount: 53, status: 'suspended', forwarding: false, contractDate: '2025-11-01', saasFee: 42000, nightFee: 100000 },
  { id: 'PH-05', name: '西新宿いろは薬局', area: '新宿区', address: '東京都新宿区西新宿4-32-2', phone: '03-6279-5180', fax: '03-6279-5181', forwardingPhone: '03-6279-5185', patientCount: 71, status: 'active', forwarding: true, contractDate: '2025-08-15', saasFee: 39000, nightFee: 100000 },
  { id: 'PH-06', name: '世田谷つばさ薬局', area: '世田谷区', address: '東京都世田谷区北沢5-10-3', phone: '03-5453-6010', fax: '03-5453-6011', forwardingPhone: '03-5453-6015', patientCount: 38, status: 'active', forwarding: true, contractDate: '2025-12-01', saasFee: 36000, nightFee: 100000 },
  { id: 'PH-07', name: '江東あおぞら薬局', area: '江東区', address: '東京都江東区住吉2-6-11', phone: '03-5600-4780', fax: '03-5600-4781', forwardingPhone: '03-5600-4785', patientCount: 45, status: 'active', forwarding: true, contractDate: '2025-10-01', saasFee: 37000, nightFee: 100000 },
  { id: 'PH-08', name: '吉祥寺つばめ薬局', area: '武蔵野市', address: '東京都武蔵野市吉祥寺本町1-22-9', phone: '0422-27-0070', fax: '0422-27-0071', forwardingPhone: '0422-27-0075', patientCount: 29, status: 'active', forwarding: false, contractDate: '2026-02-01', saasFee: 30000, nightFee: 100000 },
  { id: 'PH-09', name: '渋谷ひまわり薬局', area: '渋谷区', address: '東京都渋谷区神宮前2-18-5', phone: '03-5774-3320', fax: '03-5774-3321', forwardingPhone: '03-5774-3325', patientCount: 56, status: 'active', forwarding: true, contractDate: '2025-09-15', saasFee: 40000, nightFee: 100000 },
]

// ─── Patients ───
export interface PatientRecord {
  id: string
  name: string
  dob: string
  address: string
  pharmacyId: string
  pharmacyName: string
  riskScore: number
  emergencyContact: { name: string; relation: string; phone: string }
  doctor: { name: string; clinic: string; phone: string }
  medicalHistory: string
  allergies: string
  currentMeds: string
  visitNotes: string
  insuranceInfo: string
  diseaseName: string
  status: 'active' | 'inactive'
}

export const patientData: PatientRecord[] = [
  { id: 'PT-001', name: '田中 優子', dob: '1948-06-12', address: '東京都世田谷区上馬2-14-6', pharmacyId: 'PH-01', pharmacyName: '城南みらい薬局', riskScore: 8, emergencyContact: { name: '田中 恒一', relation: '長男', phone: '090-1234-5678' }, doctor: { name: '鈴木 恒一', clinic: '世田谷在宅クリニック', phone: '03-3412-1101' }, medicalHistory: '慢性心不全、2型糖尿病、肺炎既往', allergies: 'ペニシリン系抗菌薬', currentMeds: 'フロセミド、メトホルミン、アムロジピン', visitNotes: '【暗証番号】オートロック暗証番号: 4721（エントランス）→ 502号室\n【ペット】小型犬（チワワ）あり。吠えるため訪問10分前に家族へ電話連絡必須\n【配薬場所】リビングテーブル上の薬ケースに配薬\n【お届け方法】夜間は玄関チャイムを鳴らさず、ドアノックで対応', insuranceInfo: '後期高齢者医療 1割負担', diseaseName: '慢性心不全、2型糖尿病', status: 'active' },
  { id: 'PT-002', name: '小川 正子', dob: '1942-11-02', address: '神奈川県横浜市港北区篠原西町18-4', pharmacyId: 'PH-02', pharmacyName: '港北さくら薬局', riskScore: 6, emergencyContact: { name: '小川 真理', relation: '長女', phone: '080-4455-2233' }, doctor: { name: '山口 恒一', clinic: '港北ホームケア診療所', phone: '045-509-8181' }, medicalHistory: '関節リウマチ、慢性腎不全', allergies: 'なし', currentMeds: 'プレドニゾロン、アセトアミノフェン', visitNotes: '【アクセス】エレベーターなし3階。階段狭いため荷物は最小限に\n【転倒リスク】転倒歴あり（2025年12月）。廊下に手すりなし、スリッパ滑りやすい\n【配薬場所】台所カウンター上のお薬カレンダーに配薬', insuranceInfo: '後期高齢者医療 1割負担', diseaseName: '関節リウマチ、慢性腎不全', status: 'active' },
  { id: 'PT-003', name: '橋本 和子', dob: '1939-08-21', address: '東京都豊島区南池袋3-9-12', pharmacyId: 'PH-04', pharmacyName: '池袋みどり薬局', riskScore: 4, emergencyContact: { name: '橋本 恒一', relation: '夫', phone: '090-9870-1221' }, doctor: { name: '中村 恒一', clinic: '豊島在宅内科', phone: '03-5985-0303' }, medicalHistory: '慢性心不全、貧血', allergies: 'NSAIDs', currentMeds: 'カルベジロール、鉄剤、利尿薬', visitNotes: '【セキュリティ】夜間はドアチェーン使用。インターホン後に「マカセテ在宅の○○です」と氏名を名乗ること\n【配薬場所】仏壇横の薬箱\n【注意】夫が難聴のため大きな声で話す', insuranceInfo: '後期高齢者医療 1割負担', diseaseName: '慢性心不全、貧血', status: 'active' },
  { id: 'PT-004', name: '清水 恒一', dob: '1951-01-15', address: '東京都中野区白鷺1-25-8', pharmacyId: 'PH-03', pharmacyName: '中野しらさぎ薬局', riskScore: 9, emergencyContact: { name: '清水 麻衣', relation: '次女', phone: '080-7770-3388' }, doctor: { name: '高橋 恒一', clinic: '中野訪問診療センター', phone: '03-5327-2210' }, medicalHistory: 'レビー小体型認知症、高血圧', allergies: 'ラテックス', currentMeds: 'ドネペジル、クエチアピン、アムロジピン', visitNotes: '【認知症対応】夕方以降せん妄増悪。家族同席時に説明を優先\n【暗証番号】玄関キーボックス: 8823\n【注意】夜間徘徊リスクあり。玄関の施錠確認を必ず行うこと\n【配薬場所】寝室サイドテーブルの薬ケース', insuranceInfo: '国民健康保険 3割負担', diseaseName: 'レビー小体型認知症、高血圧', status: 'active' },
  { id: 'PT-005', name: '井上 恒一', dob: '1946-03-29', address: '東京都江東区住吉2-6-11', pharmacyId: 'PH-07', pharmacyName: '江東あおぞら薬局', riskScore: 7, emergencyContact: { name: '井上 美香', relation: '妻', phone: '090-6654-2200' }, doctor: { name: '吉田 恒一', clinic: '江東すみれクリニック', phone: '03-5600-4781' }, medicalHistory: '糖尿病、末梢神経障害', allergies: 'なし', currentMeds: 'インスリングラルギン、ボグリボース', visitNotes: '【医療機器】血糖測定器は寝室棚の上段。予備センサーは台所引き出し\n【低血糖対応】低血糖症状時は家族（妻）へ即連絡。ブドウ糖タブレット冷蔵庫内\n【配薬場所】台所テーブル上\n【駐車】マンション来客用P（B1F）利用可', insuranceInfo: '後期高齢者医療 1割負担', diseaseName: '糖尿病、末梢神経障害', status: 'active' },
  { id: 'PT-006', name: '渡辺 美和', dob: '1957-12-07', address: '東京都新宿区西新宿4-32-2', pharmacyId: 'PH-05', pharmacyName: '西新宿いろは薬局', riskScore: 3, emergencyContact: { name: '渡辺 恒一', relation: '弟', phone: '070-4451-7661' }, doctor: { name: '松本 恒一', clinic: '新宿在宅総合診療所', phone: '03-6279-4902' }, medicalHistory: '乳がん術後、慢性疼痛', allergies: '造影剤', currentMeds: 'トラマドール、プレガバリン', visitNotes: '【連絡方法】夜間は携帯（090-8877-2211）優先。インターホンに気づきにくい\n【暗証番号】マンションオートロック: 3356\n【お届け方法】レスキュー薬はポスト投函不可、必ず手渡し', insuranceInfo: '協会けんぽ 3割負担', diseaseName: '乳がん術後、慢性疼痛', status: 'active' },
  { id: 'PT-007', name: '山本 直子', dob: '1944-09-18', address: '東京都世田谷区北沢5-10-3', pharmacyId: 'PH-06', pharmacyName: '世田谷つばさ薬局', riskScore: 5, emergencyContact: { name: '山本 恒一', relation: '長男', phone: '090-2201-8890' }, doctor: { name: '小林 恒一', clinic: '下北沢メディカルホーム', phone: '03-5453-6008' }, medicalHistory: '慢性閉塞性肺疾患、骨粗しょう症', allergies: 'なし', currentMeds: 'チオトロピウム、ビタミンD製剤', visitNotes: '【医療機器】酸素濃縮器あり（2L/分）。停電時対応フローを家族と共有済み\n【配薬場所】リビング酸素濃縮器横のワゴン\n【注意】火気厳禁エリアあり。酸素チューブ周辺での作業注意', insuranceInfo: '後期高齢者医療 1割負担', diseaseName: 'COPD、骨粗しょう症', status: 'active' },
  { id: 'PT-008', name: '森田 恒一', dob: '1950-04-03', address: '東京都武蔵野市吉祥寺本町1-22-9', pharmacyId: 'PH-08', pharmacyName: '吉祥寺つばめ薬局', riskScore: 2, emergencyContact: { name: '森田 由紀', relation: '妻', phone: '080-3098-9011' }, doctor: { name: '藤井 恒一', clinic: '吉祥寺在宅クリニック', phone: '0422-27-0073' }, medicalHistory: '高血圧、脂質異常症', allergies: 'なし', currentMeds: 'ロサルタン、ロスバスタチン', visitNotes: '【暗証番号】キーボックス: 7790（玄関左側の壁面）。番号は担当者限定共有\n【配薬場所】玄関先のポストに配薬OK（妻が回収）\n【駐車】路地裏に1台分スペースあり', insuranceInfo: '国民健康保険 3割負担', diseaseName: '高血圧、脂質異常症', status: 'active' },
  { id: 'PT-009', name: '林 恒一', dob: '1953-07-09', address: '東京都千代田区神田須田町1-8-4', pharmacyId: 'PH-05', pharmacyName: '西新宿いろは薬局', riskScore: 6, emergencyContact: { name: '林 洋子', relation: '妻', phone: '090-3344-5566' }, doctor: { name: '佐藤 恒一', clinic: '神田中央クリニック', phone: '03-3251-4400' }, medicalHistory: 'COPD、慢性心不全', allergies: 'スルホンアミド', currentMeds: 'カルベジロール、スピリーバ', visitNotes: '【アクセス】エレベーター利用（5階）。夜間はオートロック解除コード: 2468\n【医療機器】酸素投与中（1.5L/分）。パルスオキシメーター枕元\n【配薬場所】ベッドサイドテーブル', insuranceInfo: '国民健康保険 3割負担', diseaseName: 'COPD、慢性心不全', status: 'active' },
  { id: 'PT-010', name: '高田 恒一', dob: '1960-02-25', address: '東京都渋谷区神宮前2-18-5', pharmacyId: 'PH-09', pharmacyName: '渋谷ひまわり薬局', riskScore: 3, emergencyContact: { name: '高田 由美', relation: '妻', phone: '080-1122-3344' }, doctor: { name: '木村 恒一', clinic: '渋谷在宅内科', phone: '03-5774-3300' }, medicalHistory: '高血圧、軽度糖尿病', allergies: 'なし', currentMeds: 'アムロジピン、メトホルミン', visitNotes: '【暗証番号】オートロック: 1234。エレベーターで3階\n【配薬場所】キッチンカウンター上のお薬ボックス\n【ペット】猫1匹（室内飼い）。ドア開閉時の脱走注意', insuranceInfo: '協会けんぽ 3割負担', diseaseName: '高血圧、軽度糖尿病', status: 'active' },
]

// ─── Requests ───
export interface RequestItem {
  id: string
  patientId: string
  pharmacyId: string
  receivedAt: string
  receivedDate: string
  patientName: string
  pharmacyName: string
  status: RequestStatus
  priority: RequestPriority
  assignee: string
  assigneeId: string | null
  symptom: string
  vitalsChange: string
  consciousness: string
  urgency: string
  notes: string
  slaMet: boolean | null
  timelineEvents: { status: string; timestamp: string; userName: string; note?: string }[]
}

export const requestData: RequestItem[] = [
  { id: 'RQ-2401', patientId: 'PT-001', pharmacyId: 'PH-01', receivedAt: '22:14', receivedDate: '2026-03-05', patientName: '田中 優子', pharmacyName: '城南みらい薬局', status: 'received', priority: 'high', assignee: '未割当', assigneeId: null, symptom: '悪寒と発熱（38.5℃）', vitalsChange: '体温上昇、脈拍110/分', consciousness: '清明', urgency: '高', notes: '家族より電話あり。食事摂取困難。', slaMet: null, timelineEvents: [
    { status: 'received', timestamp: '2026-03-05 22:14', userName: '田中 直樹', note: '受電・依頼受付' },
  ] },
  { id: 'RQ-2402', patientId: 'PT-002', pharmacyId: 'PH-02', receivedAt: '22:28', receivedDate: '2026-03-05', patientName: '小川 正子', pharmacyName: '港北さくら薬局', status: 'fax_pending', priority: 'normal', assignee: '未割当', assigneeId: null, symptom: '吐き気と食欲低下', vitalsChange: '血圧100/60まで低下', consciousness: 'やや傾眠', urgency: '中', notes: '', slaMet: null, timelineEvents: [
    { status: 'received', timestamp: '2026-03-05 22:28', userName: '田中 直樹', note: '受電・依頼受付' },
    { status: 'fax_pending', timestamp: '2026-03-05 22:30', userName: '田中 直樹', note: 'FAX送信依頼' },
  ] },
  { id: 'RQ-2403', patientId: 'PT-009', pharmacyId: 'PH-05', receivedAt: '22:46', receivedDate: '2026-03-05', patientName: '林 恒一', pharmacyName: '西新宿いろは薬局', status: 'assigning', priority: 'high', assignee: '佐藤 健一', assigneeId: 'ST-02', symptom: '呼吸苦の訴え', vitalsChange: 'SpO2 91%へ低下', consciousness: '清明', urgency: '高', notes: '主治医へ連絡済み。', slaMet: true, timelineEvents: [
    { status: 'received', timestamp: '2026-03-05 22:46', userName: '田中 直樹', note: '受電・依頼受付' },
    { status: 'fax_received', timestamp: '2026-03-05 22:52', userName: '田中 直樹', note: 'FAX受領' },
    { status: 'assigning', timestamp: '2026-03-05 22:55', userName: '田中 直樹', note: '佐藤 健一にアサイン送信' },
  ] },
  { id: 'RQ-2404', patientId: 'PT-006', pharmacyId: 'PH-05', receivedAt: '23:05', receivedDate: '2026-03-05', patientName: '渡辺 美和', pharmacyName: '西新宿いろは薬局', status: 'assigned', priority: 'normal', assignee: '高橋 奈央', assigneeId: 'ST-03', symptom: '疼痛コントロール不良', vitalsChange: '痛みスコア上昇', consciousness: '清明', urgency: '中', notes: 'レスキュー使用回数増加中。', slaMet: true, timelineEvents: [
    { status: 'received', timestamp: '2026-03-05 23:05', userName: '田中 直樹', note: '受電・依頼受付' },
    { status: 'fax_received', timestamp: '2026-03-05 23:10', userName: '田中 直樹', note: 'FAX受領' },
    { status: 'assigned', timestamp: '2026-03-05 23:14', userName: '高橋 奈央', note: 'アサイン受諾' },
  ] },
  { id: 'RQ-2405', patientId: 'PT-007', pharmacyId: 'PH-06', receivedAt: '23:22', receivedDate: '2026-03-05', patientName: '山本 直子', pharmacyName: '世田谷つばさ薬局', status: 'fax_received', priority: 'normal', assignee: '未割当', assigneeId: null, symptom: '下痢・脱水傾向', vitalsChange: '尿量減少', consciousness: '清明', urgency: '中', notes: '', slaMet: null, timelineEvents: [
    { status: 'received', timestamp: '2026-03-05 23:22', userName: '田中 直樹', note: '受電・依頼受付' },
    { status: 'fax_received', timestamp: '2026-03-05 23:28', userName: '田中 直樹', note: 'FAX受領確認' },
  ] },
  { id: 'RQ-2406', patientId: 'PT-004', pharmacyId: 'PH-03', receivedAt: '23:31', receivedDate: '2026-03-05', patientName: '清水 恒一', pharmacyName: '中野しらさぎ薬局', status: 'in_progress', priority: 'high', assignee: '佐藤 健一', assigneeId: 'ST-02', symptom: 'せん妄症状の増悪', vitalsChange: '脈拍増加、発汗', consciousness: '混濁', urgency: '高', notes: '家族同席。環境調整実施中。', slaMet: true, timelineEvents: [
    { status: 'received', timestamp: '2026-03-05 23:31', userName: '田中 直樹', note: '受電・依頼受付' },
    { status: 'fax_received', timestamp: '2026-03-05 23:35', userName: '田中 直樹', note: 'FAX受領' },
    { status: 'assigned', timestamp: '2026-03-05 23:38', userName: '佐藤 健一', note: 'アサイン受諾' },
    { status: 'dispatched', timestamp: '2026-03-05 23:40', userName: '佐藤 健一', note: '出発' },
    { status: 'arrived', timestamp: '2026-03-05 23:52', userName: '佐藤 健一', note: '患者宅に到着' },
    { status: 'in_progress', timestamp: '2026-03-05 23:54', userName: '佐藤 健一', note: '対応開始・家族同席' },
  ] },
  { id: 'RQ-2407', patientId: 'PT-003', pharmacyId: 'PH-04', receivedAt: '23:40', receivedDate: '2026-03-05', patientName: '橋本 和子', pharmacyName: '池袋みどり薬局', status: 'arrived', priority: 'normal', assignee: '高橋 奈央', assigneeId: 'ST-03', symptom: '嘔吐後のふらつき', vitalsChange: '血圧92/54', consciousness: '清明', urgency: '中', notes: '', slaMet: true, timelineEvents: [
    { status: 'received', timestamp: '2026-03-05 23:40', userName: '田中 直樹', note: '受電・依頼受付' },
    { status: 'fax_received', timestamp: '2026-03-05 23:44', userName: '田中 直樹', note: 'FAX受領' },
    { status: 'assigned', timestamp: '2026-03-05 23:47', userName: '高橋 奈央', note: 'アサイン受諾' },
    { status: 'dispatched', timestamp: '2026-03-05 23:49', userName: '高橋 奈央', note: '出発' },
    { status: 'arrived', timestamp: '2026-03-06 00:01', userName: '高橋 奈央', note: '患者宅に到着' },
  ] },
  { id: 'RQ-2408', patientId: 'PT-005', pharmacyId: 'PH-07', receivedAt: '23:52', receivedDate: '2026-03-05', patientName: '井上 恒一', pharmacyName: '江東あおぞら薬局', status: 'dispatched', priority: 'normal', assignee: '山口 美咲', assigneeId: 'ST-04', symptom: '血糖コントロール悪化', vitalsChange: '血糖値312mg/dL', consciousness: '清明', urgency: '中', notes: 'インスリン量の確認必要。', slaMet: true, timelineEvents: [
    { status: 'received', timestamp: '2026-03-05 23:52', userName: '田中 直樹', note: '受電・依頼受付' },
    { status: 'fax_received', timestamp: '2026-03-05 23:56', userName: '田中 直樹', note: 'FAX受領' },
    { status: 'assigned', timestamp: '2026-03-05 23:59', userName: '山口 美咲', note: 'アサイン受諾' },
    { status: 'dispatched', timestamp: '2026-03-06 00:02', userName: '山口 美咲', note: '出発' },
  ] },
  { id: 'RQ-2409', patientId: 'PT-010', pharmacyId: 'PH-09', receivedAt: '00:03', receivedDate: '2026-03-06', patientName: '高田 恒一', pharmacyName: '渋谷ひまわり薬局', status: 'completed', priority: 'low', assignee: '山口 美咲', assigneeId: 'ST-04', symptom: '軽度発熱', vitalsChange: '体温37.5℃', consciousness: '清明', urgency: '低', notes: '経過観察で改善。', slaMet: true, timelineEvents: [
    { status: 'received', timestamp: '2026-03-06 00:03', userName: '田中 直樹', note: '受電・依頼受付' },
    { status: 'fax_received', timestamp: '2026-03-06 00:06', userName: '田中 直樹', note: 'FAX受領' },
    { status: 'assigned', timestamp: '2026-03-06 00:08', userName: '山口 美咲', note: 'アサイン受諾' },
    { status: 'dispatched', timestamp: '2026-03-06 00:10', userName: '山口 美咲', note: '出発' },
    { status: 'arrived', timestamp: '2026-03-06 00:18', userName: '山口 美咲', note: '患者宅に到着' },
    { status: 'in_progress', timestamp: '2026-03-06 00:20', userName: '山口 美咲', note: '対応開始' },
    { status: 'completed', timestamp: '2026-03-06 00:45', userName: '山口 美咲', note: '経過観察で改善。対応完了' },
  ] },
  { id: 'RQ-2410', patientId: 'PT-008', pharmacyId: 'PH-08', receivedAt: '00:11', receivedDate: '2026-03-06', patientName: '森田 恒一', pharmacyName: '吉祥寺つばめ薬局', status: 'completed', priority: 'normal', assignee: '佐々木 翔', assigneeId: 'ST-10', symptom: '夜間痛の増強', vitalsChange: '疼痛スケール 8/10', consciousness: '清明', urgency: '中', notes: '定時鎮痛薬を服用させ、1時間後に改善確認。', slaMet: true, timelineEvents: [
    { status: 'received', timestamp: '2026-03-06 00:11', userName: '田中 直樹', note: '受電・依頼受付' },
    { status: 'fax_received', timestamp: '2026-03-06 00:14', userName: '田中 直樹', note: 'FAX受領' },
    { status: 'assigned', timestamp: '2026-03-06 00:16', userName: '佐々木 翔', note: 'アサイン受諾' },
    { status: 'dispatched', timestamp: '2026-03-06 00:18', userName: '佐々木 翔', note: '出発' },
    { status: 'arrived', timestamp: '2026-03-06 00:30', userName: '佐々木 翔', note: '患者宅に到着' },
    { status: 'in_progress', timestamp: '2026-03-06 00:32', userName: '佐々木 翔', note: '対応開始' },
    { status: 'completed', timestamp: '2026-03-06 01:35', userName: '佐々木 翔', note: '定時鎮痛薬投与後、改善確認。対応完了' },
  ] },
]

// ─── Handovers ───
export interface HandoverItem {
  id: string
  requestId: string | null
  pharmacistName: string
  pharmacistId: string
  patientId: string
  patientName: string
  pharmacyId: string
  pharmacyName: string
  timestamp: string
  confirmed: boolean
  confirmedAt: string | null
  confirmedBy: string | null
  situation: string
  background: string
  assessment: string
  recommendation: string
  vitals: { temperature: string; bloodPressure: string; pulse: string; spo2: string }
  medicationAdministered: string
  patientCondition: string
  reportFileUrl: string | null
}

export const handoverData: HandoverItem[] = [
  {
    id: 'HO-260301', requestId: 'RQ-2409', pharmacistName: '佐藤 健一', pharmacistId: 'ST-02', patientId: 'PT-001', patientName: '田中 優子', pharmacyId: 'PH-01', pharmacyName: '城南みらい薬局', timestamp: '2026/03/05 00:21', confirmed: false, confirmedAt: null, confirmedBy: null,
    situation: '38.6℃の発熱と悪寒が持続。夜間に食事摂取ができず。',
    background: '肺炎既往あり。抗菌薬内服中だが夕方から体調悪化。',
    assessment: '脱水傾向あり。呼吸数やや増加、SpO2は93%まで低下。',
    recommendation: '朝一で主治医へ報告し、採血と点滴可否を確認してください。',
    vitals: { temperature: '38.6', bloodPressure: '102/64', pulse: '108', spo2: '93' },
    medicationAdministered: 'アセトアミノフェン 500mg 経口投与',
    patientCondition: '発熱持続するも意識清明。経口補水可能。',
    reportFileUrl: '/mock/reports/HO-260301_report.pdf',
  },
  {
    id: 'HO-260302', requestId: 'RQ-2410', pharmacistName: '高橋 奈央', pharmacistId: 'ST-03', patientId: 'PT-002', patientName: '小川 正子', pharmacyId: 'PH-02', pharmacyName: '港北さくら薬局', timestamp: '2026/03/05 00:04', confirmed: true, confirmedAt: '2026/03/05 00:36', confirmedBy: '山田 美咲',
    situation: '疼痛コントロール不良でNRS 8/10。体動時に疼痛増強。',
    background: 'がん性疼痛。レスキュー使用回数が本日5回。',
    assessment: '鎮痛薬の効果持続が短く、夜間増悪パターンを確認。',
    recommendation: '定時鎮痛薬の増量検討。主治医へ翌朝相談をお願いします。',
    vitals: { temperature: '37.1', bloodPressure: '118/72', pulse: '96', spo2: '97' },
    medicationAdministered: 'オキシコドン速放錠 5mg レスキュー投与',
    patientCondition: '疼痛やや軽減（NRS 5/10）。安静時は耐えられる程度。',
    reportFileUrl: null,
  },
  {
    id: 'HO-260303', requestId: null, pharmacistName: '山口 美咲', pharmacistId: 'ST-04', patientId: 'PT-004', patientName: '清水 恒一', pharmacyId: 'PH-03', pharmacyName: '中野しらさぎ薬局', timestamp: '2026/03/04 23:48', confirmed: false, confirmedAt: null, confirmedBy: null,
    situation: 'せん妄症状が増悪し、夜間に興奮状態。',
    background: '認知症あり。日中は落ち着いていたが夕食後から不穏。',
    assessment: '服薬タイミングずれの可能性。転倒リスクが高い状態。',
    recommendation: '家族へ環境調整を依頼し、明朝の訪問前倒しを推奨します。',
    vitals: { temperature: '36.8', bloodPressure: '130/78', pulse: '102', spo2: '96' },
    medicationAdministered: 'クエチアピン 25mg 臨時投与',
    patientCondition: '投薬後30分で落ち着きを取り戻す。見守り継続中。',
    reportFileUrl: '/mock/reports/HO-260303_medics_report.pdf',
  },
  {
    id: 'HO-260304', requestId: null, pharmacistName: '佐々木 翔', pharmacistId: 'ST-10', patientId: 'PT-003', patientName: '橋本 和子', pharmacyId: 'PH-04', pharmacyName: '池袋みどり薬局', timestamp: '2026/03/04 23:20', confirmed: true, confirmedAt: '2026/03/04 23:55', confirmedBy: '山田 美咲',
    situation: '嘔吐後のふらつきあり。',
    background: '慢性心不全。利尿薬調整中。',
    assessment: '軽度脱水と起立性低血圧が疑われる。',
    recommendation: '翌朝まで経口補水を継続し、体位変換時に介助を依頼。',
    vitals: { temperature: '36.5', bloodPressure: '94/58', pulse: '90', spo2: '95' },
    medicationAdministered: 'なし（経口補水のみ）',
    patientCondition: '嘔吐は収まり、少量の水分摂取可能。',
    reportFileUrl: null,
  },
]

// ─── Billing ───
export interface BillingRecord {
  id: string
  invoiceNumber: string
  pharmacyId: string
  pharmacyName: string
  month: string
  saasFee: number
  nightFee: number
  tax: number
  total: number
  status: BillingStatus
}

export const billingData: BillingRecord[] = [
  { id: 'BL-01', invoiceNumber: 'INV-2026-03-001', pharmacyId: 'PH-01', pharmacyName: '城南みらい薬局', month: '2026-02', saasFee: 40000, nightFee: 100000, tax: 14000, total: 154000, status: 'paid' },
  { id: 'BL-02', invoiceNumber: 'INV-2026-03-002', pharmacyId: 'PH-02', pharmacyName: '港北さくら薬局', month: '2026-02', saasFee: 38000, nightFee: 100000, tax: 13800, total: 151800, status: 'paid' },
  { id: 'BL-03', invoiceNumber: 'INV-2026-03-003', pharmacyId: 'PH-03', pharmacyName: '中野しらさぎ薬局', month: '2026-02', saasFee: 35000, nightFee: 100000, tax: 13500, total: 148500, status: 'unpaid' },
  { id: 'BL-04', invoiceNumber: 'INV-2026-03-004', pharmacyId: 'PH-04', pharmacyName: '池袋みどり薬局', month: '2026-02', saasFee: 42000, nightFee: 100000, tax: 14200, total: 156200, status: 'overdue' },
  { id: 'BL-05', invoiceNumber: 'INV-2026-03-005', pharmacyId: 'PH-05', pharmacyName: '西新宿いろは薬局', month: '2026-02', saasFee: 39000, nightFee: 100000, tax: 13900, total: 152900, status: 'unpaid' },
  { id: 'BL-06', invoiceNumber: 'INV-2026-03-006', pharmacyId: 'PH-06', pharmacyName: '世田谷つばさ薬局', month: '2026-02', saasFee: 36000, nightFee: 100000, tax: 13600, total: 149600, status: 'paid' },
]

// ─── Dashboard ───
export const kpiData = [
  { label: '今夜の依頼数', value: '12', trend: '+18%', trendUp: true },
  { label: '対応中', value: '3', trend: '+1件', trendUp: true },
  { label: 'SLA達成率', value: '94.2%', trend: '-0.8pt', trendUp: false },
  { label: '加盟薬局数', value: '28', trend: '+2店舗', trendUp: true },
]

export const timelineEvents = [
  { id: 'evt-1', title: '田中優子様の対応が完了しました', time: '00:18', status: '完了', color: 'bg-emerald-400' },
  { id: 'evt-2', title: '城南みらい薬局より発熱対応依頼を受付', time: '00:09', status: '受付', color: 'bg-sky-400' },
  { id: 'evt-3', title: '高橋奈央薬剤師が現地で対応中', time: '23:54', status: '対応中', color: 'bg-amber-400' },
  { id: 'evt-4', title: '神田中央薬局の依頼を佐藤健一薬剤師へアサイン', time: '23:41', status: '対応中', color: 'bg-amber-400' },
]

export const nightStaff = [
  { name: '佐藤 健一', status: '対応中', assignment: '中野しらさぎ薬局 / 鈴木 博様' },
  { name: '高橋 奈央', status: '移動中', assignment: '城南みらい薬局 / 小川 正子様' },
  { name: '山口 美咲', status: '待機中', assignment: '次回アサイン待機' },
]

// ─── Assign page ───
export const assignPharmacists = [
  { id: 'ph-1', name: '佐藤 健一', area: '世田谷エリア' },
  { id: 'ph-2', name: '高橋 奈央', area: '新宿・中野エリア' },
  { id: 'ph-3', name: '山口 美咲', area: '渋谷・港エリア' },
  { id: 'ph-4', name: '佐々木 翔', area: '文京・千代田エリア' },
]

export const pendingAssignments = [
  {
    id: 'RQ-2411', patientName: '中村 恒一', pharmacyName: '墨田さくら薬局', receivedAt: '00:24', priority: '高', symptom: '呼吸苦とSpO2低下',
    availablePharmacists: [
      { name: '佐々木 翔', status: '待機中', eta: '12分', distance: '5.2km' },
      { name: '山口 美咲', status: '待機中', eta: '16分', distance: '7.3km' },
    ],
  },
  {
    id: 'RQ-2412', patientName: '木村 和子', pharmacyName: '品川こもれび薬局', receivedAt: '00:31', priority: '中', symptom: '疼痛コントロール不良',
    availablePharmacists: [
      { name: '高橋 奈央', status: '待機中', eta: '10分', distance: '4.1km' },
      { name: '佐藤 健一', status: '対応後復帰予定', eta: '22分', distance: '9.5km' },
    ],
  },
]

// ─── Checklist Templates ───
export const checklistTemplates: Record<ChecklistType, ChecklistItem[]> = {
  initial: [
    { label: '患者情報と既往歴を確認', checked: false },
    { label: '処方内容と在庫薬を確認', checked: false },
    { label: '緊急連絡先に事前連絡', checked: false },
    { label: '訪問ルート・駐車場所を確認', checked: false },
    { label: '感染対策キットを準備', checked: false },
    { label: '薬剤師免許証を携帯', checked: false },
  ],
  routine: [
    { label: '前回申し送り内容を確認', checked: false },
    { label: '処方薬・残薬数を確認', checked: false },
    { label: 'バイタルサイン測定準備', checked: false },
    { label: '服薬指導資料を準備', checked: false },
    { label: '副作用チェックリストを確認', checked: false },
  ],
  emergency: [
    { label: '患者の意識レベルを確認', checked: false },
    { label: '主治医への緊急連絡を実施', checked: false },
    { label: 'バイタルサインを測定・記録', checked: false },
    { label: '救急搬送の要否を判断', checked: false },
    { label: '家族への状況説明を実施', checked: false },
    { label: '使用薬剤と投与量を記録', checked: false },
    { label: '申し送り事項をまとめ', checked: false },
  ],
}

// ─── Shared helpers ───
export const statusMeta: Record<RequestStatus, { label: string; className: string }> = {
  received: { label: '受付', className: 'border-sky-500/40 bg-sky-500/20 text-sky-300' },
  fax_pending: { label: 'FAX待ち', className: 'border-purple-500/40 bg-purple-500/20 text-purple-300' },
  fax_received: { label: 'FAX受領', className: 'border-indigo-500/40 bg-indigo-500/20 text-indigo-300' },
  assigning: { label: 'アサイン中', className: 'border-amber-500/40 bg-amber-500/20 text-amber-300' },
  assigned: { label: 'アサイン済', className: 'border-cyan-500/40 bg-cyan-500/20 text-cyan-300' },
  checklist: { label: '確認中', className: 'border-cyan-500/40 bg-cyan-500/20 text-cyan-300' },
  dispatched: { label: '出動中', className: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' },
  arrived: { label: '到着', className: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' },
  in_progress: { label: '対応中', className: 'border-amber-500/40 bg-amber-500/20 text-amber-300' },
  completed: { label: '完了', className: 'border-gray-500/50 bg-gray-500/20 text-gray-300' },
  cancelled: { label: 'キャンセル', className: 'border-rose-500/40 bg-rose-500/20 text-rose-300' },
}

export const priorityMeta: Record<RequestPriority, { label: string; dot: string; mobileBorder: string }> = {
  high: { label: '高', dot: 'bg-rose-400', mobileBorder: 'border-l-rose-500' },
  normal: { label: '中', dot: 'bg-amber-400', mobileBorder: 'border-l-amber-400' },
  low: { label: '低', dot: 'bg-sky-400', mobileBorder: 'border-l-sky-400' },
}

export const requestFlow = ['受付', 'FAX', 'アサイン', '出発', '到着', '対応中', '完了']

export const requestStepIndex: Record<RequestStatus, number> = {
  received: 0,
  fax_pending: 0,
  fax_received: 1,
  assigning: 2,
  assigned: 2,
  checklist: 2,
  dispatched: 3,
  arrived: 4,
  in_progress: 5,
  completed: 6,
  cancelled: 0,
}

export function getRiskClass(score: number) {
  if (score <= 3) return 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
  if (score <= 6) return 'border-amber-500/40 bg-amber-500/20 text-amber-300'
  return 'border-rose-500/40 bg-rose-500/20 text-rose-300'
}

export const sbarStyles = {
  situation: { label: 'S: Situation（状況）', className: 'border-sky-500/40 bg-sky-500/10 text-sky-100' },
  background: { label: 'B: Background（背景）', className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100' },
  assessment: { label: 'A: Assessment（評価）', className: 'border-amber-500/40 bg-amber-500/10 text-amber-100' },
  recommendation: { label: 'R: Recommendation（提言）', className: 'border-purple-500/40 bg-purple-500/10 text-purple-100' },
}

// ─── Shifts ───
export interface ShiftEntry {
  id: string
  pharmacistId: string
  pharmacistName: string
  shiftDate: string // YYYY-MM-DD
  shiftType: 'primary' | 'backup'
}

// Generate shifts for the week of 2026-03-02 to 2026-03-08
export const shiftData: ShiftEntry[] = [
  // Monday 03-02
  { id: 'SH-01', pharmacistId: 'ST-02', pharmacistName: '佐藤 健一', shiftDate: '2026-03-02', shiftType: 'primary' },
  { id: 'SH-02', pharmacistId: 'ST-03', pharmacistName: '高橋 奈央', shiftDate: '2026-03-02', shiftType: 'backup' },
  // Tuesday 03-03
  { id: 'SH-03', pharmacistId: 'ST-03', pharmacistName: '高橋 奈央', shiftDate: '2026-03-03', shiftType: 'primary' },
  { id: 'SH-04', pharmacistId: 'ST-10', pharmacistName: '佐々木 翔', shiftDate: '2026-03-03', shiftType: 'backup' },
  // Wednesday 03-04
  { id: 'SH-05', pharmacistId: 'ST-10', pharmacistName: '佐々木 翔', shiftDate: '2026-03-04', shiftType: 'primary' },
  { id: 'SH-06', pharmacistId: 'ST-02', pharmacistName: '佐藤 健一', shiftDate: '2026-03-04', shiftType: 'backup' },
  // Thursday 03-05
  { id: 'SH-07', pharmacistId: 'ST-02', pharmacistName: '佐藤 健一', shiftDate: '2026-03-05', shiftType: 'primary' },
  { id: 'SH-08', pharmacistId: 'ST-04', pharmacistName: '山口 美咲', shiftDate: '2026-03-05', shiftType: 'backup' },
  // Friday 03-06
  { id: 'SH-09', pharmacistId: 'ST-04', pharmacistName: '山口 美咲', shiftDate: '2026-03-06', shiftType: 'primary' },
  { id: 'SH-10', pharmacistId: 'ST-03', pharmacistName: '高橋 奈央', shiftDate: '2026-03-06', shiftType: 'backup' },
  // Saturday 03-07
  { id: 'SH-11', pharmacistId: 'ST-03', pharmacistName: '高橋 奈央', shiftDate: '2026-03-07', shiftType: 'primary' },
  { id: 'SH-12', pharmacistId: 'ST-10', pharmacistName: '佐々木 翔', shiftDate: '2026-03-07', shiftType: 'backup' },
  // Sunday 03-08
  { id: 'SH-13', pharmacistId: 'ST-02', pharmacistName: '佐藤 健一', shiftDate: '2026-03-08', shiftType: 'primary' },
  { id: 'SH-14', pharmacistId: 'ST-04', pharmacistName: '山口 美咲', shiftDate: '2026-03-08', shiftType: 'backup' },
]

// Pharmacist list for shift calendar
export const shiftPharmacists = [
  { id: 'ST-02', name: '佐藤 健一' },
  { id: 'ST-03', name: '高橋 奈央' },
  { id: 'ST-04', name: '山口 美咲' },
  { id: 'ST-10', name: '佐々木 翔' },
]

// ─── Audit Logs ───
export type AuditActionType =
  | 'login'
  | 'request_update'
  | 'handover_confirm'
  | 'staff_update'
  | 'billing_generate'
  | 'export_csv'
  | 'pharmacy_update'

export interface AuditEntry {
  id: string
  timestamp: string
  user: string
  action: AuditActionType
  target: string
  details: string
}

export const auditLogData: AuditEntry[] = [
  { id: 'AL-001', timestamp: '2026-03-05 00:58:14', user: '田中 直樹', action: 'billing_generate', target: '請求管理', details: '2026-03対象の請求書を6件一括生成。' },
  { id: 'AL-002', timestamp: '2026-03-05 00:50:42', user: '山田 美咲', action: 'handover_confirm', target: 'HO-260301', details: '申し送りを確認済みに変更。確認コメント: 朝訪問前倒し。' },
  { id: 'AL-003', timestamp: '2026-03-05 00:47:10', user: '佐藤 健一', action: 'request_update', target: 'RQ-2411', details: 'ステータスを in_progress に更新。患者宅到着を記録。' },
  { id: 'AL-004', timestamp: '2026-03-05 00:41:03', user: '田中 直樹', action: 'staff_update', target: 'ST-09', details: 'スタッフ状態を active に変更。連絡先情報を更新。' },
  { id: 'AL-005', timestamp: '2026-03-05 00:38:55', user: '小林 恒一', action: 'login', target: '管理画面', details: 'MFA認証を伴う管理画面ログインに成功。' },
  { id: 'AL-006', timestamp: '2026-03-05 00:31:19', user: '中村 玲子', action: 'request_update', target: 'RQ-2412', details: 'FAX受領時刻を登録し、ステータスを fax_received に更新。' },
  { id: 'AL-007', timestamp: '2026-03-05 00:24:11', user: '田中 直樹', action: 'pharmacy_update', target: 'PH-03', details: '転送設定を OFF から ON に変更。' },
  { id: 'AL-008', timestamp: '2026-03-05 00:16:29', user: '高橋 奈央', action: 'request_update', target: 'RQ-2407', details: 'ステータスを completed に更新。対応完了メモを追記。' },
  { id: 'AL-009', timestamp: '2026-03-05 00:09:04', user: '山口 美咲', action: 'handover_confirm', target: 'HO-260302', details: '申し送り確認とバイタル再評価メモを登録。' },
  { id: 'AL-010', timestamp: '2026-03-04 23:59:57', user: '田中 直樹', action: 'export_csv', target: '実績レポート', details: '2026-02の実績CSVをエクスポート。' },
  { id: 'AL-011', timestamp: '2026-03-04 23:51:26', user: '伊藤 真理', action: 'request_update', target: 'RQ-2405', details: '患者連絡履歴を追加し優先度を normal に維持。' },
  { id: 'AL-012', timestamp: '2026-03-04 23:44:02', user: '田中 直樹', action: 'pharmacy_update', target: 'PH-05', details: '加盟店ステータスを pending から active に変更。' },
  { id: 'AL-013', timestamp: '2026-03-04 23:31:18', user: '木村 恒一', action: 'login', target: '管理画面', details: '薬局スタッフ権限でログイン。' },
  { id: 'AL-014', timestamp: '2026-03-04 23:19:42', user: '山田 美咲', action: 'request_update', target: 'RQ-2403', details: '主訴を修正し、既往歴リンクを添付。' },
  { id: 'AL-015', timestamp: '2026-03-04 23:12:27', user: '小林 恒一', action: 'staff_update', target: 'ST-08', details: 'スタッフ状態を inactive に変更。退職予定登録。' },
  { id: 'AL-016', timestamp: '2026-03-04 22:58:33', user: '田中 直樹', action: 'billing_generate', target: '請求管理', details: '再発行対応としてINV-2026-03-004を単体再生成。' },
  { id: 'AL-017', timestamp: '2026-03-04 22:46:11', user: '佐藤 健一', action: 'request_update', target: 'RQ-2401', details: '出動記録を追加。到着見込み時刻を更新。' },
  { id: 'AL-018', timestamp: '2026-03-04 22:33:40', user: '田中 直樹', action: 'login', target: '管理画面', details: 'システム監視対応のためログイン。' },
]

export const auditActionLabel: Record<AuditActionType, string> = {
  login: 'ログイン',
  request_update: '依頼更新',
  handover_confirm: '申し送り確認',
  staff_update: 'スタッフ更新',
  billing_generate: '請求生成',
  export_csv: 'CSV出力',
  pharmacy_update: '加盟店更新',
}

export const auditActionClass: Record<AuditActionType, string> = {
  login: 'border-gray-500/40 bg-gray-500/20 text-gray-300',
  request_update: 'border-sky-500/40 bg-sky-500/20 text-sky-300',
  handover_confirm: 'border-purple-500/40 bg-purple-500/20 text-purple-300',
  staff_update: 'border-amber-500/40 bg-amber-500/20 text-amber-300',
  billing_generate: 'border-indigo-500/40 bg-indigo-500/20 text-indigo-300',
  export_csv: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
  pharmacy_update: 'border-cyan-500/40 bg-cyan-500/20 text-cyan-300',
}

// Unique users from audit logs for user filter
export const auditUsers = Array.from(new Set(auditLogData.map((entry) => entry.user)))

// ─── Reports: Pharmacy Performance ───
export interface PharmacyPerformance {
  pharmacyId: string
  pharmacyName: string
  requestCount: number
  avgResponseMin: number
  slaRate: number
  completionRate: number
}

export const pharmacyPerformanceData: PharmacyPerformance[] = [
  { pharmacyId: 'PH-01', pharmacyName: '城南みらい薬局', requestCount: 32, avgResponseMin: 10.2, slaRate: 96.9, completionRate: 100 },
  { pharmacyId: 'PH-02', pharmacyName: '港北さくら薬局', requestCount: 24, avgResponseMin: 11.5, slaRate: 95.8, completionRate: 100 },
  { pharmacyId: 'PH-05', pharmacyName: '西新宿いろは薬局', requestCount: 28, avgResponseMin: 12.1, slaRate: 92.9, completionRate: 96.4 },
  { pharmacyId: 'PH-06', pharmacyName: '世田谷つばさ薬局', requestCount: 18, avgResponseMin: 9.8, slaRate: 100, completionRate: 100 },
  { pharmacyId: 'PH-07', pharmacyName: '江東あおぞら薬局', requestCount: 21, avgResponseMin: 13.4, slaRate: 90.5, completionRate: 95.2 },
  { pharmacyId: 'PH-09', pharmacyName: '渋谷ひまわり薬局', requestCount: 26, avgResponseMin: 11.0, slaRate: 96.2, completionRate: 100 },
  { pharmacyId: 'PH-03', pharmacyName: '中野しらさぎ薬局', requestCount: 19, avgResponseMin: 14.2, slaRate: 89.5, completionRate: 94.7 },
  { pharmacyId: 'PH-08', pharmacyName: '吉祥寺つばめ薬局', requestCount: 12, avgResponseMin: 10.8, slaRate: 100, completionRate: 100 },
  { pharmacyId: 'PH-04', pharmacyName: '池袋みどり薬局', requestCount: 6, avgResponseMin: 15.1, slaRate: 83.3, completionRate: 83.3 },
]

export interface HourlyDistribution {
  hour: string
  count: number
}

export const hourlyDistributionData: HourlyDistribution[] = [
  { hour: '22時', count: 28 },
  { hour: '23時', count: 42 },
  { hour: '0時', count: 35 },
  { hour: '1時', count: 31 },
  { hour: '2時', count: 22 },
  { hour: '3時', count: 14 },
  { hour: '4時', count: 8 },
  { hour: '5時', count: 6 },
]

// ─── Notification Logs ───
export type NotifChannel = 'line' | 'email' | 'push' | 'phone'
export type NotifStatus = 'sent' | 'delivered' | 'failed' | 'pending'

export interface NotificationLogItem {
  id: string
  timestamp: string
  event: string
  eventLabel: string
  channel: NotifChannel
  recipientName: string
  recipientContact: string
  status: NotifStatus
  errorMessage: string | null
}

export const notificationLogData: NotificationLogItem[] = [
  { id: 'NL-001', timestamp: '2026-03-06 00:58:14', event: 'request.created', eventLabel: '新規受電', channel: 'push', recipientName: '田中 直樹', recipientContact: 'tanaka@makasete.jp', status: 'delivered', errorMessage: null },
  { id: 'NL-002', timestamp: '2026-03-06 00:58:16', event: 'request.created', eventLabel: '新規受電', channel: 'line', recipientName: '田中 直樹', recipientContact: 'U1234567890abcdef', status: 'delivered', errorMessage: null },
  { id: 'NL-003', timestamp: '2026-03-06 00:46:02', event: 'assignment.created', eventLabel: 'アサイン通知', channel: 'line', recipientName: '佐藤 健一', recipientContact: 'U2345678901abcdef', status: 'delivered', errorMessage: null },
  { id: 'NL-004', timestamp: '2026-03-06 00:46:05', event: 'assignment.created', eventLabel: 'アサイン通知', channel: 'push', recipientName: '佐藤 健一', recipientContact: 'sato@makasete.jp', status: 'delivered', errorMessage: null },
  { id: 'NL-005', timestamp: '2026-03-06 00:31:22', event: 'sla.warning', eventLabel: 'SLA警告', channel: 'push', recipientName: '田中 直樹', recipientContact: 'tanaka@makasete.jp', status: 'delivered', errorMessage: null },
  { id: 'NL-006', timestamp: '2026-03-06 00:28:14', event: 'handover.created', eventLabel: '申し送り作成', channel: 'email', recipientName: '山田 美咲', recipientContact: 'yamada@jonan-ph.jp', status: 'sent', errorMessage: null },
  { id: 'NL-007', timestamp: '2026-03-06 00:28:16', event: 'handover.created', eventLabel: '申し送り作成', channel: 'line', recipientName: '山田 美咲', recipientContact: 'U3456789012abcdef', status: 'failed', errorMessage: 'LINE user not found or blocked' },
  { id: 'NL-008', timestamp: '2026-03-06 00:15:40', event: 'assignment.completed', eventLabel: '対応完了', channel: 'push', recipientName: '田中 直樹', recipientContact: 'tanaka@makasete.jp', status: 'delivered', errorMessage: null },
  { id: 'NL-009', timestamp: '2026-03-06 00:15:42', event: 'assignment.completed', eventLabel: '対応完了', channel: 'line', recipientName: '田中 直樹', recipientContact: 'U1234567890abcdef', status: 'delivered', errorMessage: null },
  { id: 'NL-010', timestamp: '2026-03-05 23:55:01', event: 'sla.violated', eventLabel: 'SLA違反', channel: 'line', recipientName: '田中 直樹', recipientContact: 'U1234567890abcdef', status: 'delivered', errorMessage: null },
  { id: 'NL-011', timestamp: '2026-03-05 23:55:03', event: 'sla.violated', eventLabel: 'SLA違反', channel: 'phone', recipientName: '田中 直樹', recipientContact: '090-4400-1022', status: 'pending', errorMessage: null },
  { id: 'NL-012', timestamp: '2026-03-05 23:40:18', event: 'shift.reminder', eventLabel: 'シフトリマインド', channel: 'line', recipientName: '山口 美咲', recipientContact: 'U4567890123abcdef', status: 'delivered', errorMessage: null },
  { id: 'NL-013', timestamp: '2026-03-05 23:22:05', event: 'pharmacy.forwarding_on', eventLabel: '転送開始', channel: 'push', recipientName: '小林 恒一', recipientContact: 'kobayashi@minami-ph.jp', status: 'delivered', errorMessage: null },
  { id: 'NL-014', timestamp: '2026-03-05 23:10:30', event: 'billing.generated', eventLabel: '請求書発行', channel: 'email', recipientName: '山田 美咲', recipientContact: 'yamada@jonan-ph.jp', status: 'failed', errorMessage: 'SMTP connection timeout' },
  { id: 'NL-015', timestamp: '2026-03-05 22:58:11', event: 'assignment.timeout', eventLabel: 'アサインタイムアウト', channel: 'line', recipientName: '高橋 奈央', recipientContact: 'U5678901234abcdef', status: 'delivered', errorMessage: null },
]

export const notifChannelLabel: Record<NotifChannel, string> = {
  line: 'LINE',
  email: 'メール',
  push: 'プッシュ',
  phone: '電話',
}

export const notifChannelClass: Record<NotifChannel, string> = {
  line: 'border-green-500/40 bg-green-500/20 text-green-300',
  email: 'border-sky-500/40 bg-sky-500/20 text-sky-300',
  push: 'border-amber-500/40 bg-amber-500/20 text-amber-300',
  phone: 'border-rose-500/40 bg-rose-500/20 text-rose-300',
}

export const notifStatusLabel: Record<NotifStatus, string> = {
  sent: '送信済',
  delivered: '配信済',
  failed: '失敗',
  pending: '送信待ち',
}

export const notifStatusClass: Record<NotifStatus, string> = {
  sent: 'border-sky-500/40 bg-sky-500/20 text-sky-300',
  delivered: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
  failed: 'border-rose-500/40 bg-rose-500/20 text-rose-300',
  pending: 'border-amber-500/40 bg-amber-500/20 text-amber-300',
}

// ─── LINE Integration Status ───
export interface LineUserStatus {
  staffId: string
  staffName: string
  role: UserRole
  lineUserId: string | null
  linked: boolean
  linkedAt: string | null
}

export const lineUserStatuses: LineUserStatus[] = [
  { staffId: 'ST-01', staffName: '田中 直樹', role: 'admin', lineUserId: 'U1234567890abcdef', linked: true, linkedAt: '2026-01-15 10:30:00' },
  { staffId: 'ST-02', staffName: '佐藤 健一', role: 'pharmacist', lineUserId: 'U2345678901abcdef', linked: true, linkedAt: '2026-01-20 14:15:00' },
  { staffId: 'ST-03', staffName: '高橋 奈央', role: 'pharmacist', lineUserId: 'U5678901234abcdef', linked: true, linkedAt: '2026-02-01 09:00:00' },
  { staffId: 'ST-04', staffName: '山口 美咲', role: 'pharmacist', lineUserId: 'U4567890123abcdef', linked: true, linkedAt: '2026-02-05 11:22:00' },
  { staffId: 'ST-05', staffName: '山田 美咲', role: 'pharmacy_admin', lineUserId: 'U3456789012abcdef', linked: true, linkedAt: '2026-02-10 16:45:00' },
  { staffId: 'ST-06', staffName: '小林 恒一', role: 'pharmacy_admin', lineUserId: null, linked: false, linkedAt: null },
  { staffId: 'ST-07', staffName: '伊藤 真理', role: 'pharmacy_staff', lineUserId: null, linked: false, linkedAt: null },
  { staffId: 'ST-10', staffName: '佐々木 翔', role: 'pharmacist', lineUserId: 'U6789012345abcdef', linked: true, linkedAt: '2026-02-15 08:30:00' },
]

// ─── Notification Settings ───
export interface NotificationSettingItem {
  event: string
  eventLabel: string
  category: string
  line: boolean
  email: boolean
  push: boolean
  phone: boolean
}

export const notificationSettingsData: NotificationSettingItem[] = [
  { event: 'request.created', eventLabel: '新規受電', category: '依頼管理', line: true, email: false, push: true, phone: false },
  { event: 'request.status_changed', eventLabel: 'ステータス変更', category: '依頼管理', line: false, email: false, push: true, phone: false },
  { event: 'request.cancelled', eventLabel: '依頼キャンセル', category: '依頼管理', line: true, email: false, push: true, phone: false },
  { event: 'request.priority_escalated', eventLabel: '優先度エスカレーション', category: '依頼管理', line: true, email: false, push: true, phone: true },
  { event: 'assignment.created', eventLabel: 'アサイン通知', category: 'アサイン', line: true, email: false, push: true, phone: false },
  { event: 'assignment.accepted', eventLabel: 'アサイン受諾', category: 'アサイン', line: false, email: false, push: true, phone: false },
  { event: 'assignment.declined', eventLabel: 'アサイン辞退', category: 'アサイン', line: true, email: false, push: true, phone: false },
  { event: 'assignment.timeout', eventLabel: 'アサインタイムアウト', category: 'アサイン', line: true, email: false, push: true, phone: true },
  { event: 'assignment.completed', eventLabel: '対応完了', category: 'アサイン', line: true, email: false, push: true, phone: false },
  { event: 'sla.violated', eventLabel: 'SLA違反', category: 'SLA監視', line: true, email: false, push: true, phone: true },
  { event: 'sla.warning', eventLabel: 'SLA警告', category: 'SLA監視', line: true, email: false, push: true, phone: false },
  { event: 'handover.created', eventLabel: '申し送り作成', category: '申し送り', line: true, email: true, push: false, phone: false },
  { event: 'handover.unconfirmed', eventLabel: '申し送り未確認', category: '申し送り', line: true, email: true, push: false, phone: false },
  { event: 'handover.reminder', eventLabel: '確認リマインド', category: '申し送り', line: false, email: true, push: false, phone: false },
  { event: 'billing.generated', eventLabel: '請求書発行', category: '請求', line: false, email: true, push: false, phone: false },
  { event: 'billing.overdue', eventLabel: '支払い遅延', category: '請求', line: true, email: true, push: false, phone: false },
  { event: 'shift.reminder', eventLabel: 'シフトリマインド', category: 'シフト', line: true, email: false, push: true, phone: false },
  { event: 'shift.changed', eventLabel: 'シフト変更', category: 'シフト', line: true, email: false, push: true, phone: false },
  { event: 'pharmacy.forwarding_reminder', eventLabel: '転送解除リマインド', category: '加盟薬局', line: true, email: false, push: false, phone: false },
]
