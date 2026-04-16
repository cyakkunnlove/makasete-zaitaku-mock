'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import {
  Home, ClipboardList, UserCheck, FileText,
  Building2, Users, CreditCard, BarChart3,
  Shield, Bell, Menu, X, LogOut, Moon,
  Settings, MessageCircle, Calendar, Search, Hospital
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AccessDenied } from '@/components/access-denied'
import { canAccess, type PermissionKey } from '@/lib/rbac'
import { getMockRoleContextLabel } from '@/lib/mock-role-contexts'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  permission: PermissionKey
  badge?: number
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'ダッシュボード', icon: <Home size={20} />, permission: 'dashboard' },
  { href: '/dashboard/requests', label: '依頼管理', icon: <ClipboardList size={20} />, permission: 'requests' },
  { href: '/dashboard/assign', label: 'アサイン', icon: <UserCheck size={20} />, permission: 'assign' },
  { href: '/dashboard/handovers', label: '申し送り', icon: <FileText size={20} />, permission: 'handovers' },
  { href: '/dashboard/pharmacies', label: '加盟店管理', icon: <Building2 size={20} />, permission: 'pharmacies' },
  { href: '/dashboard/staff', label: 'スタッフ管理', icon: <Users size={20} />, permission: 'staff' },
  { href: '/dashboard/patients', label: '患者情報', icon: <Users size={20} />, permission: 'patients' },
  { href: '/dashboard/calendar', label: 'カレンダー', icon: <Calendar size={20} />, permission: 'patients' },
  { href: '/dashboard/night-patients', label: '夜間患者検索', icon: <Search size={20} />, permission: 'nightPatients' },
  { href: '/dashboard/billing', label: '請求管理', icon: <CreditCard size={20} />, permission: 'billing' },
  { href: '/dashboard/reports', label: '実績レポート', icon: <BarChart3 size={20} />, permission: 'reports' },
  { href: '/dashboard/audit', label: '監査ログ', icon: <Shield size={20} />, permission: 'audit' },
  { href: '/dashboard/shifts', label: 'シフト管理', icon: <Calendar size={20} />, permission: 'shifts' },
  { href: '/dashboard/notifications', label: '通知ログ', icon: <Bell size={20} />, permission: 'notifications' },
]

const settingsNavItems: NavItem[] = [
  { href: '/dashboard/settings/pharmacy', label: '薬局設定', icon: <Hospital size={20} />, permission: 'settings' },
  { href: '/dashboard/settings/region', label: '地域設定', icon: <Settings size={20} />, permission: 'settings' },
  { href: '/dashboard/settings/notifications', label: '通知設定', icon: <Bell size={20} />, permission: 'settings' },
  { href: '/dashboard/settings/line', label: 'LINE連携', icon: <MessageCircle size={20} />, permission: 'settings' },
]

function canViewSettingsItem(role: string | null | undefined, href: string) {
  if (!role) return false

  if (href === '/dashboard/settings/pharmacy') return role === 'pharmacy_admin' || role === 'regional_admin'
  if (href === '/dashboard/settings/region') return role === 'regional_admin'
  if (href === '/dashboard/settings/notifications') return role === 'regional_admin' || role === 'pharmacy_admin'
  if (href === '/dashboard/settings/line') return role === 'regional_admin'

  return false
}

const mobileNavItems: NavItem[] = [
  { href: '/dashboard', label: 'ホーム', icon: <Home size={20} />, permission: 'dashboard' },
  { href: '/dashboard/requests', label: '依頼', icon: <ClipboardList size={20} />, permission: 'requests' },
  { href: '/dashboard/patients', label: '患者', icon: <Users size={20} />, permission: 'patients' },
  { href: '/dashboard/handovers', label: '申し送り', icon: <FileText size={20} />, permission: 'handovers' },
  { href: '/dashboard/more', label: 'その他', icon: <Menu size={20} />, permission: 'more' },
]

function getPathPermission(pathname: string): PermissionKey {
  if (pathname.startsWith('/dashboard/settings/')) return 'settings'
  if (pathname.startsWith('/dashboard/requests/')) return 'requestDetail'
  if (pathname.startsWith('/dashboard/requests')) return 'requests'
  if (pathname.startsWith('/dashboard/handovers')) return 'handovers'
  if (pathname.startsWith('/dashboard/night-patients')) return 'nightPatients'
  if (pathname.startsWith('/dashboard/calendar')) return 'patients'
  if (pathname.startsWith('/dashboard/patients')) return 'patients'
  if (pathname.startsWith('/dashboard/pharmacies')) return 'pharmacies'
  if (pathname.startsWith('/dashboard/staff')) return 'staff'
  if (pathname.startsWith('/dashboard/billing')) return 'billing'
  if (pathname.startsWith('/dashboard/reports')) return 'reports'
  if (pathname.startsWith('/dashboard/audit')) return 'audit'
  if (pathname.startsWith('/dashboard/notifications')) return 'notifications'
  if (pathname.startsWith('/dashboard/onboarding')) return 'onboarding'
  if (pathname.startsWith('/dashboard/assign')) return 'assign'
  if (pathname.startsWith('/dashboard/shifts')) return 'shifts'
  if (pathname.startsWith('/dashboard/more')) return 'more'
  return 'dashboard'
}

