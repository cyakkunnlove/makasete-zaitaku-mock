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
  status: 'active' | 'inactive'
}

export const patientData: PatientRecord[] = [
  { id: 'PT-001', name: '田中 優子', dob: '1948-06-12', address: '東京都世田谷区上馬2-14-6', pharmacyId: 'PH-01', pharmacyName: '城南みらい薬局', riskScore: 8, emergencyContact: { name: '田中 恒一', relation: '長男', phone: '090-1234-5678' }, doctor: { name: '鈴木 恒一', clinic: '世田谷在宅クリニック', phone: '03-3412-1101' }, medicalHistory: '慢性心不全、2型糖尿病、肺炎既往', allergies: 'ペニシリン系抗菌薬', currentMeds: 'フロセミド、メトホルミン、アムロジピン', visitNotes: '玄関暗証番号 4721。小型犬あり、訪問前連絡必須。', status: 'active' },
  { id: 'PT-002', name: '小川 正子', dob: '1942-11-02', address: '神奈川県横浜市港北区篠原西町18-4', pharmacyId: 'PH-02', pharmacyName: '港北さくら薬局', riskScore: 6, emergencyContact: { name: '小川 真理', relation: '長女', phone: '080-4455-2233' }, doctor: { name: '山口 恒一', clinic: '港北ホームケア診療所', phone: '045-509-8181' }, medicalHistory: '関節リウマチ、慢性腎不全', allergies: 'なし', currentMeds: 'プレドニゾロン、アセトアミノフェン', visitNotes: 'エレベーターなし3階。転倒歴あり。', status: 'active' },
  { id: 'PT-003', name: '橋本 和子', dob: '1939-08-21', address: '東京都豊島区南池袋3-9-12', pharmacyId: 'PH-04', pharmacyName: '池袋みどり薬局', riskScore: 4, emergencyContact: { name: '橋本 恒一', relation: '夫', phone: '090-9870-1221' }, doctor: { name: '中村 恒一', clinic: '豊島在宅内科', phone: '03-5985-0303' }, medicalHistory: '慢性心不全、貧血', allergies: 'NSAIDs', currentMeds: 'カルベジロール、鉄剤、利尿薬', visitNotes: '夜間はドアチェーン使用。インターホン後に氏名を名乗る。', status: 'active' },
  { id: 'PT-004', name: '清水 恒一', dob: '1951-01-15', address: '東京都中野区白鷺1-25-8', pharmacyId: 'PH-03', pharmacyName: '中野しらさぎ薬局', riskScore: 9, emergencyContact: { name: '清水 麻衣', relation: '次女', phone: '080-7770-3388' }, doctor: { name: '高橋 恒一', clinic: '中野訪問診療センター', phone: '03-5327-2210' }, medicalHistory: 'レビー小体型認知症、高血圧', allergies: 'ラテックス', currentMeds: 'ドネペジル、クエチアピン、アムロジピン', visitNotes: '夕方以降せん妄増悪。家族同席時に説明を優先。', status: 'active' },
  { id: 'PT-005', name: '井上 恒一', dob: '1946-03-29', address: '東京都江東区住吉2-6-11', pharmacyId: 'PH-07', pharmacyName: '江東あおぞら薬局', riskScore: 7, emergencyContact: { name: '井上 美香', relation: '妻', phone: '090-6654-2200' }, doctor: { name: '吉田 恒一', clinic: '江東すみれクリニック', phone: '03-5600-4781' }, medicalHistory: '糖尿病、末梢神経障害', allergies: 'なし', currentMeds: 'インスリングラルギン、ボグリボース', visitNotes: '血糖測定器は寝室棚。低血糖症状時は家族へ即連絡。', status: 'active' },
  { id: 'PT-006', name: '渡辺 美和', dob: '1957-12-07', address: '東京都新宿区西新宿4-32-2', pharmacyId: 'PH-05', pharmacyName: '西新宿いろは薬局', riskScore: 3, emergencyContact: { name: '渡辺 恒一', relation: '弟', phone: '070-4451-7661' }, doctor: { name: '松本 恒一', clinic: '新宿在宅総合診療所', phone: '03-6279-4902' }, medicalHistory: '乳がん術後、慢性疼痛', allergies: '造影剤', currentMeds: 'トラマドール、プレガバリン', visitNotes: '夜間は携帯優先。インターホンに気づきにくい。', status: 'active' },
  { id: 'PT-007', name: '山本 直子', dob: '1944-09-18', address: '東京都世田谷区北沢5-10-3', pharmacyId: 'PH-06', pharmacyName: '世田谷つばさ薬局', riskScore: 5, emergencyContact: { name: '山本 恒一', relation: '長男', phone: '090-2201-8890' }, doctor: { name: '小林 恒一', clinic: '下北沢メディカルホーム', phone: '03-5453-6008' }, medicalHistory: '慢性閉塞性肺疾患、骨粗しょう症', allergies: 'なし', currentMeds: 'チオトロピウム、ビタミンD製剤', visitNotes: '酸素濃縮器あり。停電時対応フローを家族と共有済み。', status: 'active' },
  { id: 'PT-008', name: '森田 恒一', dob: '1950-04-03', address: '東京都武蔵野市吉祥寺本町1-22-9', pharmacyId: 'PH-08', pharmacyName: '吉祥寺つばめ薬局', riskScore: 2, emergencyContact: { name: '森田 由紀', relation: '妻', phone: '080-3098-9011' }, doctor: { name: '藤井 恒一', clinic: '吉祥寺在宅クリニック', phone: '0422-27-0073' }, medicalHistory: '高血圧、脂質異常症', allergies: 'なし', currentMeds: 'ロサルタン、ロスバスタチン', visitNotes: '鍵はキーボックス管理。番号は担当者限定共有。', status: 'active' },
  { id: 'PT-009', name: '林 恒一', dob: '1953-07-09', address: '東京都千代田区神田須田町1-8-4', pharmacyId: 'PH-05', pharmacyName: '西新宿いろは薬局', riskScore: 6, emergencyContact: { name: '林 洋子', relation: '妻', phone: '090-3344-5566' }, doctor: { name: '佐藤 恒一', clinic: '神田中央クリニック', phone: '03-3251-4400' }, medicalHistory: 'COPD、慢性心不全', allergies: 'スルホンアミド', currentMeds: 'カルベジロール、スピリーバ', visitNotes: 'エレベーター利用。酸素投与中。', status: 'active' },
  { id: 'PT-010', name: '高田 恒一', dob: '1960-02-25', address: '東京都渋谷区神宮前2-18-5', pharmacyId: 'PH-09', pharmacyName: '渋谷ひまわり薬局', riskScore: 3, emergencyContact: { name: '高田 由美', relation: '妻', phone: '080-1122-3344' }, doctor: { name: '木村 恒一', clinic: '渋谷在宅内科', phone: '03-5774-3300' }, medicalHistory: '高血圧、軽度糖尿病', allergies: 'なし', currentMeds: 'アムロジピン、メトホルミン', visitNotes: 'オートロック。暗証番号1234。', status: 'active' },
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
}

