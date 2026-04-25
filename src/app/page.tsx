'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ArrowRight,
  Check,
  Download,
  LogIn,
  Mail,
  Phone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type StatCard = {
  label: string
  value: string
  note: string
  image: string
  alt: string
}

type MarketCard = {
  title: string
  description: string
}

type ServiceCard = {
  number: string
  title: string
  description: string
  image: string
  alt: string
}

type FlowCard = {
  number: string
  title: string
  description: string
  image: string
  alt: string
}

type ValueCard = {
  title: string
  points: string[]
  image: string
  alt: string
  tone: string
}

function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setIsVisible(true)
        observer.unobserve(entry.target)
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`reveal-in ${isVisible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

const stats: StatCard[] = [
  {
    label: '月間対応実績',
    value: '1,000件超',
    note: '1薬局あたり月1,000件超の在宅対応実績をもとに支援',
    image: '/homepage-assets/icons-balanced/pharmacy-storefront.jpg',
    alt: '薬局店舗のアイコン',
  },
  {
    label: '教育と標準化',
    value: '型化',
    note: 'スタッフ教育、役割分担、必要書類を整理',
    image: '/homepage-assets/icons-balanced/document-check.jpg',
    alt: '記録書類のアイコン',
  },
  {
    label: '運用DX',
    value: '定着',
    note: '患者管理、日次対応、回収管理をアプリで継続',
    image: '/homepage-assets/icons-balanced/operator-laptop.jpg',
    alt: 'PCで業務する薬剤師のイラスト',
  },
  {
    label: '夜間連携',
    value: '拡張',
    note: '日中運用が整った先で夜間対応へ接続',
    image: '/homepage-assets/icons-balanced/clock-24h.jpg',
    alt: '24時間対応の時計アイコン',
  },
]

const marketCards: MarketCard[] = [
  {
    title: '在宅に取り組む必要性の増加',
    description: '外来調剤だけでは薬局経営が厳しくなる中、在宅対応は地域貢献だけでなく経営維持の柱としても重要になっています。',
  },
  {
    title: '自力で立ち上げにくい現場',
    description: '在宅は営業、患者受入、スタッフ教育、医師・ケアマネ連携、記録、請求まで必要で、ノウハウがない薬局ほど止まりやすい領域です。',
  },
  {
    title: 'コンサルだけでは継続しにくい',
    description: '助言だけで終わると、現場に定着せず契約も切れやすい。日々使うWEBアプリまで含めて運用に組み込む必要があります。',
  },
]

const services: ServiceCard[] = [
  {
    number: '01',
    title: '在宅立ち上げの伴走',
    description: '田中社長側の在宅調剤ノウハウをもとに、薬局ごとの受入準備、役割、営業導線を整えます。',
    image: '/homepage-assets/icons-balanced/pharmacist-consultation.jpg',
    alt: '薬剤師が相談対応しているイラスト',
  },
  {
    number: '02',
    title: '教育・テンプレート整備',
    description: 'スタッフ教育、必要備品、患者受入基準、医療機関連携、記録の型を現場で使える形にします。',
    image: '/homepage-assets/icons-balanced/document-check.jpg',
    alt: '書類チェックのイラスト',
  },
  {
    number: '03',
    title: 'WEBアプリで運用定着',
    description: '患者管理、日次タスク、申し送り、回収状況をアプリで回し、コンサル後も継続利用される基盤にします。',
    image: '/homepage-assets/icons-balanced/operator-laptop.jpg',
    alt: 'PCで運用するイラスト',
  },
  {
    number: '04',
    title: '夜間対応への段階接続',
    description: '日中運用と患者情報が整った薬局から、夜間受付、申し送り、緊急時連携へ段階的につなぎます。',
    image: '/homepage-assets/icons-balanced/support-24h-phone.jpg',
    alt: '24時間電話相談のイラスト',
  },
]

const flows: FlowCard[] = [
  {
    number: '01',
    title: '現状診断',
    description: '在宅に取り組む意思、体制、課題を確認',
    image: '/homepage-assets/icons-balanced/patient-phone.jpg',
    alt: '電話相談のイラスト',
  },
  {
    number: '02',
    title: 'ロードマップ作成',
    description: '初回患者受入までの手順を設計',
    image: '/homepage-assets/icons-balanced/operator-laptop.jpg',
    alt: '電話を受けながら確認するイラスト',
  },
  {
    number: '03',
    title: '現場に伴走',
    description: '教育、営業、運用開始を支援',
    image: '/homepage-assets/icons-balanced/pharmacist-pointing.jpg',
    alt: '薬剤師が説明しているイラスト',
  },
  {
    number: '04',
    title: 'アプリで定着',
    description: '日常業務として継続利用される状態へ',
    image: '/homepage-assets/icons-balanced/handover-medicine.jpg',
    alt: '薬を受け渡しているイラスト',
  },
]

const values: ValueCard[] = [
  {
    title: '薬局現場にとって',
    points: ['在宅の始め方が明確になる', 'スタッフ教育と役割分担が進む', '患者対応を日々の業務として回せる'],
    image: '/homepage-assets/icons-balanced/patients-family.jpg',
    alt: '患者と家族のイラスト',
    tone: 'bg-sky-50',
  },
  {
    title: '薬局経営にとって',
    points: ['在宅を新しい収益柱に育てられる', '地域連携と紹介獲得につながる', 'コンサル後もアプリ利用が継続する'],
    image: '/homepage-assets/icons-balanced/two-pharmacists-waving.jpg',
    alt: '薬剤師チームのイラスト',
    tone: 'bg-emerald-50',
  },
  {
    title: '地域医療にとって',
    points: ['在宅対応できる薬局を増やす', '患者を断らない体制に近づく', '必要に応じて夜間連携へ広げられる'],
    image: '/homepage-assets/icons-balanced/doctor-arms-crossed.jpg',
    alt: '医療従事者のイラスト',
    tone: 'bg-indigo-50',
  },
]

const homepageNavItems = [
  { label: 'サービスの特徴', href: '#features' },
  { label: '市場背景', href: '#market' },
  { label: '導入への流れ', href: '/flow' },
  { label: 'よくあるご質問', href: '/faq' },
  { label: '料金', href: '/pricing' },
  { label: '会社概要', href: '/company' },
]

export default function HomePage() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleNavigate = (href: string) => {
    setMobileMenuOpen(false)
    if (href.startsWith('#')) {
      window.location.hash = href
      return
    }
    router.push(href)
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
          <button className="flex items-center gap-3 text-left" onClick={() => router.push('/')} aria-label="任せて在宅ホーム">
            <Image
              src="/homepage-assets/from-reference/logo-mark.jpg"
              alt="任せて在宅ロゴ"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
            <span>
              <span className="block text-xs font-semibold text-slate-600">在宅薬局の立ち上げ・運用支援</span>
              <span className="block text-2xl font-bold tracking-wide text-blue-950">任せて在宅</span>
            </span>
          </button>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-800 lg:flex">
            {homepageNavItems.map((item) => (
              <a key={item.href} href={item.href} className="homepage-nav-link hover:text-blue-700">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Button
              variant="ghost"
              className="h-11 rounded-md px-4 font-semibold text-blue-950 hover:bg-blue-50 hover:text-blue-800"
              onClick={() => router.push('/login')}
            >
              <LogIn className="mr-2 h-4 w-4" />
              ログイン
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-md border-blue-900 !bg-white px-5 font-semibold !text-blue-950 hover:!bg-blue-50"
              onClick={() => router.push('/contact')}
            >
              資料ダウンロード
            </Button>
            <Button
              className="h-11 rounded-md bg-blue-800 px-5 font-semibold text-white hover:bg-blue-700"
              onClick={() => router.push('/contact')}
            >
              お問い合わせ
            </Button>
          </div>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'メニューを閉じる' : 'メニューを開く'}
            aria-expanded={mobileMenuOpen}
            className={`hamburger-button inline-flex lg:hidden ${mobileMenuOpen ? 'is-open' : ''}`}
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
                {homepageNavItems.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    className="homepage-mobile-link rounded-md px-3 py-3 text-left text-sm font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-800"
                    onClick={() => handleNavigate(item.href)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3">
                <Button
                  variant="ghost"
                  className="h-11 justify-center rounded-md font-semibold text-blue-950 hover:bg-blue-50 hover:text-blue-800"
                  onClick={() => handleNavigate('/login')}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  ログイン
                </Button>
                <Button
                  variant="outline"
                  className="h-11 rounded-md border-blue-900 !bg-white font-semibold !text-blue-950 hover:!bg-blue-50"
                  onClick={() => handleNavigate('/contact')}
                >
                  資料ダウンロード
                </Button>
                <Button
                  className="h-11 rounded-md bg-blue-800 font-semibold text-white hover:bg-blue-700"
                  onClick={() => handleNavigate('/contact')}
                >
                  お問い合わせ
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:py-20">
          <Reveal className="hero-copy">
            <p className="text-sm font-bold text-blue-900">在宅を始めたい薬局を、持てる薬局へ。</p>
            <h1 className="mt-6 text-4xl font-bold leading-[1.35] tracking-wide text-blue-950 sm:text-5xl lg:text-6xl">
              在宅調剤の実務を
              <br />
              薬局の運用基盤へ。
            </h1>
            <p className="mt-6 max-w-xl text-base font-medium leading-8 text-slate-700">
              任せて在宅は、1薬局あたり月1,000件超の在宅対応実績から培った現場ノウハウをもとに、他薬局の在宅立ち上げ、教育、営業、日次運用を支援する薬局DXサービスです。
              伴走だけで終わらせず、WEBアプリを日常業務に組み込み、継続して使われる仕組みまで整えます。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                className="cta-button h-14 w-full rounded-md bg-blue-800 px-7 text-base font-bold text-white hover:bg-blue-700 sm:w-auto"
                onClick={() => router.push('/contact')}
              >
                <Download className="mr-2 h-5 w-5" />
                資料をダウンロードする
              </Button>
              <Button
                variant="outline"
                className="cta-button h-14 w-full rounded-md border-blue-900 !bg-white px-7 text-base font-bold !text-blue-950 hover:!bg-blue-50 sm:w-auto"
                onClick={() => router.push('/contact')}
              >
                <Mail className="mr-2 h-5 w-5" />
                お問い合わせはこちら
              </Button>
              <Button
                variant="ghost"
                className="cta-button h-14 w-full rounded-md px-7 text-base font-bold text-blue-950 hover:bg-blue-50 hover:text-blue-800 sm:hidden"
                onClick={() => router.push('/login')}
              >
                <LogIn className="mr-2 h-5 w-5" />
                ログイン
              </Button>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="relative min-h-[340px] overflow-hidden rounded-lg bg-blue-50/40 p-6 sm:min-h-[430px]">
              <video
                className="h-full min-h-[292px] w-full rounded-md object-contain sm:min-h-[382px]"
                src="/homepage-assets/from-reference/hero-pharmacy-team.mp4"
                aria-label="薬剤師チームの紹介動画"
                autoPlay
                loop
                muted
                playsInline
                poster="/homepage-assets/from-reference/hero-pharmacy-team.jpg"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 pb-14 sm:px-6 md:grid-cols-4">
          {stats.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 80}>
              <article className="homepage-card rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
                <p className="text-sm font-bold text-blue-950">{stat.label}</p>
                <div className="mt-3 text-3xl font-bold tracking-tight text-blue-950">{stat.value}</div>
                <Image
                  src={stat.image}
                  alt={stat.alt}
                  width={160}
                  height={160}
                  className="mx-auto mt-5 h-32 w-32 object-contain"
                />
                <p className="mt-4 min-h-10 text-xs leading-5 text-slate-500">{stat.note}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="market" className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold text-blue-800">MARKET BACKGROUND</p>
            <h2 className="mt-3 text-3xl font-bold tracking-wide text-blue-950">在宅薬局の立ち上げは、仕組み化が必要な段階へ</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              在宅医療の需要が高まる一方で、薬局現場ではノウハウ不足、スタッフ教育、患者受入準備、日々の運用定着が大きな課題になっています。
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {marketCards.map((card, index) => (
              <Reveal key={card.title} delay={index * 90}>
                <article className="homepage-card h-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-blue-950">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="flex items-center justify-center gap-5">
            <span className="hidden h-px w-28 bg-slate-300 sm:block" />
            <h2 className="text-center text-3xl font-bold tracking-wide text-blue-950">任せて在宅のサービス</h2>
            <span className="hidden h-px w-28 bg-slate-300 sm:block" />
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {services.map((service, index) => (
              <Reveal key={service.number} delay={index * 90}>
                <article className="homepage-card h-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-800 text-sm font-bold text-white">
                    {service.number}
                  </div>
                  <Image
                    src={service.image}
                    alt={service.alt}
                    width={260}
                    height={210}
                    className="mx-auto mt-5 h-44 w-full object-contain"
                  />
                  <h3 className="mt-5 min-h-14 text-lg font-bold leading-7 text-blue-950">{service.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{service.description}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="flow" className="border-y border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="flex items-center justify-center gap-5">
            <span className="hidden h-px w-28 bg-slate-300 sm:block" />
            <h2 className="text-center text-3xl font-bold tracking-wide text-blue-950">在宅導入から定着までの流れ</h2>
            <span className="hidden h-px w-28 bg-slate-300 sm:block" />
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {flows.map((flow, index) => (
              <Reveal key={flow.number} delay={index * 110}>
                <article className="homepage-card relative h-full rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
                  {index < flows.length - 1 && (
                    <ArrowRight className="flow-arrow absolute -right-4 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-blue-700 md:block" />
                  )}
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-800 text-sm font-bold text-white">
                    {flow.number}
                  </div>
                  <Image
                    src={flow.image}
                    alt={flow.alt}
                    width={240}
                    height={190}
                    className="mx-auto mt-5 h-40 w-full object-contain"
                  />
                  <h3 className="mt-5 text-base font-bold text-blue-950">{flow.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{flow.description}</p>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-8 text-center" delay={160}>
            <Button
              variant="outline"
              className="cta-button rounded-md border-blue-900 !bg-white px-6 !text-blue-950 hover:!bg-blue-50"
              onClick={() => router.push('/flow')}
            >
              導入への流れを詳しく見る
            </Button>
          </Reveal>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="flex items-center justify-center gap-5">
            <span className="hidden h-px w-28 bg-slate-300 sm:block" />
            <h2 className="text-center text-3xl font-bold tracking-wide text-blue-950">薬局・経営・地域医療それぞれに価値を提供</h2>
            <span className="hidden h-px w-28 bg-slate-300 sm:block" />
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {values.map((value, index) => (
              <Reveal key={value.title} delay={index * 90}>
                <article className={`homepage-card h-full rounded-lg border border-slate-200 p-7 shadow-sm ${value.tone}`}>
                  <h3 className="text-center text-xl font-bold text-blue-950">{value.title}</h3>
                  <Image
                    src={value.image}
                    alt={value.alt}
                    width={320}
                    height={220}
                    className="mx-auto mt-5 h-44 w-full object-contain"
                  />
                  <ul className="mt-6 space-y-3">
                    {value.points.map((point) => (
                      <li key={point} className="flex items-start gap-3 text-sm font-medium leading-7 text-slate-700">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-blue-800" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-white px-4 pb-16 sm:px-6">
        <Reveal className="mx-auto grid max-w-7xl gap-8 rounded-lg bg-blue-50 p-8 md:grid-cols-[180px_1fr_360px] md:items-center">
          <Image
            src="/homepage-assets/icons-balanced/doctor-pointing.jpg"
            alt="案内する薬剤師のイラスト"
            width={180}
            height={150}
            className="hidden h-36 w-full object-contain md:block"
          />
          <div>
            <h2 className="text-2xl font-bold text-blue-950">在宅化の進め方を資料で確認できます</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              在宅立ち上げ、運用定着、WEBアプリ活用、夜間連携までの考え方をまとめています。まずは現状診断からご相談ください。
            </p>
          </div>
          <div className="grid gap-3">
            <Button
              className="cta-button h-12 rounded-md bg-blue-800 text-white hover:bg-blue-700"
              onClick={() => router.push('/contact')}
            >
              <Download className="mr-2 h-5 w-5" />
              資料をダウンロードする
            </Button>
            <Button
              variant="outline"
              className="cta-button h-12 rounded-md border-blue-900 !bg-white !text-blue-950 hover:!bg-blue-50"
              onClick={() => router.push('/contact')}
            >
              <Mail className="mr-2 h-5 w-5" />
              お問い合わせはこちら
            </Button>
          </div>
        </Reveal>
      </section>

      <footer className="bg-blue-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_0.7fr_0.7fr_0.9fr]">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/homepage-assets/from-reference/logo-mark.jpg"
                alt="任せて在宅ロゴ"
                width={36}
                height={36}
                className="h-9 w-9 rounded bg-white object-contain p-1"
              />
              <div className="text-2xl font-bold">任せて在宅</div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-7 text-blue-100">
              在宅薬局の立ち上げ、教育、運用定着、夜間連携までを支える薬局DXサービスです。
            </p>
          </div>
          <div>
            <h3 className="font-bold">サービス</h3>
            <ul className="mt-4 space-y-2 text-sm text-blue-100">
              <li><a href="#features">サービスの特徴</a></li>
              <li><a href="/flow">導入への流れ</a></li>
              <li><a href="/pricing">料金</a></li>
              <li><a href="/company">会社概要</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold">サポート</h3>
            <ul className="mt-4 space-y-2 text-sm text-blue-100">
              <li><a href="/faq">よくあるご質問</a></li>
              <li><a href="/contact">資料ダウンロード</a></li>
              <li><a href="/contact">お問い合わせ</a></li>
              <li><a href="/login">ログイン</a></li>
            </ul>
          </div>
          <div className="rounded-lg border border-white/30 p-5">
            <p className="text-sm text-blue-100">お電話でのお問い合わせ（平日 9:00〜18:00）</p>
            <p className="mt-3 flex items-center gap-3 text-2xl font-bold">
              <Phone className="h-6 w-6" />
              03-1234-5678
            </p>
          </div>
        </div>
        <div className="border-t border-white/15 py-4 text-center text-xs text-blue-100">
          © 2026 任せて在宅
        </div>
      </footer>
    </main>
  )
}
