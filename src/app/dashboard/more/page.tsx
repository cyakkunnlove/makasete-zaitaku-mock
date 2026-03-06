'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import type { UserRole } from '@/types/database'
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
  roles: UserRole[]
}

const menuItems: MenuItem[] = [
  {
    href: '/dashboard/patients',
    label: '患者情報',
    description: '患者マスタの閲覧・検索',
    icon: <Users size={20} className="text-indigo-400" />,
    roles: ['admin', 'pharmacy_admin', 'pharmacy_staff', 'pharmacist'],
  },
  {
    href: '/dashboard/pharmacies',
    label: '加盟店管理',
    description: '薬局の契約・転送設定',
    icon: <Building2 size={20} className="text-indigo-400" />,
    roles: ['admin'],
  },
  {
    href: '/dashboard/staff',
    label: 'スタッフ管理',
    description: 'スタッフの権限・連絡先',
    icon: <Users size={20} className="text-indigo-400" />,
    roles: ['admin'],
  },
  {
    href: '/dashboard/shifts',
    label: 'シフト管理',
    description: '当番スケジュールの管理',
    icon: <Calendar size={20} className="text-indigo-400" />,
    roles: ['admin', 'pharmacist'],
  },
  {
    href: '/dashboard/billing',
    label: '請求管理',
    description: '月次請求・入金確認',
    icon: <CreditCard size={20} className="text-indigo-400" />,
    roles: ['admin', 'pharmacy_admin'],
  },
  {
    href: '/dashboard/reports',
    label: '実績レポート',
    description: '月次KPI・技術料集計',
    icon: <BarChart3 size={20} className="text-indigo-400" />,
    roles: ['admin', 'pharmacy_admin'],
  },
  {
    href: '/dashboard/audit',
    label: '監査ログ',
    description: '操作履歴の追跡',
    icon: <Shield size={20} className="text-indigo-400" />,
    roles: ['admin'],
  },
]

const settingsItems: MenuItem[] = [
  {
    href: '/dashboard/settings/notifications',
    label: '通知設定',
    description: 'イベント毎の通知チャネル設定',
    icon: <Bell size={20} className="text-indigo-400" />,
    roles: ['admin'],
  },
  {
    href: '/dashboard/settings/line',
    label: 'LINE連携',
    description: 'LINE Messaging API設定',
    icon: <MessageCircle size={20} className="text-green-400" />,
    roles: ['admin'],
  },
]

export default function MorePage() {
  const { user, role, signOut } = useAuth()

  const visibleItems = menuItems.filter(item =>
    role ? item.roles.includes(role) : false
  )

  return (
    <div className="space-y-6 text-gray-100">
      {/* User info card */}
      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-lg font-bold">
              {user?.full_name?.[0] ?? '?'}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white">{user?.full_name ?? 'ゲスト'}</p>
              <p className="text-xs text-gray-400 capitalize">{role ?? '未ログイン'}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <div className="flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-lg px-2.5 py-1.5">
              <Moon size={14} className="text-indigo-400" />
              <span className="text-xs text-indigo-300">夜間</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu items */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-300 px-1">メニュー</h3>
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

      {/* Settings section */}
      {role === 'admin' && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-300 px-1 flex items-center gap-1.5">
            <Settings size={14} />
            設定
          </h3>
          {settingsItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="border-[#2a3553] bg-[#1a2035] hover:bg-[#1f2740] transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  {item.icon}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.description}</p>
                  </div>
                  <span className="text-gray-500 text-lg">&#x203A;</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Logout */}
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
