'use client'

import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ChartColumn,
  ClipboardList,
  FileText,
  Headphones,
  Phone,
  Pill,
  ShieldCheck,
  Stethoscope,
  Truck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type Service = {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

type Metric = {
  label: string
  value: string
  sublabel: string
  icon: React.ComponentType<{ className?: string }>
}

type FlowStep = {
  step: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const services: Service[] = [
  {
    title: '夜間の電話相談対応',
    description: '患者様・ご家族・訪問看護師からのご連絡を受け、薬局に代わって一次対応します。',
    icon: Headphones,
  },
  {
    title: '在宅業務の運用サポート',
    description: '依頼受付から患者情報確認、対応記録、申し送りまでを標準化して支援します。',
    icon: ClipboardList,
  },
  {
    title: '多職種・地域連携支援',
    description: '医師・看護師・ケアマネジャーとの連携に必要な情報共有をなめらかにします。',
    icon: Building2,
  },
  {
    title: 'データ分析・レポート',
    description: '対応件数や運用状況を可視化し、継続的な改善と経営判断を支援します。',
    icon: ChartColumn,
  },
]

const metrics: Metric[] = [
  {
    label: 'SLA（応答目標）',
    value: '15分以内',
    sublabel: '折返し・初動を標準化して運用',
    icon: BadgeCheck,
  },
  {
    label: '24時間365日対応',
    value: '24時間',
    sublabel: '夜間・休日も途切れない支援体制',
    icon: ShieldCheck,
  },
  {
    label: '標準化された申し送り',
    value: 'SBAR',
    sublabel: '夜間対応後の共有をスムーズに',
    icon: FileText,
  },
  {
    label: '対応記録の保存',
    value: '5年',
    sublabel: '監査証跡として継続保存',
    icon: ClipboardList,
  },
]

const flowSteps: FlowStep[] = [
  {
    step: '01',
    title: '患者様からの連絡',
    description: '夜間に患者様・ご家族・訪問看護師などから連絡が入ります。',
    icon: Phone,
  },
  {
    step: '02',
    title: '任せて在宅が一次対応',
    description: '患者情報と状況を確認し、優先度を判断します。',
    icon: Headphones,
  },
  {
    step: '03',
    title: '薬剤師が確認・判断',
    description: '必要に応じて薬剤師が内容確認と対応判断を行います。',
    icon: Stethoscope,
  },
  {
    step: '04',
    title: '連携・訪問・申し送り',
    description: '必要時は連携先へ共有し、翌朝の薬局へ引き継ぎます。',
    icon: Truck,
  },
]

const valueColumns = [
  {
    title: '患者・ご家族にとって',
    points: ['夜間でも早期に相談できて安心', '症状への変化に応じた一次対応', '必要な薬学的支援を受けやすい'],
    accent: 'bg-blue-50 border-blue-100',
  },
  {
    title: '薬局にとって',
    points: ['夜間対応の負担を大幅に軽減', '属人的な対応を減らし、働き方を改善', '地域から信頼される薬局づくりに貢献'],
    accent: 'bg-emerald-50 border-emerald-100',
  },
  {
    title: '経営にとって',
    points: ['24時間対応体制の構築を効率化', '対応件数や運営状況を可視化', '持続可能な在宅薬局モデルを支援'],
    accent: 'bg-indigo-50 border-indigo-100',
  },
]

const reasons = [
  '夜間対応の一次受付から申し送りまでを一貫して支援できること',
  '薬局ごとの運用に合わせて、標準化と柔軟性の両立を目指していること',
  '薬剤師・薬局運営・在宅現場の視点を踏まえたサービス設計であること',
]

const faqs = [
  {
    question: 'どのような薬局が対象ですか？',
    answer: '在宅医療に取り組んでいる薬局、またはこれから在宅体制を強化したい薬局を主な対象としています。',
  },
  {
    question: '夜間はどこまで対応してもらえますか？',
    answer: '一次受付、状況整理、必要な連携、対応記録、翌朝の申し送りまでを対象として設計しています。個別の運用範囲は導入時に調整します。',
  },
  {
    question: '導入前に相談できますか？',
    answer: 'はい。現在の夜間体制や在宅運用の課題を伺いながら、導入イメージをご案内します。',
  },
]

export default function CorporateHomepage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100">
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Pill className="h-4 w-4" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">任せて在宅</div>
            </div>
          </div>

          <div className="hidden items-center gap-7 md:flex">
            <a href="#services" className="text-sm text-slate-600 transition hover:text-slate-900">サービスの特徴</a>
            <a href="#flow" className="text-sm text-slate-600 transition hover:text-slate-900">ご利用の流れ</a>
            <a href="#value" className="text-sm text-slate-600 transition hover:text-slate-900">選ばれる理由</a>
            <a href="#faq" className="text-sm text-slate-600 transition hover:text-slate-900">よくあるご質問</a>
            <a href="#company" className="text-sm text-slate-600 transition hover:text-slate-900">会社情報</a>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="hidden border-slate-300 bg-white text-slate-700 hover:bg-slate-50 sm:inline-flex"
              onClick={() => router.push('/onboarding')}
            >
              資料ダウンロード
            </Button>
            <Button className="bg-blue-700 text-white hover:bg-blue-600" onClick={() => router.push('/onboarding')}>
              お問い合わせ
            </Button>
          </div>
        </div>
      </nav>

      <section className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:items-center md:py-16">
          <div>
            <p className="text-sm font-medium text-slate-600">在宅薬局の夜間対応を、もっと安心に。</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl">
              夜間の在宅対応を、
              <br />
              任せられる仕組みへ。
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600">
              「任せて在宅」は、在宅薬局の夜間対応を支える医療DXサービスです。
              24時間365日の対応体制と、業務を支援するシステムで、薬局の負担を軽減し、地域の安心を支えます。
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button className="h-12 bg-blue-700 px-6 text-base text-white hover:bg-blue-600" onClick={() => router.push('/onboarding')}>
                資料をダウンロードする
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-12 border-slate-300 bg-white px-6 text-base text-slate-800 hover:bg-slate-50"
                onClick={() => router.push('/onboarding')}
              >
                お問い合わせ
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <img
                src="https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80"
                alt="薬局で働く医療従事者のイメージ"
                className="h-full min-h-[320px] w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 left-6 right-6 rounded-2xl border border-blue-100 bg-white/95 p-4 shadow-lg backdrop-blur">
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">夜間対応の標準化と情報共有を一体で支援</p>
                  <p className="text-xs text-slate-500">受電, 一次対応, 申し送り, 記録管理までを見える化</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-1 max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-4 md:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon
            return (
              <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 text-slate-600">
                  <Icon className="h-5 w-5 text-blue-700" />
                  <span className="text-sm">{metric.label}</span>
                </div>
                <div className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{metric.value}</div>
                <p className="mt-2 text-sm leading-6 text-slate-500">{metric.sublabel}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">任せて在宅のサービス</h2>
          <p className="mt-3 text-slate-600">夜間対応の負担を減らし、薬局の価値を高める4つの支援</p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => {
            const Icon = service.icon
            return (
              <div key={service.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{service.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{service.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section id="flow" className="border-y border-slate-100 bg-slate-50/80">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">夜間対応の流れ（4ステップ）</h2>
            <p className="mt-3 text-slate-600">シンプルな4ステップで、患者さんの安心を支えます</p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {flowSteps.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.step} className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-blue-100 bg-blue-50 text-blue-700">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="mt-4 text-sm font-bold text-blue-700">{step.step}</div>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="value" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">患者・薬局・経営、それぞれに価値を</h2>
          <p className="mt-3 text-slate-600">夜間対応を仕組み化することで、三方にとって持続可能な体制をつくります</p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {valueColumns.map((column) => (
            <div key={column.title} className={`overflow-hidden rounded-2xl border ${column.accent}`}>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-slate-900">{column.title}</h3>
                <ul className="mt-5 space-y-3">
                  {column.points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-sm leading-7 text-slate-700">
                      <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="h-24 bg-gradient-to-r from-white to-slate-100" />
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-8 md:p-10">
          <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-start">
            <div>
              <p className="text-sm font-semibold text-blue-700">選ばれる理由</p>
              <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">夜間対応だけで終わらない、薬局運営の支援へ</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                任せて在宅は、単なる受電代行ではなく、在宅薬局の運用を継続可能にする仕組みづくりを重視しています。
              </p>
            </div>
            <div className="space-y-4">
              {reasons.map((reason, index) => (
                <div key={reason} className="flex gap-4 rounded-2xl border border-white bg-white p-5 shadow-sm">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-7 text-slate-700">{reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 md:py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">よくあるご質問</h2>
            <p className="mt-3 text-slate-600">導入検討時によくいただく内容をまとめています</p>
          </div>

          <div className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
                <h3 className="text-base font-semibold text-slate-900">{faq.question}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50/80">
        <div className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6 md:py-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">サービス資料のダウンロード・お問い合わせ</h2>
          <p className="mt-3 text-slate-600">サービスの詳細や導入事例をまとめた資料をご用意しています。お気軽にご連絡ください。</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button className="h-12 bg-blue-700 px-8 text-base text-white hover:bg-blue-600" onClick={() => router.push('/onboarding')}>
              資料をダウンロードする
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" className="h-12 border-slate-300 bg-white px-8 text-base text-slate-800 hover:bg-slate-50" onClick={() => router.push('/onboarding')}>
              お問い合わせはこちら
            </Button>
          </div>
        </div>
      </section>

      <footer id="company" className="bg-blue-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_1fr_auto] md:items-start">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
                <Pill className="h-4 w-4" />
              </div>
              <div className="text-lg font-bold">任せて在宅</div>
            </div>
            <p className="mt-4 max-w-md text-sm leading-7 text-blue-100/80">
              在宅薬局の夜間対応を支える医療DXサービスとして、薬局運営の標準化と地域医療の持続性向上を支援します。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm text-blue-100/85">
            <div>
              <h3 className="font-semibold text-white">サービスの特徴</h3>
              <ul className="mt-3 space-y-2">
                <li>夜間対応代行</li>
                <li>在宅運用サポート</li>
                <li>多職種連携支援</li>
                <li>データ分析</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white">会社情報</h3>
              <ul className="mt-3 space-y-2">
                <li>会社概要</li>
                <li>お問い合わせ</li>
                <li>プライバシーポリシー</li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-5 text-center shadow-sm">
            <p className="text-xs text-blue-100/70">お電話でのお問い合わせ（平日 9:00〜18:00）</p>
            <p className="mt-3 text-2xl font-bold tracking-tight">03-1234-5678</p>
            <p className="mt-2 text-sm text-blue-100/80">〒000-0000 東京都世田谷区世田谷1-1-1</p>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-blue-100/70 sm:px-6">
          © 2026 任せて在宅株式会社 All Rights Reserved.
        </div>
      </footer>
    </div>
  )
}
