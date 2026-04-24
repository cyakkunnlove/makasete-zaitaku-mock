'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Check,
  Download,
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

const stats: StatCard[] = [
  {
    label: '夜間相談の体制',
    value: '24時間',
    note: '夜間・休日も相談を受けられる体制づくり',
    image: '/homepage-assets/icons/clock-24h.jpg',
    alt: '24時間対応の時計アイコン',
  },
  {
    label: '初動の標準化',
    value: '一次受付',
    note: '症状・服薬状況・緊急度を同じ型で確認',
    image: '/homepage-assets/icons/headset-simple.jpg',
    alt: 'ヘッドセットのアイコン',
  },
  {
    label: '記録と申し送り',
    value: '共有',
    note: '翌朝の薬局へ対応内容をわかりやすく共有',
    image: '/homepage-assets/icons/document-check.jpg',
    alt: '記録書類のアイコン',
  },
  {
    label: '対象薬局',
    value: '在宅薬局',
    note: '在宅患者を支える薬局の継続運用を支援',
    image: '/homepage-assets/icons/pharmacy-storefront.jpg',
    alt: '薬局店舗のアイコン',
  },
]

const marketCards: MarketCard[] = [
  {
    title: '在宅医療ニーズの増加',
    description: '高齢化と地域包括ケアの流れにより、薬局にも在宅患者を継続的に支える役割が求められています。',
  },
  {
    title: '夜間・休日対応の負担',
    description: '24時間対応を掲げるほど、受電、判断、薬の手配、翌朝の申し送りが薬局現場の大きな負担になります。',
  },
  {
    title: '属人化しやすい運用',
    description: '担当者の経験に依存すると、確認漏れ、記録漏れ、引き継ぎ不足が起きやすく、拡大時の障害になります。',
  },
]

const services: ServiceCard[] = [
  {
    number: '01',
    title: '24時間365日の相談受付',
    description: '夜間・休日の連絡を受け、症状や服薬状況を整理します。',
    image: '/homepage-assets/icons/support-24h-phone.jpg',
    alt: '24時間電話相談のイラスト',
  },
  {
    number: '02',
    title: '薬剤師による安心対応',
    description: '経験豊富な薬剤師が状況を確認し、必要な助言や処方提案につなげます。',
    image: '/homepage-assets/icons/pharmacist-consultation.jpg',
    alt: '薬剤師が相談対応しているイラスト',
  },
  {
    number: '03',
    title: '薬の手配・配送まで接続',
    description: '必要な薬の手配から患者さま宅への配送まで、運用導線として整理します。',
    image: '/homepage-assets/icons/delivery-truck.jpg',
    alt: '薬の配送車のイラスト',
  },
  {
    number: '04',
    title: '薬局の負担を大幅に軽減',
    description: '夜間対応の体制構築や人員確保の負担を抑え、本業に集中できる環境を支援します。',
    image: '/homepage-assets/icons/pharmacist-workstation.jpg',
    alt: '薬局業務を支える薬剤師のイラスト',
  },
]

const flows: FlowCard[] = [
  {
    number: '01',
    title: '患者さまからの連絡',
    description: '患者さまやご家族から薬局へご連絡',
    image: '/homepage-assets/icons/patient-phone.jpg',
    alt: '患者が電話しているイラスト',
  },
  {
    number: '02',
    title: '薬剤師が状況を確認',
    description: '症状・服薬状況・緊急度を確認',
    image: '/homepage-assets/icons/operator-laptop.jpg',
    alt: '電話を受けながら確認するイラスト',
  },
  {
    number: '03',
    title: '適切な対応を実施',
    description: '助言・処方提案・医師連携などを実施',
    image: '/homepage-assets/icons/pharmacist-pointing.jpg',
    alt: '薬剤師が説明しているイラスト',
  },
  {
    number: '04',
    title: '薬の手配・配送',
    description: '必要な薬を手配し、ご自宅へお届け',
    image: '/homepage-assets/icons/handover-medicine.jpg',
    alt: '薬を受け渡しているイラスト',
  },
]

