'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import type { UserRole } from '@/types/database'
import {
  Home, ClipboardList, UserCheck, FileText,
  Building2, Users, CreditCard, BarChart3,
  Shield, Bell, Menu, X, LogOut, Moon,
  Settings, MessageCircle, Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  roles: UserRole[]
  badge?: number
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'ダッシュボード', icon: <Home size={20} />, roles: ['admin', 'pharmacy_admin', 'pharmacy_staff', 'pharmacist'] },
  { href: '/dashboard/requests', label: '依頼管理', icon: <ClipboardList size={20} />, roles: ['admin', 'pharmacy_admin', 'pharmacy_staff', 'pharmacist'] },
  { href: '/dashboard/assign', label: 'アサイン', icon: <UserCheck size={20} />, roles: ['admin', 'pharmacist'] },
  { href: '/dashboard/handovers', label: '申し送り', icon: <FileText size={20} />, roles: ['admin', 'pharmacy_admin', 'pharmacist'] },
  { href: '/dashboard/pharmacies', label: '加盟店管理', icon: <Building2 size={20} />, roles: ['admin'] },
  { href: '/dashboard/staff', label: 'スタッフ管理', icon: <Users size={20} />, roles: ['admin'] },
  { href: '/dashboard/patients', label: '患者情報', icon: <Users size={20} />, roles: ['admin', 'pharmacy_admin', 'pharmacy_staff', 'pharmacist'] },
  { href: '/dashboard/billing', label: '請求管理', icon: <CreditCard size={20} />, roles: ['admin', 'pharmacy_admin'] },
  { href: '/dashboard/reports', label: '実績レポート', icon: <BarChart3 size={20} />, roles: ['admin', 'pharmacy_admin'] },
  { href: '/dashboard/audit', label: '監査ログ', icon: <Shield size={20} />, roles: ['admin'] },
  { href: '/dashboard/shifts', label: 'シフト管理', icon: <Calendar size={20} />, roles: ['admin', 'pharmacist'] },
  { href: '/dashboard/notifications', label: '通知ログ', icon: <Bell size={20} />, roles: ['admin'] },
]

const settingsNavItems: NavItem[] = [
  { href: '/dashboard/settings/notifications', label: '通知設定', icon: <Bell size={20} />, roles: ['admin'] },
  { href: '/dashboard/settings/line', label: 'LINE連携', icon: <MessageCircle size={20} />, roles: ['admin'] },
]

const mobileNavItems = [
  { href: '/dashboard', label: 'ホーム', icon: <Home size={20} />, hasBadge: false },
  { href: '/dashboard/requests', label: '依頼', icon: <ClipboardList size={20} />, hasBadge: false },
  { href: '/dashboard/patients', label: '患者', icon: <Users size={20} />, hasBadge: false },
  { href: '/dashboard/handovers', label: '申し送り', icon: <FileText size={20} />, hasBadge: false },
  { href: '/dashboard/more', label: 'その他', icon: <Menu size={20} />, hasBadge: false },
]

