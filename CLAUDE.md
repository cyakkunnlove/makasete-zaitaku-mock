# マカセテ在宅 — バックエンド設計書

## 1. 技術スタック

| レイヤー | 技術 | 理由 |
|---------|------|------|
| **Runtime** | Next.js 14 (App Router) | フロント統合、Vercel デプロイ、API Routes |
| **DB** | PostgreSQL (Supabase) | RLS、リアルタイム、認証統合、SQL柔軟性 |
| **認証** | Supabase Auth | メール+PW、MFA対応、Row Level Security連携 |
| **リアルタイム** | Supabase Realtime | 依頼ステータス変更の即時通知 |
| **ストレージ** | Supabase Storage | FAX画像、申し送り添付 |
| **通知** | LINE Messaging API + Resend (メール) | 薬剤師へのアサイン通知、加盟薬局への申し送り |
| **Cron** | Vercel Cron | SLA監視、リマインド送信 |
| **ホスティング** | Vercel | Next.js最適、CDN、エッジ関数 |

### なぜSupabase（PostgreSQL）か
- Firestoreではなく**RDB**を選択: 依頼→アサイン→対応記録→申し送り→請求が**リレーショナル**に密結合
- Row Level Security (RLS) で**ロール別アクセス制御**がDB層で完結
- SLA計測に**SQL集計**が必要（AVG, PERCENTILE, 時間差計算）
- 監査ログの**トランザクション整合性**が重要（医療データ）

---

## 2. データベース設計

### 2.1 ER図（概要）

```
organizations ─┬── pharmacies ──── pharmacy_users
               │                       │
               ├── staff ──────────────┤
               │                       │
               ├── patients ───────────┤
               │       │               │
               ├── requests ──── assignments
               │       │               │
               ├── handovers ──────────┘
               │
               ├── shift_schedules
               ├── billings
               └── audit_logs
```

### 2.2 テーブル定義

