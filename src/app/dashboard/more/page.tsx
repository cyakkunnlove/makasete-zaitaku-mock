'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { canAccess, type PermissionKey } from '@/lib/rbac'
import { getUnifiedRoleLabel } from '@/lib/mock-data'
import { getMockRoleContextLabel } from '@/lib/mock-role-contexts'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { adminCardClass, adminPageClass } from '@/components/admin-ui'
import {
  Building2, Users, CreditCard, BarChart3,
  Shield, LogOut, Moon, Settings, Bell,
  MessageCircle, ArrowLeftRight, Stethoscope
} from 'lucide-react'

interface MenuItem {
  href: string
  label: string
  description: string
  icon: React.ReactNode
  permission: PermissionKey
}

const menuItems: MenuItem[] = [
  {
    href: '/dashboard/patients',
    label: '患者情報',
    description: '患者マスタの閲覧・検索',
    icon: <Users size={20} className="text-indigo-400" />,
    permission: 'patients',
  },
  {
    href: '/dashboard/pharmacies',
    label: '加盟店管理',
    description: '薬局の契約・転送設定',
    icon: <Building2 size={20} className="text-indigo-400" />,
    permission: 'pharmacies',
  },
  {
    href: '/dashboard/staff',
    label: 'スタッフ管理',
    description: 'スタッフの権限・連絡先',
    icon: <Users size={20} className="text-indigo-400" />,
    permission: 'staff',
  },
  {
    href: '/dashboard/medical-masters',
    label: '病院・医師管理',
    description: '候補の確認と軽い整理',
    icon: <Stethoscope size={20} className="text-sky-400" />,
    permission: 'patients',
  },
  {
    href: '/dashboard/billing',
    label: '請求管理',
    description: '月次請求・入金確認',
    icon: <CreditCard size={20} className="text-indigo-400" />,
    permission: 'billing',
  },
  {
    href: '/dashboard/reports',
    label: '実績レポート',
    description: '月次KPI・技術料集計',
    icon: <BarChart3 size={20} className="text-indigo-400" />,
    permission: 'reports',
  },
  {
    href: '/dashboard/audit',
    label: '監査ログ',
    description: '操作履歴の追跡',
    icon: <Shield size={20} className="text-indigo-400" />,
    permission: 'audit',
  },
]

const settingsItems: MenuItem[] = [
  {
    href: '/dashboard/account-security',
    label: 'アカウント / セキュリティ',
    description: 'パスキー設定・ログイン方針の確認',
    icon: <Shield size={20} className="text-emerald-400" />,
    permission: 'dashboard',
  },
  {
    href: '/dashboard/role-chooser',
    label: '立場を切り替える',
    description: '現在の立場を切り替える',
    icon: <ArrowLeftRight size={20} className="text-sky-400" />,
    permission: 'dashboard',
  },
  {
    href: '/dashboard/settings/notifications',
    label: '通知設定',
    description: 'イベント毎の通知チャネル設定',
    icon: <Bell size={20} className="text-indigo-400" />,
    permission: 'settings',
  },
  {
    href: '/dashboard/settings/line',
    label: 'LINE連携',
    description: 'LINE Messaging API設定',
    icon: <MessageCircle size={20} className="text-green-400" />,
    permission: 'settings',
  },
]

function canViewSettingsItem(role: string | null | undefined, href: string) {
  if (!role) return false

  if (href === '/dashboard/settings/notifications') return role === 'regional_admin' || role === 'pharmacy_admin'
  if (href === '/dashboard/settings/line') return role === 'regional_admin'
  if (href === '/dashboard/account-security') return true
  if (href === '/dashboard/role-chooser') return true

  return false
}