export const requestData: RequestItem[] = [
  { id: 'RQ-2401', patientId: 'PT-001', pharmacyId: 'PH-01', receivedAt: '22:14', receivedDate: '2026-03-05', patientName: '田中 優子', pharmacyName: '城南みらい薬局', status: 'received', priority: 'high', assignee: '未割当', assigneeId: null, symptom: '悪寒と発熱（38.5℃）', vitalsChange: '体温上昇、脈拍110/分', consciousness: '清明', urgency: '高', notes: '家族より電話あり。食事摂取困難。', slaMet: null },
  { id: 'RQ-2402', patientId: 'PT-002', pharmacyId: 'PH-02', receivedAt: '22:28', receivedDate: '2026-03-05', patientName: '小川 正子', pharmacyName: '港北さくら薬局', status: 'fax_pending', priority: 'normal', assignee: '未割当', assigneeId: null, symptom: '吐き気と食欲低下', vitalsChange: '血圧100/60まで低下', consciousness: 'やや傾眠', urgency: '中', notes: '', slaMet: null },
  { id: 'RQ-2403', patientId: 'PT-009', pharmacyId: 'PH-05', receivedAt: '22:46', receivedDate: '2026-03-05', patientName: '林 恒一', pharmacyName: '西新宿いろは薬局', status: 'assigning', priority: 'high', assignee: '佐藤 健一', assigneeId: 'ST-02', symptom: '呼吸苦の訴え', vitalsChange: 'SpO2 91%へ低下', consciousness: '清明', urgency: '高', notes: '主治医へ連絡済み。', slaMet: true },
  { id: 'RQ-2404', patientId: 'PT-006', pharmacyId: 'PH-05', receivedAt: '23:05', receivedDate: '2026-03-05', patientName: '渡辺 美和', pharmacyName: '西新宿いろは薬局', status: 'assigned', priority: 'normal', assignee: '高橋 奈央', assigneeId: 'ST-03', symptom: '疼痛コントロール不良', vitalsChange: '痛みスコア上昇', consciousness: '清明', urgency: '中', notes: 'レスキュー使用回数増加中。', slaMet: true },
  { id: 'RQ-2405', patientId: 'PT-007', pharmacyId: 'PH-06', receivedAt: '23:22', receivedDate: '2026-03-05', patientName: '山本 直子', pharmacyName: '世田谷つばさ薬局', status: 'fax_received', priority: 'normal', assignee: '未割当', assigneeId: null, symptom: '下痢・脱水傾向', vitalsChange: '尿量減少', consciousness: '清明', urgency: '中', notes: '', slaMet: null },
  { id: 'RQ-2406', patientId: 'PT-004', pharmacyId: 'PH-03', receivedAt: '23:31', receivedDate: '2026-03-05', patientName: '清水 恒一', pharmacyName: '中野しらさぎ薬局', status: 'in_progress', priority: 'high', assignee: '佐藤 健一', assigneeId: 'ST-02', symptom: 'せん妄症状の増悪', vitalsChange: '脈拍増加、発汗', consciousness: '混濁', urgency: '高', notes: '家族同席。環境調整実施中。', slaMet: true },
  { id: 'RQ-2407', patientId: 'PT-003', pharmacyId: 'PH-04', receivedAt: '23:40', receivedDate: '2026-03-05', patientName: '橋本 和子', pharmacyName: '池袋みどり薬局', status: 'arrived', priority: 'normal', assignee: '高橋 奈央', assigneeId: 'ST-03', symptom: '嘔吐後のふらつき', vitalsChange: '血圧92/54', consciousness: '清明', urgency: '中', notes: '', slaMet: true },
  { id: 'RQ-2408', patientId: 'PT-005', pharmacyId: 'PH-07', receivedAt: '23:52', receivedDate: '2026-03-05', patientName: '井上 恒一', pharmacyName: '江東あおぞら薬局', status: 'dispatched', priority: 'normal', assignee: '山口 美咲', assigneeId: 'ST-04', symptom: '血糖コントロール悪化', vitalsChange: '血糖値312mg/dL', consciousness: '清明', urgency: '中', notes: 'インスリン量の確認必要。', slaMet: true },
  { id: 'RQ-2409', patientId: 'PT-010', pharmacyId: 'PH-09', receivedAt: '00:03', receivedDate: '2026-03-06', patientName: '高田 恒一', pharmacyName: '渋谷ひまわり薬局', status: 'completed', priority: 'low', assignee: '山口 美咲', assigneeId: 'ST-04', symptom: '軽度発熱', vitalsChange: '体温37.5℃', consciousness: '清明', urgency: '低', notes: '経過観察で改善。', slaMet: true },
  { id: 'RQ-2410', patientId: 'PT-008', pharmacyId: 'PH-08', receivedAt: '00:11', receivedDate: '2026-03-06', patientName: '森田 恒一', pharmacyName: '吉祥寺つばめ薬局', status: 'completed', priority: 'normal', assignee: '佐々木 翔', assigneeId: 'ST-10', symptom: '夜間痛の増強', vitalsChange: '疼痛スケール 8/10', consciousness: '清明', urgency: '中', notes: '定時鎮痛薬を服用させ、1時間後に改善確認。', slaMet: true },
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
