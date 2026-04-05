'use client'

import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Heart,
  LogIn,
  Mail,
  Moon,
  Phone,
  Route,
  Shield,
  Star,
  Users,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

/* ─────────────────────────────────────────────
   Data
   ───────────────────────────────────────────── */

const services = [
  {
    id: 'knowhow',
    name: '在宅はじめてキット',
    tagline: '在宅の「はじめ方」を、型にする',
    description:
      '導入診断・学習コンテンツ・タスク管理・添削まで、在宅を始めるために必要なノウハウを体系化。何から手をつければいいか分からない状態を解消し、最短で初回受入を実現します。',
    icon: BookOpen,
    color: 'indigo',
    features: ['導入レディネス診断', 'ステップ学習', 'タスク進捗管理', 'ドキュメント添削'],
  },
  {
    id: 'omakase',
    name: '在宅運用サポート',
    tagline: '運用の「回し方」を、任せられる',
    description:
      '患者情報管理・依頼受付・アサイン・チェックリスト・申し送り(SBAR)まで、在宅業務のオペレーションを一気通貫で支援。日々のルーチンを仕組み化し、属人化を防ぎます。',
    icon: Route,
    color: 'emerald',
    features: ['患者マスター管理', 'ワンクリック依頼受付', 'SBAR申し送り', 'SLA自動計測'],
  },
  {
    id: 'night',
    name: '夜間対応代行',
    tagline: '夜間の「断らない」を、支える',
    description:
      '22時〜翌6時の夜間対応を専門薬剤師チームが代行。受電→アサイン→対応→申し送りまで15分SLAで運用し、翌朝には加盟薬局へ完全引継ぎ。患者も薬局も安心して夜を過ごせます。',
    icon: Moon,
    color: 'violet',
    features: ['15分SLA折返し', '専門薬剤師当番制', 'リアルタイム状況共有', '翌朝自動引継ぎ'],
  },
  {
    id: 'makaseta',
    name: '経営分析・レポート',
    tagline: '在宅の「その先」を、描ける',
    description:
      '月次レポート・KPI分析・請求管理・監査ログなど、在宅事業の見える化と経営判断を支援。地域の在宅体制を持続可能にするための戦略基盤を提供します。',
    icon: Star,
    color: 'amber',
    features: ['月次実績レポート', 'KPIダッシュボード', '自動請求生成', '監査証跡管理'],
  },
]

const nightFlowSteps = [
  {
    step: '01',
    title: '受電',
    description: '患者・ご家族からの電話を受け、依頼を起票',
    icon: Phone,
    time: '0分',
  },
  {
    step: '02',
    title: 'アサイン',
    description: '当番薬剤師へ自動通知、10分以内に受諾確認',
    icon: Users,
    time: '〜5分',
  },
  {
    step: '03',
    title: '対応',
    description: '薬剤師が出動、チェックリストに沿って対応',
    icon: Heart,
    time: '〜15分',
  },
  {
    step: '04',
    title: '申し送り',
    description: 'SBAR形式で記録、加盟薬局へ即時通知',
    icon: FileText,
    time: '対応後',
  },
]

const commitments = [
  { value: '15', unit: '分', label: '折返しSLA目標' },
  { value: '24', unit: 'h', label: '切れ目のない対応体制' },
  { value: 'SBAR', unit: '', label: '標準化された申し送り' },
  { value: '5', unit: '年', label: '対応記録の保存期間' },
]

const valueProps = [
  {
    title: '患者にとって',
    description: '夜間でも安心して相談でき、かかりつけ薬局の継続性が保たれます。',
    icon: Heart,
  },
  {
    title: '薬局にとって',
    description: '夜間体制を外部委託し、スタッフの負担軽減と在宅患者の維持を両立。',
    icon: Building2,
  },
  {
    title: '地域にとって',
    description: '24時間対応可能な在宅薬局ネットワークが、地域医療の基盤を支えます。',
    icon: Shield,
  },
]

/* ─────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────── */

const colorMap: Record<string, { border: string; bg: string; text: string; glow: string; badge: string }> = {
  indigo: {
    border: 'border-indigo-500/30',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    glow: 'shadow-indigo-500/20',
    badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20',
  },
  emerald: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  },
  violet: {
    border: 'border-violet-500/30',
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    glow: 'shadow-violet-500/20',
    badge: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
  },
  amber: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  },
}