function NightBadge({ role }: { role: string | null | undefined }) {
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

  const label = role === 'night_pharmacist' ? '夜間対応時間' : '時間外表示'

  return (
    <div className="flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/20 px-3 py-2 text-sm">
      <Moon size={16} className="text-indigo-400" />
      <span className="font-medium text-indigo-300">{label}</span>
      <span className="ml-auto text-xs text-indigo-400">残り {countdown}</span>
    </div>
  )
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, role, loading, signOut, authMode, requiresReverification, activeRoleContext } = useAuth()
  const unreadFaxCount = 2
  const candidateCount = 3
  const pharmacyStaffStats = {
    total: 8,
    completed: 5,
    inProgress: 2,
  }
  const pharmacyAdminStats = {
    requests: 6,
    preparing: 3,
    inProgress: 2,
  }
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const filteredNav = navItems
    .filter((item) => canAccess(role, item.permission))
    .filter((item) => item.href !== '/dashboard/handovers')
    .map((item) => {
      if (item.href === '/dashboard/billing') {
        if (role === 'pharmacy_admin' || role === 'pharmacy_staff') return { ...item, label: '回収管理' }
        if (role === 'system_admin') return { ...item, label: '加盟店請求' }
      }
      return item
    })

  const filteredSettings = settingsNavItems
    .filter((item) => canAccess(role, item.permission))
    .filter((item) => canViewSettingsItem(role, item.href))

  const visibleMobileNavItems = mobileNavItems.filter((item) => {
    if (!canAccess(role, item.permission)) return false
    if (role === 'night_pharmacist' && item.href === '/dashboard/patients') return false
    if (item.href === '/dashboard/handovers') return false
    return true
  })

  const allNavItems = [...filteredNav, ...filteredSettings]
  const isAdminShell = role === 'system_admin' || role === 'regional_admin'
  const isFieldShell = role === 'pharmacy_admin' || role === 'pharmacy_staff'
  const shellBgClass = isAdminShell ? 'bg-slate-100 text-slate-900' : isFieldShell ? 'bg-slate-50 text-slate-950' : 'bg-[#0a0e1a] text-gray-100'
  const sidebarBgClass = isAdminShell ? 'bg-slate-950 border-slate-800' : isFieldShell ? 'bg-white border-slate-200' : 'bg-[#111827] border-[#2a3553]'
  const topBarBgClass = isAdminShell ? 'bg-white border-slate-200' : isFieldShell ? 'bg-white/95 border-slate-200 backdrop-blur' : 'bg-[#111827] border-[#2a3553]'
  const isNavActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`))
  const handleSidebarNavigate = (href: string) => {
    if (pathname === href) {
      setSidebarOpen(false)
      return
    }
    setSidebarOpen(false)
    router.push(href)
  }
  const pageTitle = allNavItems.find((item) => isNavActive(item.href))?.label ?? 'ダッシュボード'
  const currentPermission = getPathPermission(pathname)

  const unreadNotifCount = 3 // Mock unread count

  useEffect(() => {
    if (loading) return
    if (authMode !== 'cognito') return
    if (!requiresReverification) return
    if (pathname.startsWith('/dashboard/account-security')) return

    router.replace(`/dashboard/account-security?reauth=required&next=${encodeURIComponent(pathname)}`)
  }, [authMode, loading, pathname, requiresReverification, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">読み込み中...</div>
      </div>
    )
  }

  if (authMode === 'cognito' && requiresReverification && !pathname.startsWith('/dashboard/account-security')) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center px-4 text-center">
        <div className="max-w-md rounded-xl border border-[#2a3553] bg-[#111827] p-6 text-gray-200">
          <p className="text-base font-semibold text-white">再認証が必要です</p>
          <p className="mt-2 text-sm leading-6 text-gray-400">12時間を超えたため、セキュリティ確認画面へ移動しています。</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('min-h-screen', shellBgClass)}>
      {/* Sidebar - Desktop */}
      <aside className={cn('hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[260px] border-r z-30', sidebarBgClass)}>
        {/* Brand */}
        <div className={cn('p-5 border-b', isAdminShell ? 'border-slate-800' : 'border-[#2a3553]')}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌙</span>
            <div>
              <h1 className={cn('text-lg font-bold', isFieldShell ? 'text-slate-900' : 'text-white')}>マカセテ在宅</h1>
              <p className={cn('text-xs', isFieldShell ? 'text-slate-600' : 'text-gray-500')}>在宅訪問オペレーション</p>
            </div>
          </div>
        </div>

        {/* Night Badge */}
        <div className="px-4 pt-4">
          <NightBadge role={role} />
        </div>

        {role === 'night_pharmacist' && (
          <div className="px-4 pt-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-[#2a3553] bg-[#1a2035] px-3 py-2 text-center">
                <p className="text-base font-bold text-rose-400">{unreadFaxCount}</p>
                <p className="text-[10px] text-gray-500">未確認FAX</p>
              </div>
              <div className="rounded-lg border border-[#2a3553] bg-[#1a2035] px-3 py-2 text-center">
                <p className="text-base font-bold text-indigo-300">{candidateCount}</p>
                <p className="text-[10px] text-gray-500">照合候補</p>
              </div>
            </div>
          </div>
        )}

        {role === 'pharmacy_staff' && (
          <div className="px-4 pt-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-center shadow-sm">
                <p className="text-base font-bold text-slate-900">{pharmacyStaffStats.total}</p>
                <p className="text-[10px] font-medium text-slate-600">本日合計</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-center shadow-sm">
                <p className="text-base font-bold text-emerald-600">{pharmacyStaffStats.completed}</p>
                <p className="text-[10px] font-medium text-slate-600">訪問済</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-center shadow-sm">
                <p className="text-base font-bold text-amber-600">{pharmacyStaffStats.inProgress}</p>
                <p className="text-[10px] font-medium text-slate-600">対応中</p>
              </div>
            </div>
          </div>
        )}

        {role === 'pharmacy_admin' && (
          <div className="px-4 pt-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-center shadow-sm">
                <p className="text-base font-bold text-slate-900">{pharmacyAdminStats.requests}</p>
                <p className="text-[10px] font-medium text-slate-600">支給依頼</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-center shadow-sm">
                <p className="text-base font-bold text-indigo-600">{pharmacyAdminStats.preparing}</p>
                <p className="text-[10px] font-medium text-slate-600">対応準備中</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-center shadow-sm">
                <p className="text-base font-bold text-amber-600">{pharmacyAdminStats.inProgress}</p>
                <p className="text-[10px] font-medium text-slate-600">対応中</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNav
          .filter((item) => {
            if (role === 'night_pharmacist' && item.href === '/dashboard/patients') return false
            if (item.href === '/dashboard/handovers') return false
            if ((role === 'pharmacy_staff' || role === 'pharmacy_admin') && item.href === '/dashboard/night-patients') return false
            if ((role === 'regional_admin' || role === 'night_pharmacist') && item.href === '/dashboard/calendar') return false
            return true
          })
          .map((item) => {
            const active = isNavActive(item.href)
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => handleSidebarNavigate(item.href)}
                className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                  active
                    ? isFieldShell ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'bg-indigo-600/20 text-indigo-400 font-medium'
                    : isFieldShell ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-950' : 'text-gray-400 hover:bg-[#1a2035] hover:text-gray-200'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            )
          })}

          {/* Settings section */}
          {filteredSettings.length > 0 && (
            <>
              <div className="pt-4 pb-1 px-3">
                <p className={cn('flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider', isFieldShell ? 'text-slate-500' : 'text-gray-500')}>
                  <Settings size={12} />
                  設定
                </p>
              </div>
              {filteredSettings.map((item) => {
                const active = isNavActive(item.href)
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => handleSidebarNavigate(item.href)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                      active
                        ? isFieldShell ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'bg-indigo-600/20 text-indigo-400 font-medium'
                        : isFieldShell ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-950' : 'text-gray-400 hover:bg-[#1a2035] hover:text-gray-200'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
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
              <p className={cn('truncate text-sm font-medium', isFieldShell ? 'text-slate-900' : 'text-gray-200')}>{user?.full_name}</p>
              <p className={cn('text-xs', isFieldShell ? 'text-slate-600' : 'text-gray-500')}>{activeRoleContext ? getMockRoleContextLabel(activeRoleContext) : role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className={cn('w-full', isFieldShell ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'text-gray-400 hover:bg-[#1a2035] hover:text-gray-200')}
          >
            <LogOut size={16} className="mr-2" />
            ログアウト
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 z-40 transition-opacity duration-200 ease-out',
          sidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        aria-hidden={!sidebarOpen}
      >
        <div className="absolute inset-0 bg-black/60 transition-opacity duration-200 ease-out" onClick={() => setSidebarOpen(false)} />
        <aside
          className={cn(
            'absolute left-0 top-0 bottom-0 flex w-[280px] flex-col border-r transition-transform duration-250 ease-out',
            isFieldShell ? 'border-slate-200 bg-white' : 'border-[#2a3553] bg-[#111827]',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className={cn('p-4 flex items-center justify-between border-b', isFieldShell ? 'border-slate-200' : 'border-[#2a3553]')}>
            <span className={cn('font-bold', isFieldShell ? 'text-slate-900' : 'text-white')}>🌙 マカセテ在宅</span>
            <button onClick={() => setSidebarOpen(false)}>
              <X size={20} className={isFieldShell ? 'text-slate-500' : 'text-gray-400'} />
            </button>
          </div>
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {filteredNav.map((item) => {
              const active = isNavActive(item.href)
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => handleSidebarNavigate(item.href)}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                    active ? (isFieldShell ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'bg-indigo-600/20 text-indigo-400') : (isFieldShell ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-950' : 'text-gray-400 hover:bg-[#1a2035]')
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              )
            })}
            {filteredSettings.length > 0 && (
              <>
                <div className="pt-4 pb-1 px-3">
                  <p className={cn('flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider', isFieldShell ? 'text-slate-500' : 'text-gray-500')}>
                    <Settings size={12} />
                    設定
                  </p>
                </div>
                {filteredSettings.map((item) => {
                  const active = isNavActive(item.href)
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => handleSidebarNavigate(item.href)}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                        active ? (isFieldShell ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'bg-indigo-600/20 text-indigo-400') : (isFieldShell ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-950' : 'text-gray-400 hover:bg-[#1a2035]')
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  )
                })}
              </>
            )}
          </nav>
        </aside>
      </div>

      {/* Top Bar */}
      <header className={cn('lg:ml-[260px] h-14 border-b flex items-center px-4 sticky top-0 z-20', topBarBgClass)}>
        <button className={cn('mr-3 rounded-lg p-2 transition-all duration-150 lg:hidden', isAdminShell ? 'hover:bg-slate-100' : isFieldShell ? 'hover:bg-slate-100 active:scale-95' : 'hover:bg-[#1a2035]')} onClick={() => setSidebarOpen(true)}>
          <Menu size={20} className={isAdminShell ? 'text-slate-500' : isFieldShell ? 'text-slate-600' : 'text-gray-400'} />
        </button>
        <h2 className={cn('font-semibold', isAdminShell || isFieldShell ? 'text-slate-900' : 'text-white')}>{pageTitle}</h2>
        <div className="ml-3 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-500">LIVE</span>
        </div>
        <div className="ml-auto">
          {canAccess(role, 'notifications') && (
            <Link href="/dashboard/notifications" className={cn('relative block rounded-lg p-2 transition-all duration-150', isAdminShell || isFieldShell ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-800 active:scale-95' : 'text-gray-400 hover:text-gray-200')}>
              <Bell size={18} />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {unreadNotifCount}
                </span>
              )}
            </Link>
          )}
        </div>
      </header>

      {authMode === 'mock' && (
        <div className="lg:ml-[260px] border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          🎭 デモログイン中です。画面確認用の暫定モードです。
          {activeRoleContext && <span className="ml-2 text-amber-700">現在の立場: {getMockRoleContextLabel(activeRoleContext)}</span>}
        </div>
      )}

      {/* Main content */}
      <main className={cn('lg:ml-[260px] p-4 lg:p-6 pb-24 lg:pb-6', isAdminShell || isFieldShell ? 'bg-slate-50' : '')}>
        {canAccess(role, currentPermission) ? (
          children
        ) : (
          <AccessDenied description="現在のロールではこの画面を閲覧できません。必要な業務だけに絞って表示しています。" />
        )}
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className={cn('lg:hidden fixed bottom-0 left-0 right-0 z-20 border-t pb-[env(safe-area-inset-bottom)]', isFieldShell ? 'border-slate-200 bg-white/95 backdrop-blur' : 'bg-[#111827] border-[#2a3553]')}>
        <div className="flex items-center justify-around h-16 px-2">
          {visibleMobileNavItems.map((item) => {
            const active = isNavActive(item.href)
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => handleSidebarNavigate(item.href)}
                className={cn(
                  'relative flex min-w-[64px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs transition-all duration-150 active:scale-[0.97]',
                  isFieldShell
                    ? active
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100'
                      : 'text-slate-600 active:bg-slate-100'
                    : active
                      ? 'text-indigo-400'
                      : 'text-gray-500'
                )}
              >
                <span className="relative">
                  {item.icon}
                </span>
                <span className={cn('font-medium', active ? 'text-current' : isFieldShell ? 'text-slate-700' : 'text-current')}>{item.label}</span>
              </button>
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
