// Mock user for development without Supabase
import type { User } from '@/types/database'

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
    pharmacy_id: 'pharm-001',
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

// Default demo user key (change to test different roles)
export const DEMO_ROLE = 'admin'