#### `organizations` — 運営組織
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- 'マカセテ在宅'
  legal_name TEXT,                       -- 法人名
  phone TEXT,
  address TEXT,
  night_start TIME DEFAULT '22:00',      -- 夜間開始
  night_end TIME DEFAULT '06:00',        -- 夜間終了
  sla_target_minutes INT DEFAULT 15,     -- SLA目標（折返し分）
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `users` — 全ユーザー（Supabase Auth連携）
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  pharmacy_id UUID REFERENCES pharmacies(id) NULL, -- 加盟薬局所属の場合
  role TEXT NOT NULL CHECK (role IN ('admin', 'pharmacy_admin', 'pharmacy_staff', 'pharmacist')),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  line_user_id TEXT,                     -- LINE通知用
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- admin: 運営事務局（田中、町田、細川）
-- pharmacy_admin: 加盟薬局管理者（山田美咲等）
-- pharmacy_staff: 加盟薬局スタッフ
-- pharmacist: 夜勤薬剤師（佐藤、高橋等）
```

#### `pharmacies` — 加盟薬局
```sql
CREATE TABLE pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,                    -- '○○薬局 本店'
  area TEXT,                             -- '世田谷区'
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  fax TEXT,
  forwarding_phone TEXT,                 -- 電話転送先番号
  forwarding_status TEXT DEFAULT 'off' CHECK (forwarding_status IN ('on', 'off')),
  contract_date DATE,
  saas_monthly_fee INT DEFAULT 30000,    -- SaaS月額（3-5万）
  night_monthly_fee INT DEFAULT 100000,  -- 夜間連携月額（10万）
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
  patient_count INT DEFAULT 0,           -- 在宅患者数（SaaS料金連動）
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `patients` — 患者情報
```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  pharmacy_id UUID REFERENCES pharmacies(id),
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  age INT GENERATED ALWAYS AS (
    EXTRACT(YEAR FROM age(CURRENT_DATE, date_of_birth))
  ) STORED,
  address TEXT NOT NULL,
  phone TEXT,
  emergency_contact_name TEXT NOT NULL,  -- 緊急連絡先（家族）
  emergency_contact_phone TEXT NOT NULL,
  emergency_contact_relation TEXT,       -- '長男'等
  doctor_name TEXT,                      -- 主治医
  doctor_clinic TEXT,                    -- 医療機関名
  doctor_night_phone TEXT,               -- 主治医夜間連絡先
  medical_history TEXT,                  -- 既往歴
  allergies TEXT,                        -- アレルギー
  current_medications TEXT,              -- 現在薬
  visit_notes TEXT,                      -- 訪問時注意事項（鍵、ペット等）
  risk_score INT DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 10), -- リスクスコア
  requires_multi_visit BOOLEAN DEFAULT false, -- 複数名訪問必要
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'incomplete')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `requests` — 夜間依頼
```sql
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  pharmacy_id UUID REFERENCES pharmacies(id),
  patient_id UUID REFERENCES patients(id),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(), -- 受電日時
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
  status TEXT DEFAULT 'received' CHECK (status IN (
    'received',      -- 受電
    'fax_pending',   -- FAX待ち
    'fax_received',  -- FAX受領
    'assigning',     -- アサイン中
    'assigned',      -- アサイン済
    'checklist',     -- チェックリスト確認中
    'dispatched',    -- 出動中
    'arrived',       -- 到着
    'in_progress',   -- 対応中
    'completed',     -- 完了
    'cancelled'      -- キャンセル
  )),
  fax_received_at TIMESTAMPTZ,
  fax_image_url TEXT,                    -- FAX画像パス
  first_callback_at TIMESTAMPTZ,         -- 初回折返し日時（SLA計測用）
  sla_met BOOLEAN,                       -- SLA達成したか（15分以内）
  notes TEXT,                            -- 受電時メモ
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- SLA自動計算トリガー
CREATE OR REPLACE FUNCTION calc_sla() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.first_callback_at IS NOT NULL AND NEW.received_at IS NOT NULL THEN
    NEW.sla_met := (EXTRACT(EPOCH FROM (NEW.first_callback_at - NEW.received_at)) / 60) <= (
      SELECT sla_target_minutes FROM organizations WHERE id = NEW.organization_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calc_sla BEFORE INSERT OR UPDATE ON requests
FOR EACH ROW EXECUTE FUNCTION calc_sla();
```

#### `assignments` — アサイン
```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id),
  pharmacist_id UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,              -- 受諾/辞退した日時
  response TEXT CHECK (response IN ('accepted', 'declined', 'timeout')),
  timeout_minutes INT DEFAULT 10,
  dispatched_at TIMESTAMPTZ,             -- 出動日時
  arrived_at TIMESTAMPTZ,                -- 到着日時
  completed_at TIMESTAMPTZ,              -- 対応完了日時
  travel_distance_km DECIMAL(5,1),
  travel_mode TEXT,                      -- '車', '自転車', '徒歩'
  is_multi_visit BOOLEAN DEFAULT false,  -- 複数名訪問
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `checklists` — 対応チェックリスト
```sql
CREATE TABLE checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id),
  assignment_id UUID REFERENCES assignments(id),
  checklist_type TEXT NOT NULL CHECK (checklist_type IN ('initial', 'routine', 'emergency')),
  items JSONB NOT NULL DEFAULT '[]',
  -- items例: [{"label":"処方箋確認","checked":true},{"label":"患者情報確認","checked":true}]
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `handovers` — 申し送り
```sql
CREATE TABLE handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id),
  assignment_id UUID REFERENCES assignments(id),
  pharmacist_id UUID REFERENCES users(id),
  pharmacy_id UUID REFERENCES pharmacies(id),
  patient_id UUID REFERENCES patients(id),
  -- SBAR形式
  situation TEXT,                         -- S: 状況
  background TEXT,                        -- B: 背景
  assessment TEXT,                        -- A: 評価
  recommendation TEXT,                    -- R: 提言
  -- 定型報告
  arrival_time TIMESTAMPTZ,
  vitals JSONB,                          -- {"temp":"36.4","bp":"132/78","pulse":"72","spo2":"98"}
  medication_administered TEXT,
  patient_condition TEXT,
  -- 自由記述
  free_text TEXT,
  -- 確認
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  reminder_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `shift_schedules` — 当番スケジュール
```sql
CREATE TABLE shift_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  pharmacist_id UUID REFERENCES users(id),
  shift_date DATE NOT NULL,
  shift_type TEXT DEFAULT 'primary' CHECK (shift_type IN ('primary', 'backup')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pharmacist_id, shift_date, shift_type)
);
```