/* ─────────────────────────────────────────────
   Component
   ───────────────────────────────────────────── */

export default function CorporateHomepage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-100 selection:bg-indigo-500/30">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/[0.06] bg-[#0a0e1a]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Moon className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold leading-tight tracking-tight text-white">
                マカセテ在宅
              </span>
              <span className="hidden text-[10px] leading-none text-gray-500 sm:block">
                マカセテ在宅株式会社
              </span>
            </div>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#services" className="text-sm text-gray-400 transition hover:text-white">
              サービス
            </a>
            <a href="#night-flow" className="text-sm text-gray-400 transition hover:text-white">
              夜間連携
            </a>
            <a href="#value" className="text-sm text-gray-400 transition hover:text-white">
              選ばれる理由
            </a>
            <a href="#company" className="text-sm text-gray-400 transition hover:text-white">
              会社情報
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="hidden text-sm text-gray-300 hover:bg-white/5 hover:text-white sm:flex"
              onClick={() => router.push('/login')}
            >
              <LogIn className="mr-1.5 h-4 w-4" />
              ログイン
            </Button>
            <Button
              className="bg-indigo-600 text-sm text-white hover:bg-indigo-500"
              onClick={() => router.push('/onboarding')}
            >
              導入相談
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-16">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-600/[0.07] blur-[120px]" />
          <div className="absolute right-0 top-[200px] h-[400px] w-[400px] rounded-full bg-violet-600/[0.05] blur-[100px]" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-24 md:pb-32 md:pt-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5">
              <Zap className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-xs font-medium text-indigo-300">
                在宅薬局の導入から運用まで、ワンストップで支援
              </span>
            </div>

            <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              在宅の
              <span className="relative">
                <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
                  はじめ方
                </span>
              </span>
              から
              <br className="hidden sm:block" />
              <span className="relative">
                <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  回し方
                </span>
              </span>
              まで、任せられる。
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-400 sm:text-lg md:mt-8 md:text-xl">
              在宅薬局の立ち上げ支援から、夜間対応・運用オペレーションまで。
              <br className="hidden md:block" />
              薬局が「断らない在宅」を実現するための、すべてがここに。
            </p>

            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center md:mt-10">
              <Button
                size="lg"
                className="w-full bg-indigo-600 px-8 text-base text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 hover:shadow-indigo-500/30 sm:w-auto"
                onClick={() => router.push('/onboarding')}
              >
                導入診断を始める
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full border-[#2a3553] bg-[#11182c]/50 px-8 text-base text-gray-200 hover:border-gray-600 hover:bg-[#1a2035] sm:w-auto"
              >
                <Mail className="mr-2 h-4 w-4" />
                資料請求・お問い合わせ
              </Button>
            </div>

            <p className="mt-4 text-xs text-gray-600">
              既にご利用の方は
              <button
                onClick={() => router.push('/login')}
                className="ml-1 text-indigo-400/70 underline underline-offset-2 transition hover:text-indigo-400"
              >
                管理画面へログイン
              </button>
            </p>
          </div>

          {/* Commitments bar */}
          <div className="mx-auto mt-20 max-w-3xl">
            <p className="mb-3 text-center text-xs font-medium tracking-wider text-gray-600">
              私たちの約束
            </p>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] md:grid-cols-4">
              {commitments.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center justify-center px-4 py-6 transition hover:bg-white/[0.02] md:py-8"
                >
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-3xl font-bold tabular-nums text-white md:text-4xl">
                      {stat.value}
                    </span>
                    {stat.unit && (
                      <span className="text-lg font-medium text-indigo-400">{stat.unit}</span>
                    )}
                  </div>
                  <span className="mt-1.5 text-xs text-gray-500">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Mission / Company intro ── */}
      <section id="company" className="relative border-t border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-indigo-400">
              About Us
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              すべての患者に、夜も届く薬局を。
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              マカセテ在宅株式会社のミッション
            </p>
            <p className="mt-6 text-base leading-relaxed text-gray-400 sm:text-lg">
              マカセテ在宅株式会社は、在宅医療における薬局の役割を最大化するために設立されました。
              「在宅をやりたいけれど始め方がわからない」「夜間対応のリソースがない」
              ——そうした薬局が抱える構造的な課題を、テクノロジーと専門チームの力で解決します。
            </p>
            <p className="mt-4 text-base leading-relaxed text-gray-400 sm:text-lg">
              私たちが目指すのは、患者が安心して在宅療養を続けられる地域医療インフラの構築。
              薬局の在宅参入を支援し、24時間途切れない薬学的ケアを届ける仕組みをつくります。
            </p>
          </div>

          {/* Business pillars */}
          <div className="mx-auto mt-16 grid max-w-4xl gap-6 md:grid-cols-3">
            {[
              {
                label: '在宅導入・運用支援SaaS',
                detail: '薬局の在宅業務をデジタル化し、導入から日常運用までを一貫サポート',
                icon: Shield,
              },
              {
                label: '夜間薬剤師派遣・代行',
                detail: '22:00〜翌6:00の夜間対応を専門薬剤師チームが完全代行',
                icon: Clock,
              },
              {
                label: '地域薬局ネットワーク構築',
                detail: '加盟薬局間の連携を促進し、面的な在宅医療体制を実現',
                icon: Building2,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="group flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition hover:border-white/[0.1] hover:bg-white/[0.03]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                  <item.icon className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="relative border-t border-white/[0.04]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-indigo-600/[0.04] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-indigo-400">
              Services
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              4つのサービスで、在宅のすべてを支援
            </h2>
            <p className="mt-4 text-base text-gray-400 sm:text-lg">
              導入前の準備から、日常運用、夜間対応、経営分析まで。
              フェーズに合わせた最適なサポートを提供します。
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2">
            {services.map((service, i) => {
              const colors = colorMap[service.color]
              const Icon = service.icon
              return (
                <div
                  key={service.id}
                  className={`group relative overflow-hidden rounded-2xl border ${colors.border} bg-[#111827]/80 p-8 transition-all duration-300 hover:shadow-xl ${colors.glow} hover:border-opacity-60`}
                >
                  {/* Subtle gradient accent */}
                  <div
                    className={`pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full ${colors.bg} opacity-50 blur-[60px] transition-opacity duration-300 group-hover:opacity-80`}
                  />

                  <div className="relative">
                    <div className="mb-5 flex items-center gap-3">
                      <div
                        className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border ${colors.border} ${colors.bg}`}
                      >
                        <Icon className={`h-6 w-6 ${colors.text}`} />
                      </div>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-xs font-bold text-gray-500">
                        {i + 1}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white">{service.name}</h3>
                    <p className={`mt-1 text-sm font-medium ${colors.text}`}>{service.tagline}</p>
                    <p className="mt-4 text-sm leading-relaxed text-gray-400">
                      {service.description}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {service.features.map((feature) => (
                        <span
                          key={feature}
                          className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${colors.badge}`}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Night Flow ── */}
      <section id="night-flow" className="relative border-t border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-400">
              Night Collaboration
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              夜間対応代行の流れ
            </h2>
            <p className="mt-4 text-base text-gray-400 sm:text-lg">
              22:00〜翌6:00。加盟薬局の電話転送を受けてから、
              翌朝の申し送りまで、すべてをシームレスに管理します。
            </p>
          </div>

          {/* Flow steps */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {nightFlowSteps.map((step, i) => {
                const Icon = step.icon
                return (
                  <div key={step.step} className="relative">
                    {/* Connector line */}
                    {i < nightFlowSteps.length - 1 && (
                      <div className="pointer-events-none absolute right-0 top-12 hidden h-px w-8 translate-x-full bg-gradient-to-r from-violet-500/40 to-transparent lg:block" />
                    )}
                    <div className="group flex h-full flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition hover:border-violet-500/20 hover:bg-white/[0.04]">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-2xl font-bold text-white/10">{step.step}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white">{step.title}</h3>
                      <p className="mt-2 flex-1 text-sm text-gray-400">{step.description}</p>
                      <p className="mt-3 text-xs font-medium text-violet-400">{step.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Additional context */}
            <div className="mt-8 rounded-xl border border-violet-500/10 bg-violet-500/[0.03] p-6 md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">翌朝の引継ぎまで、完全サポート</h3>
                  <p className="mt-2 max-w-xl text-sm text-gray-400">
                    対応後はSBAR形式で申し送りを作成し、加盟薬局へ即時通知。
                    未確認の場合は翌朝9:00と11:00にリマインドを自動送信します。
                    すべての対応履歴は監査ログとして5年間保存されます。
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  {['SBAR形式の標準化', 'LINE/メール自動通知', '監査証跡の完全保存'].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle2 className="h-4 w-4 text-violet-400" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Value Proposition ── */}
      <section id="value" className="relative border-t border-white/[0.04]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-[400px] w-[500px] rounded-full bg-emerald-600/[0.04] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">
              Why It Matters
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              「断らない在宅」が、すべてを変える
            </h2>
            <p className="mt-4 text-base text-gray-400 sm:text-lg">
              マカセテ在宅は、患者・薬局・地域の三方にとって持続可能な
              在宅医療インフラを構築します。
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-3">
            {valueProps.map((prop) => (
              <div key={prop.title} className="text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                  <prop.icon className="h-7 w-7 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">{prop.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-400">{prop.description}</p>
              </div>
            ))}
          </div>

          {/* Voice of stakeholder — framed as aspiration */}
          <div className="mx-auto mt-20 max-w-3xl text-center">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 md:p-12">
              <p className="text-lg font-medium leading-relaxed text-gray-300 md:text-xl">
                &ldquo;夜間対応を仕組み化することで、薬局スタッフの負担を減らしながら
                <br className="hidden md:block" />
                在宅患者の受入体制を
                <span className="font-bold text-emerald-400">着実に拡大</span>
                できる環境をつくりたい。&rdquo;
              </p>
              <p className="mt-6 text-sm text-gray-500">
                — マカセテ在宅が加盟薬局と共に目指す姿
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative border-t border-white/[0.04]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/[0.06] blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              在宅の第一歩を、
              <br />
              いま踏み出しませんか。
            </h2>
            <p className="mt-6 text-base text-gray-400 sm:text-lg">
              まずは無料の導入診断で、貴薬局の在宅参入に最適なプランを確認。
              個別のご相談や資料のご請求も、お気軽にどうぞ。
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="w-full bg-indigo-600 px-10 text-base text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 sm:w-auto"
                onClick={() => router.push('/onboarding')}
              >
                無料で導入診断を始める
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full border-[#2a3553] bg-[#11182c]/50 px-8 text-base text-gray-200 hover:border-gray-600 hover:bg-[#1a2035] sm:w-auto"
              >
                <Mail className="mr-2 h-4 w-4" />
                お問い合わせ・資料請求
              </Button>
            </div>

            <p className="mt-6 text-xs text-gray-600">
              導入診断の結果はいつでもマイページから確認できます。費用は一切かかりません。
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] bg-[#070a14]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-12 md:grid-cols-4">
            {/* Company */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                  <Moon className="h-4 w-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-semibold leading-tight text-white">マカセテ在宅</span>
                  <span className="text-[10px] leading-none text-gray-500">マカセテ在宅株式会社</span>
                </div>
              </div>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-500">
                マカセテ在宅株式会社は、在宅医療における薬局支援に特化したヘルスケアテクノロジー企業です。
                薬局の在宅参入を支援し、夜間を含む24時間体制の在宅薬学的ケアの実現を目指しています。
              </p>
              {/* Corporate details */}
              <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs text-gray-600">
                <dt className="text-gray-500">所在地</dt>
                <dd>東京都世田谷区</dd>
                <dt className="text-gray-500">事業内容</dt>
                <dd>在宅薬局支援SaaS開発・夜間薬剤師派遣事業</dd>
              </dl>
            </div>

            {/* Links */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                サービス
              </h3>
              <ul className="mt-4 space-y-3">
                {['在宅はじめてキット', '在宅運用サポート', '夜間対応代行', '経営分析・レポート'].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="#services"
                        className="text-sm text-gray-500 transition hover:text-gray-300"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                企業情報
              </h3>
              <ul className="mt-4 space-y-3">
                {['会社概要', 'お問い合わせ', '採用情報', 'プライバシーポリシー', '利用規約'].map(
                  (item) => (
                    <li key={item}>
                      <a href="#" className="text-sm text-gray-500 transition hover:text-gray-300">
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.04] pt-8 md:flex-row">
            <p className="text-xs text-gray-600">
              &copy; {new Date().getFullYear()} マカセテ在宅株式会社 All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-xs text-gray-600 transition hover:text-gray-400">
                医療情報の取り扱いについて
              </a>
              <a href="#" className="text-xs text-gray-600 transition hover:text-gray-400">
                特定商取引法に基づく表記
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