const values: ValueCard[] = [
  {
    title: '患者さまにとって',
    points: ['夜間や休日も安心して相談できる', '自宅で必要な薬を受け取れる', '切れ目のない在宅医療を実現'],
    image: '/homepage-assets/icons/patients-family.jpg',
    alt: '患者と家族のイラスト',
    tone: 'bg-sky-50',
  },
  {
    title: '薬局にとって',
    points: ['夜間対応の負担を大幅に軽減', '薬剤師不足の解消に貢献', '本業に集中でき、収益性も向上'],
    image: '/homepage-assets/icons/two-pharmacists-waving.jpg',
    alt: '薬剤師チームのイラスト',
    tone: 'bg-emerald-50',
  },
  {
    title: '経営にとって',
    points: ['地域で選ばれる薬局に', '安定した運営体制を構築', '在宅医療の強化で差別化を実現'],
    image: '/homepage-assets/icons/doctor-arms-crossed.jpg',
    alt: '医療従事者のイラスト',
    tone: 'bg-indigo-50',
  },
]

export default function HomePage() {
  const router = useRouter()

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
              <span className="block text-xs font-semibold text-slate-600">在宅薬局の夜間対応パートナー</span>
              <span className="block text-2xl font-bold tracking-wide text-blue-950">任せて在宅</span>
            </span>
          </button>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-800 lg:flex">
            <a href="#features" className="hover:text-blue-700">サービスの特徴</a>
            <a href="#market" className="hover:text-blue-700">市場背景</a>
            <a href="/flow" className="hover:text-blue-700">導入への流れ</a>
            <a href="/faq" className="hover:text-blue-700">よくあるご質問</a>
            <a href="/company" className="hover:text-blue-700">会社概要</a>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
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
        </div>
      </header>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:py-20">
          <div>
            <p className="text-sm font-bold text-blue-900">夜間も、在宅医療を止めない。</p>
            <h1 className="mt-6 text-4xl font-bold leading-[1.35] tracking-wide text-blue-950 sm:text-5xl lg:text-6xl">
              夜間も、在宅医療を
              <br />
              止めない安心を。
            </h1>
            <p className="mt-6 max-w-xl text-base font-medium leading-8 text-slate-700">
              任せて在宅は、24時間365日体制で薬剤師対応を支える運用支援サービスです。
              薬局の負担を軽減し、患者さまと地域に安心を届けます。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                className="h-14 w-full rounded-md bg-blue-800 px-7 text-base font-bold text-white hover:bg-blue-700 sm:w-auto"
                onClick={() => router.push('/contact')}
              >
                <Download className="mr-2 h-5 w-5" />
                資料をダウンロードする
              </Button>
              <Button
                variant="outline"
                className="h-14 w-full rounded-md border-blue-900 !bg-white px-7 text-base font-bold !text-blue-950 hover:!bg-blue-50 sm:w-auto"
                onClick={() => router.push('/contact')}
              >
                <Mail className="mr-2 h-5 w-5" />
                お問い合わせはこちら
              </Button>
            </div>
          </div>

          <div className="relative min-h-[340px] rounded-lg bg-blue-50/40 p-6 sm:min-h-[430px]">
            <Image
              src="/homepage-assets/from-reference/hero-pharmacy-team.jpg"
              alt="薬剤師チームのイラスト"
              fill
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-contain p-5"
            />
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 pb-14 sm:px-6 md:grid-cols-4">
          {stats.map((stat) => (
            <article key={stat.label} className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
              <p className="text-sm font-bold text-blue-950">{stat.label}</p>
              <div className="mt-3 text-4xl font-bold tracking-tight text-blue-950">{stat.value}</div>
              <p className="mt-2 min-h-10 text-xs leading-5 text-slate-500">{stat.note}</p>
              <Image
                src={stat.image}
                alt={stat.alt}
                width={88}
                height={88}
                className="mx-auto mt-4 h-20 w-20 object-contain"
              />
            </article>
          ))}
        </div>
      </section>

      <section id="market" className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold text-blue-800">MARKET BACKGROUND</p>
            <h2 className="mt-3 text-3xl font-bold tracking-wide text-blue-950">在宅薬局の夜間対応は、仕組み化が必要な段階へ</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              在宅医療の需要が高まる一方で、薬局現場では夜間・休日対応、薬剤師の負担、申し送りの属人化が大きな課題になっています。
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {marketCards.map((card) => (
              <article key={card.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-blue-950">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
              </article>
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
            {services.map((service) => (
              <article key={service.number} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-800 text-sm font-bold text-white">
                  {service.number}
                </div>
                <h3 className="mt-5 min-h-14 text-lg font-bold leading-7 text-blue-950">{service.title}</h3>
                <p className="mt-3 min-h-24 text-sm leading-7 text-slate-600">{service.description}</p>
                <Image
                  src={service.image}
                  alt={service.alt}
                  width={210}
                  height={150}
                  className="mx-auto mt-4 h-32 w-full object-contain"
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="flow" className="border-y border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="flex items-center justify-center gap-5">
            <span className="hidden h-px w-28 bg-slate-300 sm:block" />
            <h2 className="text-center text-3xl font-bold tracking-wide text-blue-950">夜間対応の流れ</h2>
            <span className="hidden h-px w-28 bg-slate-300 sm:block" />
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {flows.map((flow, index) => (
              <article key={flow.number} className="relative rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
                {index < flows.length - 1 && (
                  <ArrowRight className="absolute -right-4 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-blue-700 md:block" />
                )}
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-800 text-sm font-bold text-white">
                  {flow.number}
                </div>
                <h3 className="mt-4 text-base font-bold text-blue-950">{flow.title}</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{flow.description}</p>
                <Image
                  src={flow.image}
                  alt={flow.alt}
                  width={180}
                  height={140}
                  className="mx-auto mt-4 h-28 w-full object-contain"
                />
              </article>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              className="rounded-md border-blue-900 !bg-white px-6 !text-blue-950 hover:!bg-blue-50"
              onClick={() => router.push('/flow')}
            >
              導入への流れを詳しく見る
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="flex items-center justify-center gap-5">
            <span className="hidden h-px w-28 bg-slate-300 sm:block" />
            <h2 className="text-center text-3xl font-bold tracking-wide text-blue-950">患者さま・薬局・経営それぞれに価値を提供</h2>
            <span className="hidden h-px w-28 bg-slate-300 sm:block" />
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {values.map((value) => (
              <article key={value.title} className={`rounded-lg border border-slate-200 p-7 shadow-sm ${value.tone}`}>
                <h3 className="text-center text-xl font-bold text-blue-950">{value.title}</h3>
                <ul className="mt-5 space-y-3">
                  {value.points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-sm font-medium leading-7 text-slate-700">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-blue-800" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <Image
                  src={value.image}
                  alt={value.alt}
                  width={260}
                  height={150}
                  className="mx-auto mt-6 h-32 w-full object-contain"
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-white px-4 pb-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-lg bg-blue-50 p-8 md:grid-cols-[180px_1fr_360px] md:items-center">
          <Image
            src="/homepage-assets/icons/doctor-pointing.jpg"
            alt="案内する薬剤師のイラスト"
            width={180}
            height={150}
            className="hidden h-36 w-full object-contain md:block"
          />
          <div>
            <h2 className="text-2xl font-bold text-blue-950">詳しいサービス資料をご用意しています</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              サービスの詳細や導入時の確認事項をまとめた資料をご用意しています。お気軽にご請求・お問い合わせください。
            </p>
          </div>
          <div className="grid gap-3">
            <Button
              className="h-12 rounded-md bg-blue-800 text-white hover:bg-blue-700"
              onClick={() => router.push('/contact')}
            >
              <Download className="mr-2 h-5 w-5" />
              資料をダウンロードする
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-md border-blue-900 !bg-white !text-blue-950 hover:!bg-blue-50"
              onClick={() => router.push('/contact')}
            >
              <Mail className="mr-2 h-5 w-5" />
              お問い合わせはこちら
            </Button>
          </div>
        </div>
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
              在宅薬局の夜間対応パートナーとして、24時間体制の薬剤師対応で、在宅医療を支える薬局の負担を軽減します。
            </p>
          </div>
          <div>
            <h3 className="font-bold">サービス</h3>
            <ul className="mt-4 space-y-2 text-sm text-blue-100">
              <li><a href="#features">サービスの特徴</a></li>
              <li><a href="/flow">導入への流れ</a></li>
              <li><a href="/company">会社概要</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold">サポート</h3>
            <ul className="mt-4 space-y-2 text-sm text-blue-100">
              <li><a href="/faq">よくあるご質問</a></li>
              <li><a href="/contact">資料ダウンロード</a></li>
              <li><a href="/contact">お問い合わせ</a></li>
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