#### `billings` — 請求
```sql
CREATE TABLE billings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  pharmacy_id UUID REFERENCES pharmacies(id),
  billing_month DATE NOT NULL,           -- 請求月（月初日）
  saas_fee INT NOT NULL,                 -- SaaS月額
  night_fee INT NOT NULL,                -- 夜間連携月額
  total_fee INT GENERATED ALWAYS AS (saas_fee + night_fee) STORED,
  tax_amount INT GENERATED ALWAYS AS ((saas_fee + night_fee) / 10) STORED,
  status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'overdue')),
  invoiced_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pharmacy_id, billing_month)
);
```

#### `audit_logs` — 監査ログ
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,                  -- 'request.created', 'assignment.accepted' 等
  target_type TEXT,                      -- 'request', 'patient', 'handover' 等
  target_id UUID,
  details JSONB,                         -- 変更前後の値等
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 自動監査ログ用の汎用トリガー
CREATE OR REPLACE FUNCTION audit_trigger() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (organization_id, user_id, action, target_type, target_id, details)
  VALUES (
    COALESCE(NEW.organization_id, OLD.organization_id),
    auth.uid(),
    TG_ARGV[0] || '.' || lower(TG_OP),
    TG_ARGV[0],
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2.3 インデックス

```sql
-- 高頻度クエリ用
CREATE INDEX idx_requests_status ON requests(organization_id, status);
CREATE INDEX idx_requests_pharmacy ON requests(pharmacy_id, received_at DESC);
CREATE INDEX idx_requests_received ON requests(received_at DESC);
CREATE INDEX idx_assignments_pharmacist ON assignments(pharmacist_id, assigned_at DESC);
CREATE INDEX idx_handovers_pharmacy ON handovers(pharmacy_id, created_at DESC);
CREATE INDEX idx_handovers_unconfirmed ON handovers(confirmed_at) WHERE confirmed_at IS NULL;
CREATE INDEX idx_patients_pharmacy ON patients(pharmacy_id);
CREATE INDEX idx_shift_schedules_date ON shift_schedules(shift_date, shift_type);
CREATE INDEX idx_billings_month ON billings(billing_month, status);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id);
```

---

## 3. API設計

### 3.1 エンドポイント一覧

#### 認証
| Method | Path | 説明 | ロール |
|--------|------|------|--------|
| POST | `/api/auth/login` | ログイン | all |
| POST | `/api/auth/logout` | ログアウト | all |
| GET | `/api/auth/me` | 自分の情報 | all |

#### ダッシュボード
| Method | Path | 説明 | ロール |
|--------|------|------|--------|
| GET | `/api/dashboard` | KPI集計（依頼数、SLA、対応中等） | all |
| GET | `/api/dashboard/timeline` | リアルタイムタイムライン | all |
| GET | `/api/dashboard/staff-status` | 夜勤スタッフ状態 | admin, pharmacist |

#### 依頼管理
| Method | Path | 説明 | ロール |
|--------|------|------|--------|
| GET | `/api/requests` | 依頼一覧（フィルタ対応） | all |
| POST | `/api/requests` | 新規受電起票 | admin |
| GET | `/api/requests/:id` | 依頼詳細 | all |
| PATCH | `/api/requests/:id` | ステータス更新 | admin, pharmacist |
| PATCH | `/api/requests/:id/fax` | FAX受領マーク | admin |

#### アサイン
| Method | Path | 説明 | ロール |
|--------|------|------|--------|
| GET | `/api/requests/:id/assignable` | アサイン可能な薬剤師一覧 | admin |
| POST | `/api/requests/:id/assign` | 薬剤師にアサイン | admin |
| PATCH | `/api/assignments/:id/respond` | 受諾/辞退 | pharmacist |
| PATCH | `/api/assignments/:id/dispatch` | 出動開始 | pharmacist |
| PATCH | `/api/assignments/:id/arrive` | 到着 | pharmacist |
| PATCH | `/api/assignments/:id/complete` | 対応完了 | pharmacist |

#### チェックリスト
| Method | Path | 説明 | ロール |
|--------|------|------|--------|
| GET | `/api/assignments/:id/checklist` | チェックリスト取得 | pharmacist |
| PATCH | `/api/assignments/:id/checklist` | チェック項目更新 | pharmacist |

#### 患者
| Method | Path | 説明 | ロール |
|--------|------|------|--------|
| GET | `/api/patients` | 患者一覧 | all |
| POST | `/api/patients` | 新規登録 | admin, pharmacy_admin |
| GET | `/api/patients/:id` | 患者詳細 | all |
| PATCH | `/api/patients/:id` | 更新 | admin, pharmacy_admin |

#### 加盟薬局
| Method | Path | 説明 | ロール |
|--------|------|------|--------|
| GET | `/api/pharmacies` | 一覧 | admin |
| POST | `/api/pharmacies` | 新規加盟 | admin |
| GET | `/api/pharmacies/:id` | 詳細 | admin, pharmacy_admin(自店のみ) |
| PATCH | `/api/pharmacies/:id` | 更新 | admin |
| PATCH | `/api/pharmacies/:id/forwarding` | 電話転送ON/OFF | admin |

#### 申し送り
| Method | Path | 説明 | ロール |
|--------|------|------|--------|
| GET | `/api/handovers` | 一覧 | all |
| POST | `/api/handovers` | 作成（SBAR形式） | pharmacist |
| GET | `/api/handovers/:id` | 詳細 | all |
| PATCH | `/api/handovers/:id/confirm` | 確認済マーク | pharmacy_admin, admin |

#### スタッフ・シフト
| Method | Path | 説明 | ロール |
|--------|------|------|--------|
| GET | `/api/staff` | スタッフ一覧 | admin |
| GET | `/api/shifts` | シフト一覧（週単位） | admin, pharmacist |
| PUT | `/api/shifts` | シフト更新 | admin |

#### 請求
| Method | Path | 説明 | ロール |
|--------|------|------|--------|
| GET | `/api/billings` | 請求一覧 | admin, pharmacy_admin(自店のみ) |
| POST | `/api/billings/generate` | 月次請求一括生成 | admin |
| PATCH | `/api/billings/:id/paid` | 入金確認 | admin |

#### レポート
| Method | Path | 説明 | ロール |
|--------|------|------|--------|
| GET | `/api/reports/monthly` | 月次実績 | admin, pharmacy_admin |
| GET | `/api/reports/sla` | SLA実績 | admin |
| GET | `/api/reports/export` | CSV出力 | admin |

#### 監査
| Method | Path | 説明 | ロール |
|--------|------|------|--------|
| GET | `/api/audit-logs` | 監査ログ一覧 | admin |

### 3.2 リアルタイムサブスクリプション（Supabase Realtime）

```typescript
// クライアント側
const channel = supabase
  .channel('requests')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'requests',
    filter: `organization_id=eq.${orgId}`
  }, (payload) => {
    // ダッシュボード、依頼一覧をリアルタイム更新
  })
  .subscribe();
```

対象テーブル:
- `requests` — ステータス変更
- `assignments` — アサイン受諾/辞退/出動
- `handovers` — 新規作成、確認済

---

## 4. セキュリティ設計

### 4.1 認証
- **Supabase Auth** (メール+パスワード)
- **MFA必須**: admin, pharmacy_admin ロール
- **セッション**: JWT (1時間有効、リフレッシュトークン7日)
- **パスワードポリシー**: 最低8文字、英数記号混合

### 4.2 認可 (Row Level Security)

```sql
-- 全テーブルにRLS有効化
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE handovers ENABLE ROW LEVEL SECURITY;
-- (他テーブルも同様)

-- admin: 全データ参照可
CREATE POLICY "admin_full_access" ON requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- pharmacy_admin/staff: 自店データのみ
CREATE POLICY "pharmacy_own_data" ON requests
  FOR SELECT USING (
    pharmacy_id IN (
      SELECT pharmacy_id FROM users WHERE id = auth.uid()
    )
  );

-- pharmacist: アサインされた依頼 + 当日の全依頼（アサイン可能性のため）
CREATE POLICY "pharmacist_assigned" ON requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'pharmacist')
    AND (
      id IN (SELECT request_id FROM assignments WHERE pharmacist_id = auth.uid())
      OR status IN ('received', 'fax_received', 'assigning')
    )
  );

-- 患者データ: 加盟薬局は自店患者のみ
CREATE POLICY "patient_pharmacy_access" ON patients
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    OR pharmacy_id IN (SELECT pharmacy_id FROM users WHERE id = auth.uid())
  );
```

### 4.3 データ保護（医療情報）

| 対策 | 実装 |
|------|------|
| **通信暗号化** | TLS 1.3 (Vercel + Supabase標準) |
| **保存時暗号化** | Supabase: AES-256 at rest |
| **患者名の扱い** | DBにはフルネーム保存、API応答ではロール別にマスク可能 |
| **FAX画像** | Supabase Storage、署名付きURL (有効期限15分) |
| **監査ログ** | 全CUD操作を自動記録、削除不可 (APPEND ONLY) |
| **IP制限** | 管理画面はオプションでIP制限可能 (Vercel Edge Middleware) |
| **データ保持** | 依頼データ5年保存 (薬事法準拠)、監査ログ永年 |

### 4.4 API セキュリティ

```typescript
// middleware.ts — 全APIルートに適用
export async function middleware(request: NextRequest) {
  // 1. JWT検証
  const token = request.headers.get('Authorization')?.split('Bearer ')[1];
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Supabase でユーザー取得
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  // 3. ロール検証
  const userProfile = await getUserProfile(user.id);
  request.headers.set('x-user-id', user.id);
  request.headers.set('x-user-role', userProfile.role);
  request.headers.set('x-pharmacy-id', userProfile.pharmacy_id || '');

  // 4. レート制限 (Vercel KV)
  const rateKey = `rate:${user.id}`;
  const count = await kv.incr(rateKey);
  if (count === 1) await kv.expire(rateKey, 60);
  if (count > 100) return NextResponse.json({ error: 'Rate limited' }, { status: 429 });

  return NextResponse.next();
}

// ロール別アクセス制御デコレータ
function requireRole(...roles: string[]) {
  return (handler: Function) => async (req: NextRequest) => {
    const role = req.headers.get('x-user-role');
    if (!roles.includes(role!)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return handler(req);
  };
}
```

### 4.5 SLA監視 Cron

```typescript
// /api/cron/sla-monitor (毎分実行)
export async function GET() {
  // 1. 受電から15分以上経過 & 未折返しの依頼を検出
  const overdue = await db.query(`
    SELECT r.*, p.full_name as patient_name, ph.name as pharmacy_name
    FROM requests r
    JOIN patients p ON r.patient_id = p.id
    JOIN pharmacies ph ON r.pharmacy_id = ph.id
    WHERE r.status IN ('received', 'fax_pending', 'fax_received', 'assigning')
    AND r.first_callback_at IS NULL
    AND r.received_at < now() - interval '15 minutes'
  `);

  // 2. SLA違反アラート送信（LINE/メール）
  for (const req of overdue) {
    await sendAlert('sla_violation', req);
  }

  // 3. アサインタイムアウト（10分無応答）→ 自動再アサイン
  const timedOut = await db.query(`
    SELECT a.* FROM assignments a
    WHERE a.response IS NULL
    AND a.assigned_at < now() - interval '10 minutes'
  `);

  for (const assign of timedOut) {
    await handleAssignmentTimeout(assign);
  }
}

// /api/cron/handover-reminder (毎朝9:00, 11:00)
export async function GET() {
  // 未確認の申し送りにリマインド送信
  const unconfirmed = await db.query(`
    SELECT h.* FROM handovers h
    WHERE h.confirmed_at IS NULL
    AND h.created_at < now() - interval '8 hours'
    AND h.reminder_count < 2
  `);

  for (const h of unconfirmed) {
    await sendReminder(h);
    await db.query('UPDATE handovers SET reminder_count = reminder_count + 1, reminder_sent_at = now() WHERE id = $1', [h.id]);
  }
}
```

---

## 5. 通知設計

| イベント | 対象 | チャネル | タイミング |
|---------|------|---------|-----------|
| 新規受電 | 運営事務局 | プッシュ通知 + 画面Toast | 即時 |
| アサイン | 夜勤薬剤師 | LINE + プッシュ | 即時 |
| アサインタイムアウト | 次の薬剤師 + 運営 | LINE + プッシュ | 10分後 |
| SLA違反 | 運営事務局 | LINE + メール | 15分後 |
| 対応完了 | 運営事務局 | 画面更新 | 即時 |
| 申し送り作成 | 加盟薬局管理者 | メール + LINE | 即時 |
| 申し送り未確認 | 加盟薬局管理者 | メール | 翌朝9:00, 11:00 |
| 請求発行 | 加盟薬局管理者 | メール | 月初 |
| 転送解除リマインド | 加盟薬局 | LINE | 朝5:45 |

---

## 6. フォルダ構成

```
makasete-zaitaku/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              -- サイドバー + トップバー
│   │   ├── page.tsx                -- ダッシュボード
│   │   ├── requests/
│   │   │   ├── page.tsx            -- 依頼一覧
│   │   │   └── [id]/page.tsx       -- 依頼詳細 + アサイン
│   │   ├── patients/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── pharmacies/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── handovers/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── billing/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── staff/page.tsx
│   │   ├── shifts/page.tsx
│   │   └── audit/page.tsx
│   └── api/
│       ├── auth/
│       ├── dashboard/
│       ├── requests/
│       ├── assignments/
│       ├── patients/
│       ├── pharmacies/
│       ├── handovers/
│       ├── billings/
│       ├── shifts/
│       ├── staff/
│       ├── reports/
│       ├── audit-logs/
│       └── cron/
│           ├── sla-monitor/route.ts
│           └── handover-reminder/route.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts               -- ブラウザ用クライアント
│   │   ├── server.ts               -- サーバー用クライアント
│   │   └── admin.ts                -- Service Role用
│   ├── auth/
│   │   └── middleware.ts
│   ├── notifications/
│   │   ├── line.ts
│   │   └── email.ts
│   └── types.ts
├── supabase/
│   └── migrations/
│       ├── 001_create_tables.sql
│       ├── 002_create_rls.sql
│       ├── 003_create_triggers.sql
│       └── 004_create_indexes.sql
└── middleware.ts                     -- 認証 + ロール検証
```

---

## 7. MVP開発ロードマップ

| Phase | 期間 | 内容 |
|-------|------|------|
| **0** | 1週間 | Supabase設定、テーブル作成、RLS、認証 |
| **1** | 2週間 | ダッシュボード、依頼CRUD、アサイン、リアルタイム |
| **2** | 2週間 | 患者管理、加盟薬局管理、チェックリスト、申し送り(SBAR) |
| **3** | 1週間 | 請求管理、レポート、SLA監視Cron |
| **4** | 1週間 | 通知（LINE/メール）、監査ログ、仕上げ |

**想定: 約6-7週間 (1人開発)**

---

*最終更新: 2026-03-05*

---

# 実装指示

## 技術スタック
- Next.js 14 (App Router)
- Supabase (PostgreSQL + Auth + Realtime + Storage)
- shadcn/ui + Tailwind CSS
- Tremor (ダッシュボード用チャート)
- TypeScript

## 実装方針
- 通知はLINE Messaging API + Twilio(電話エスカレーション)のみ
- FAXは手動運用（アップロードUI）
- モバイルファースト（ボトムナビ、カード型リスト）
- ダークモード（夜間利用のため）

## Phase 1（今回実装: Week 1-2相当）
1. Next.js + Supabase プロジェクトセットアップ
2. Supabase マイグレーション（全テーブル + RLS + トリガー + インデックス）
3. 認証（メール+PW、ロール4種、MFA準備）
4. レイアウト（サイドバー + ボトムナビ + トップバー）
5. ダッシュボード（KPI、リアルタイムタイムライン、スタッフ状態）
6. 依頼管理（CRUD、テーブル + モバイルカード、ステータスフロー）
7. アサイン（当番スケジュール、アサイン可能薬剤師一覧、薬剤師受諾/辞退UI）

## UIの参考
モック: https://makasete-zaitaku-mock.vercel.app/
ダークテーマ、Indigo(#6366f1)アクセント

## ディレクトリ構造
BACKEND-DESIGN.md のフォルダ構成に従うこと