export default function MorePage() {
  const { user, role, signOut, authMode, activeRoleContext } = useAuth()

  const visibleItems = menuItems
    .filter((item) => canAccess(role, item.permission))
    .map((item) => {
      if (item.href === '/dashboard/billing') {
        if (role === 'pharmacy_admin' || role === 'pharmacy_staff') {
          return { ...item, label: '回収管理', description: '患者請求・未回収・入金確認' }
        }
        if (role === 'system_admin') {
          return { ...item, label: '加盟店請求', description: '加盟店向け月次請求・入金確認' }
        }
      }
      return item
    })
  const visibleSettings = settingsItems
    .filter((item) => canAccess(role, item.permission))
    .filter((item) => canViewSettingsItem(role, item.href))

  return (
    <div className={`${adminPageClass} space-y-6`}>
      <Card className={adminCardClass}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-lg font-bold text-white">
              {user?.full_name?.[0] ?? '?'}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">{user?.full_name ?? 'ゲスト'}</p>
              <p className="text-xs text-slate-500">{activeRoleContext ? getMockRoleContextLabel(activeRoleContext) : role ? getUnifiedRoleLabel(role) : '未ログイン'}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
              {authMode && <p className="text-[10px] text-slate-400">auth: {authMode}</p>}
              {activeRoleContext && <p className="text-[10px] text-slate-400">assignment: {activeRoleContext.assignmentId}</p>}
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/20 px-2.5 py-1.5">
              <Moon size={14} className="text-indigo-400" />
              <span className="text-xs text-indigo-300">稼働中</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {activeRoleContext && (
        <Card className={adminCardClass}>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">現在の立場</p>
              <p className="mt-1 text-xs text-slate-500">{getMockRoleContextLabel(activeRoleContext)}</p>
            </div>
            <Button asChild variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
              <Link href="/dashboard/role-chooser">立場を切り替える</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <div className="px-1">
          <h3 className="text-sm font-semibold text-slate-500">メニュー</h3>
          <p className="mt-1 text-xs text-slate-500">日常的に確認する管理画面と、補助メニューをまとめています。</p>
        </div>
        {visibleItems.length === 0 && (
          <Card className={adminCardClass}>
            <CardContent className="p-4 text-sm text-slate-500">現在のロールで表示できる追加メニューはありません。</CardContent>
          </Card>
        )}
        {visibleItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className={`${adminCardClass} cursor-pointer transition-colors hover:bg-slate-50`}>
              <CardContent className="flex items-center gap-3 p-4">
                {item.icon}
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </div>
                <span className="text-lg text-slate-400">›</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {visibleSettings.length > 0 && (
        <div className="space-y-2">
          <div className="px-1">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
              <Settings size={14} />
              設定
            </h3>
            <p className="mt-1 text-xs text-slate-500">通知や認証など、たまに見直す項目をまとめています。</p>
          </div>
          {visibleSettings.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className={`${adminCardClass} cursor-pointer transition-colors hover:bg-slate-50`}>
                <CardContent className="flex items-center gap-3 p-4">
                  {item.icon}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.description}</p>
                  </div>
                  <span className="text-lg text-slate-400">›</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h3 className="flex items-center gap-1.5 px-1 text-sm font-semibold text-slate-500">
          <Shield size={14} />
          セキュリティ
        </h3>
        <Card className={adminCardClass}>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-start gap-3">
              <Shield size={18} className="mt-0.5 text-emerald-500" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-slate-900">パスキー設定</p>
                <p className="text-xs leading-5 text-slate-500">
                  パスキーの追加は「アカウント / セキュリティ」画面からも開始できます。登録時はアプリ内だけで完結せず、
                  Cognito の認証画面に移動して、必要に応じて再認証後に設定を進めます。
                  登録後は、少なくとも現時点では Eメール入力後にパスキーでログインできます。
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              <p>おすすめ手順</p>
              <ol className="mt-2 list-decimal space-y-1 pl-4">
                <li>まず「アカウント / セキュリティ」画面で流れを確認する</li>
                <li>「パスキーを追加」から Cognito の認証画面へ進む</li>
                <li>必要に応じて再認証する</li>
                <li>登録後、次回以降のログイン動作を確認する</li>
              </ol>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                <Link href="/dashboard/account-security">アカウント / セキュリティを開く</Link>
              </Button>
              <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-500">
                <a href="/api/auth/passkey-setup">パスキー設定を開く</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2 pt-2">
        <Button
          variant="ghost"
          onClick={signOut}
          className="h-12 w-full justify-start gap-3 rounded-xl border border-rose-200 bg-white text-rose-500 hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut size={18} />
          <span className="text-sm">ログアウト</span>
        </Button>
      </div>
    </div>
  )
}