function NightBadge() {
  const [isNight, setIsNight] = useState(false)
  const [countdown, setCountdown] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const h = now.getHours()
      const night = h >= 22 || h < 6
      setIsNight(night)

      if (night) {
        const end = new Date(now)
        if (h >= 22) {
          end.setDate(end.getDate() + 1)
          end.setHours(6, 0, 0, 0)
        } else {
          end.setHours(6, 0, 0, 0)
        }
        const diff = end.getTime() - now.getTime()
        const hrs = Math.floor(diff / 3600000)
        const mins = Math.floor((diff % 3600000) / 60000)
        setCountdown(`${hrs}h ${mins}m`)
      }
    }
    update()
    const timer = setInterval(update, 60000)
    return () => clearInterval(timer)
  }, [])

  if (!isNight) return null

  return (
    <div className="flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 rounded-lg px-3 py-2 text-sm">
      <Moon size={16} className="text-indigo-400" />
      <span className="text-indigo-300 font-medium">夜間モード</span>
      <span className="text-indigo-400 text-xs ml-auto">残り {countdown}</span>
    </div>
  )
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, role, loading, signOut, switchRole } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const filteredNav = navItems.filter(item =>
    role ? item.roles.includes(role) : false
  )

  const filteredSettings = settingsNavItems.filter(item =>
    role ? item.roles.includes(role) : false
  )

  const allNavItems = [...navItems, ...settingsNavItems]
  const pageTitle = allNavItems.find(item => item.href === pathname)?.label ?? 'ダッシュボード'

  const unreadNotifCount = 3 // Mock unread count

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-100">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[260px] bg-[#111827] border-r border-[#2a3553] z-30">
        {/* Brand */}
        <div className="p-5 border-b border-[#2a3553]">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌙</span>
            <div>
              <h1 className="font-bold text-white text-lg">マカセテ在宅</h1>
              <p className="text-xs text-gray-500">夜間薬局コーディネーション</p>
            </div>
          </div>
        </div>

        {/* Night Badge */}
        <div className="px-4 pt-4">
          <NightBadge />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-indigo-600/20 text-indigo-400 font-medium'
                    : 'text-gray-400 hover:bg-[#1a2035] hover:text-gray-200'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}

          {/* Settings section */}
          {filteredSettings.length > 0 && (
            <>
              <div className="pt-4 pb-1 px-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Settings size={12} />
                  設定
                </p>
              </div>
              {filteredSettings.map((item) => {
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      active
                        ? 'bg-indigo-600/20 text-indigo-400 font-medium'
                        : 'text-gray-400 hover:bg-[#1a2035] hover:text-gray-200'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )
              })}
            </>
          )}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-[#2a3553]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-medium">
              {user?.full_name?.[0] ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">{user?.full_name}</p>
              <p className="text-xs text-gray-500 capitalize">{role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full text-gray-400 hover:text-gray-200 hover:bg-[#1a2035]"
          >
            <LogOut size={16} className="mr-2" />
            ログアウト
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#111827] border-r border-[#2a3553] flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-[#2a3553]">
              <span className="font-bold text-white">🌙 マカセテ在宅</span>
              <button onClick={() => setSidebarOpen(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {filteredNav.map((item) => {
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                      active ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-400 hover:bg-[#1a2035]'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )
              })}
              {filteredSettings.length > 0 && (
                <>
                  <div className="pt-4 pb-1 px-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Settings size={12} />
                      設定
                    </p>
                  </div>
                  {filteredSettings.map((item) => {
                    const active = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                          active ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-400 hover:bg-[#1a2035]'
                        }`}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    )
                  })}
                </>
              )}
            </nav>
          </aside>
        </div>
      )}

      {/* Top Bar */}
      <header className="lg:ml-[260px] h-14 bg-[#111827] border-b border-[#2a3553] flex items-center px-4 sticky top-0 z-20">
        <button className="lg:hidden mr-3" onClick={() => setSidebarOpen(true)}>
          <Menu size={20} className="text-gray-400" />
        </button>
        <h2 className="font-semibold text-white">{pageTitle}</h2>
        <div className="ml-3 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400">LIVE</span>
        </div>
        <div className="ml-auto">
          <Link href="/dashboard/notifications" className="relative p-2 text-gray-400 hover:text-gray-200 block">
            <Bell size={18} />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                {unreadNotifCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Demo banner */}
      {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
        <div className="lg:ml-[260px] bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center gap-3 text-xs">
          <span className="text-amber-300 font-medium">🎭 デモモード</span>
          <span className="text-gray-400">ロール切替:</span>
          {(['admin', 'pharmacist', 'pharmacy_admin'] as const).map((r) => (
            <button
              key={r}
              onClick={() => switchRole(r)}
              className={`px-2 py-0.5 rounded text-xs ${
                role === r ? 'bg-indigo-500 text-white' : 'bg-[#1a2035] text-gray-400 hover:text-gray-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Main content */}
      <main className="lg:ml-[260px] p-4 lg:p-6 pb-24 lg:pb-6">
        {children}
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#111827] border-t border-[#2a3553] z-20 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-14">
          {mobileNavItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center gap-0.5 text-xs py-1 px-3 ${
                  active ? 'text-indigo-400' : 'text-gray-500'
                }`}
              >
                <span className="relative">
                  {item.icon}
                  {item.hasBadge && unreadNotifCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[8px] flex items-center justify-center font-bold">
                      {unreadNotifCount}
                    </span>
                  )}
                </span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  )
}
