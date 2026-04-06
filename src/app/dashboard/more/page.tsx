'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { canAccess, type PermissionKey } from '@/lib/rbac'
import { getUnifiedRoleLabel } from '@/lib/mock-data'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Building2, Users, CreditCard, BarChart3,
  Shield, LogOut, Moon, Settings, Bell,
  MessageCircle, Calendar
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
    href: '/dashboard/shifts',
    label: 'シフト管理',
    description: '当番スケジュールの管理',
    icon: <Calendar size={20} className="text-indigo-400" />,
    permission: 'shifts',
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

export default function MorePage() {
  const { user, role, signOut, authMode } = useAuth()

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
  const visibleSettings = settingsItems.filter((item) => canAccess(role, item.permission))

  return (
    <div className="space-y-6 text-gray-100">
      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-lg font-bold">
              {user?.full_name?.[0] ?? '?'}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white">{user?.full_name ?? 'ゲスト'}</p>
              <p className="text-xs text-gray-400">{role ? getUnifiedRoleLabel(role) : '未ログイン'}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
              {authMode && <p className="text-[10px] text-gray-500">auth: {authMode}</p>}
            </div>
            <div className="flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-lg px-2.5 py-1.5">
              <Moon size={14} className="text-indigo-400" />
              <span className="text-xs text-indigo-300">夜間</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-300 px-1">メニュー</h3>
        {visibleItems.length === 0 && (
          <Card className="border-[#2a3553] bg-[#1a2035]">
            <CardContent className="p-4 text-sm text-gray-400">現在のロールで表示できる追加メニューはありません。</CardContent>
          </Card>
        )}
        {visibleItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="border-[#2a3553] bg-[#1a2035] hover:bg-[#1f2740] transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-3 p-4">
                {item.icon}
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.description}</p>
                </div>
                <span className="text-gray-500 text-lg">›</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {visibleSettings.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-300 px-1 flex items-center gap-1.5">
            <Settings size={14} />
            設定
          </h3>
          {visibleSettings.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="border-[#2a3553] bg-[#1a2035] hover:bg-[#1f2740] transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  {item.icon}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.description}</p>
                  </div>
                  <span className="text-gray-500 text-lg">›</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-300 px-1 flex items-center gap-1.5">
          <Shield size={14} />
          セキュリティ
        </h3>
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardContent className="space-y-4 p-4">
            <div className="flex items-start gap-3">
              <Shield size={18} className="mt-0.5 text-emerald-400" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-white">パスキー設定</p>
                <p className="text-xs leading-5 text-gray-400">
                  まずは Cognito の managed login からアカウント設定に入り、パスキーを登録する運用にします。
                  現時点では role / 所属の正本は Supabase 側に置き、認証とパスキーは Cognito 側に寄せる方針です。
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-100/90">
              <p>おすすめ手順</p>
              <ol className="mt-2 list-decimal space-y-1 pl-4">
                <li>下のボタンから Cognito ログイン画面を開く</li>
                <li>パスワードでログインする</li>
                <li>ログイン後の Cognito アカウント設定からパスキーを追加する</li>
                <li>追加後、次回以降はパスキー優先でログインできるか確認する</li>
              </ol>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-500">
                <a href="/api/auth/passkey-setup">Cognito でパスキー設定を開く</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2 pt-2">
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start gap-3 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-12"
        >
          <LogOut size={18} />
          <span className="text-sm">ログアウト</span>
        </Button>
      </div>
    </div>
  )
}
