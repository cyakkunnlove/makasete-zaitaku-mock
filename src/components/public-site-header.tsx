'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  { label: 'サービスの特徴', href: '/#features' },
  { label: '市場背景', href: '/#market' },
  { label: '対象薬局', href: '/#support' },
  { label: '導入の流れ', href: '/#flow' },
  { label: 'FAQ', href: '/#faq' },
  { label: '料金', href: '/pricing' },
  { label: '会社概要', href: '/company' },
]

export function PublicSiteHeader({ activeHref }: { activeHref?: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link className="flex min-w-0 flex-1 items-center gap-3 text-left lg:flex-none" href="/" aria-label="任せて在宅ホーム">
          <Image
            src="/homepage-assets/from-reference/logo-mark.jpg"
            alt="任せて在宅ロゴ"
            width={40}
            height={40}
            className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10"
          />
          <span className="min-w-0">
            <span className="block truncate text-[11px] font-semibold text-slate-600 sm:text-xs">在宅薬局の立ち上げ・運用支援</span>
            <span className="block truncate text-xl font-bold tracking-wide text-blue-950 sm:text-2xl">任せて在宅</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-800 lg:flex xl:gap-7">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={item.href === activeHref ? 'border-b-2 border-blue-800 pb-2 text-blue-900' : 'homepage-nav-link hover:text-blue-700'}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button asChild variant="ghost" className="h-11 rounded-md px-4 font-semibold text-blue-950 hover:bg-blue-50 hover:text-blue-800">
            <Link href="/login"><LogIn className="mr-2 h-4 w-4" />ログイン</Link>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-md border-blue-900 !bg-white px-5 font-semibold !text-blue-950 hover:!bg-blue-50">
            <Link href="/contact">資料ダウンロード</Link>
          </Button>
          <Button asChild className="h-11 rounded-md bg-blue-800 px-5 font-semibold text-white hover:bg-blue-700">
            <Link href="/contact">お問い合わせ</Link>
          </Button>
        </div>

        <button
          type="button"
          aria-label={mobileMenuOpen ? 'メニューを閉じる' : 'メニューを開く'}
          aria-expanded={mobileMenuOpen}
          className={`hamburger-button fixed right-4 top-[18px] z-[60] inline-flex shrink-0 lg:hidden ${mobileMenuOpen ? 'is-open' : ''}`}
          onClick={() => setMobileMenuOpen((current) => !current)}
        >
          <span className="hamburger-bar" />
          <span className="hamburger-bar" />
          <span className="hamburger-bar" />
        </button>
      </div>

      <div className={`homepage-mobile-menu lg:hidden ${mobileMenuOpen ? 'is-open' : ''}`}>
        <div className="homepage-mobile-menu-panel">
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg shadow-slate-900/10">
            <div className="grid gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="homepage-mobile-link rounded-md px-3 py-3 text-left text-sm font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3">
              <Button asChild variant="ghost" className="h-11 justify-center rounded-md font-semibold text-blue-950 hover:bg-blue-50 hover:text-blue-800">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}><LogIn className="mr-2 h-4 w-4" />ログイン</Link>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-md border-blue-900 !bg-white font-semibold !text-blue-950 hover:!bg-blue-50">
                <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>資料ダウンロード</Link>
              </Button>
              <Button asChild className="h-11 rounded-md bg-blue-800 font-semibold text-white hover:bg-blue-700">
                <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>お問い合わせ</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
