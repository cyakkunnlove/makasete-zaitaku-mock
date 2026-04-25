import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  CircleDollarSign,
  Download,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  { label: 'サービスの特徴', href: '/#features' },
  { label: '導入事例', href: '/#market' },
  { label: 'ご利用の流れ', href: '/flow' },
  { label: 'よくあるご質問', href: '/faq' },
  { label: '料金', href: '/pricing' },
]

const plans = [
  {
    name: 'ライトプラン',
    subtitle: 'まずは夜間受付の負担を抑えたい薬局に',
    price: '20,000',
    tax: '税込 22,000円〜',
    tone: 'border-emerald-100 bg-emerald-50/55',
    features: ['夜間の一次受付', '状況確認と記録作成', '翌朝の申し送り共有'],
    recommendation: ['在宅患者数が少ない薬局', '段階的に試したい薬局'],
  },
  {
    name: 'スタンダードプラン',
    subtitle: '夜間対応を安心して任せたい薬局に',
    price: '30,000',
    tax: '税込 33,000円〜',
    tone: 'border-blue-200 bg-white',
    features: ['24時間365日の相談受付', '薬剤師による状況整理', '処方提案・医師連携の補助', '薬の手配・配送導線の整理', '対応記録の作成・共有'],
    recommendation: ['夜間対応の属人化を減らしたい薬局', '在宅対応を継続的に伸ばしたい薬局'],
  },
  {
    name: 'プレミアムプラン',
    subtitle: '運用設計まで含めて大きく整えたい薬局に',
    price: '50,000',
    tax: '税込 55,000円〜',
    tone: 'border-blue-300 bg-blue-50/65 ring-2 ring-blue-100',
    badge: '人気 No.1',
    features: ['スタンダードの内容すべて', '薬局ごとの運用設計サポート', '医師・ケアマネ等との連携支援', '定例レポートの提供', '業務改善ミーティング'],
    recommendation: ['夜間負担を大幅に減らしたい薬局', '地域連携も強化したい薬局'],
  },
]

const benefits = [
  { icon: CircleDollarSign, title: '初期費用 0円', text: '月額費用から始められる想定です。' },
  { icon: FileText, title: '契約期間の縛りなし', text: '小さく始めて、運用に合わせて調整できます。' },
  { icon: Users, title: '専任担当が伴走', text: '導入前後の確認を担当者が支援します。' },
  { icon: ShieldCheck, title: '責任範囲を整理', text: '対応範囲と申し送りの型を明確にします。' },
]

const steps = [
  { title: 'お問い合わせ・ご相談', text: '現状の夜間体制や在宅患者数を確認します。', illustration: 'consultation' },
  { title: 'お見積り・ご提案', text: '薬局規模と必要な支援範囲に合わせて整理します。', illustration: 'proposal' },
  { title: 'ご契約・初期設定', text: '連絡先、記録様式、申し送り方法を整えます。', illustration: 'setup' },
  { title: '運用開始', text: '夜間対応を開始し、必要に応じて改善します。', illustration: 'start' },
]

const faqs = [
  {
    question: '追加料金はありますか？',
    answer: '基本料金の範囲で開始できる想定です。大きな個別対応が必要な場合は事前にご相談します。',
  },
  {
    question: '支払い方法は選べますか？',
    answer: '口座振替または請求書払いを想定しています。正式運用時に確定します。',
  },
  {
    question: '途中でプラン変更できますか？',
    answer: 'はい。患者数や夜間対応の状況に合わせて、月単位で見直せる設計を想定しています。',
  },
  {
    question: '料金は確定ですか？',
    answer: '現在は提案用の料金設計です。正式提供時には対応範囲とあわせて最終確認します。',
  },
]

function LineIllustration({ type, className = '' }: { type: string; className?: string }) {
  const shared = 'fill-none stroke-blue-950 stroke-[2.6] stroke-linecap-round stroke-linejoin-round'

  if (type === 'hero') {
    return (
      <svg viewBox="0 0 520 260" className={className} role="img" aria-label="料金プランを相談する薬剤師のイラスト">
        <g className={shared}>
          <path d="M62 204h70M385 204h72M86 178v-54h62v54M398 178v-46h58v46" />
          <path d="M98 124v-18h12v18M123 124v-26h12v26M412 132v-20h12v20M438 132v-28h12v28" />
          <path d="M198 196v-72M182 119c18-20 55-18 70 6M189 106l44-20 18 24" />
          <path d="M185 144c12 10 29 10 42 1M207 153c-3 18-14 34-31 44M229 153c3 18 14 34 31 44" />
          <path d="M292 192V72h96v120M314 104h44M314 132h48M314 160h36" />
          <path d="m307 104 7 7 15-18M307 132l7 7 15-18M307 160l7 7 15-18" />
          <path d="M414 196v-68M399 122c16-18 48-15 60 6M405 112l32-18 20 19" />
          <path d="M402 146c11 11 27 11 38 0M421 158c-9 13-12 25-9 38M444 158c10 13 15 25 16 38" />
          <path d="M76 86h42M430 82h46M68 86c0-12 10-22 22-22h18M422 82c0-13 11-24 24-24h19" />
        </g>
      </svg>
    )
  }

  const speech = type === 'consultation'
  const document = type === 'proposal'
  const laptop = type === 'setup'

  return (
    <svg viewBox="0 0 220 150" className={className} role="img" aria-label={`${type}のイラスト`}>
      <g className={shared}>
        <path d="M54 126c4-25 17-38 39-38s35 13 39 38" />
        <path d="M74 58c13-15 40-12 49 4M78 52l28-14 13 17" />
        <path d="M76 78c10 9 25 9 35 0M96 89c-3 13-11 25-23 34M114 89c8 11 12 22 12 34" />
        {speech && (
          <>
            <path d="M139 40h45c10 0 18 8 18 18v18c0 10-8 18-18 18h-20l-16 14 4-14h-13c-10 0-18-8-18-18V58c0-10 8-18 18-18Z" />
            <path d="M146 64h32M146 78h22" />
          </>
        )}
        {document && (
          <>
            <path d="M144 32h46v76h-46zM156 52h22M156 69h24M156 86h18" />
            <path d="m151 52 5 5 10-13" />
          </>
        )}
        {laptop && (
          <>
            <path d="M134 52h56v45h-56zM121 112h84l-11-15h-62z" />
            <path d="M150 72h25M150 85h17" />
          </>
        )}
        {!speech && !document && !laptop && (
          <>
            <path d="M143 48c16 5 27 19 27 36 0 21-17 38-38 38" />
            <path d="m156 46-13 2 8 11M178 64l15-1 2 15" />
            <path d="M157 99h38M176 80v38" />
          </>
        )}
      </g>
    </svg>
  )
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
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
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-800 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={item.href === '/pricing' ? 'border-b-2 border-blue-800 pb-2 text-blue-900' : 'homepage-nav-link hover:text-blue-700'}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Button asChild variant="outline" className="h-11 rounded-md border-blue-900 !bg-white px-5 font-semibold !text-blue-950 hover:!bg-blue-50">
              <Link href="/contact">資料ダウンロード</Link>
            </Button>
            <Button asChild className="h-11 rounded-md bg-blue-800 px-5 font-semibold text-white hover:bg-blue-700">
              <Link href="/contact">お問い合わせ</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:py-16">
          <div>
            <div className="text-xs font-semibold text-slate-500">
              <Link href="/" className="hover:text-blue-800">ホーム</Link>
              <span className="mx-2">/</span>
              <span>料金</span>
            </div>
            <p className="mt-10 text-sm font-bold text-blue-800">PRICING</p>
            <h1 className="mt-4 text-4xl font-bold tracking-wide text-blue-950 sm:text-5xl">料金プラン</h1>
            <div className="mt-4 h-1 w-14 rounded-full bg-blue-800" />
            <p className="mt-6 max-w-xl text-sm font-medium leading-8 text-slate-600">
              薬局の在宅患者数や夜間対応の範囲に合わせて、無理なく始められる料金設計にしています。
              まずは必要な支援だけを選び、運用に合わせて広げられます。
            </p>
            <div className="mt-7 inline-flex rounded-md bg-blue-50 px-4 py-2 text-xs font-bold text-blue-900">
              すべてのプランで夜間相談・記録共有の基本導線に対応
            </div>
          </div>

          <div className="rounded-lg bg-blue-50/40 px-4 py-6">
            <LineIllustration type="hero" className="mx-auto h-auto w-full max-w-2xl" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="text-center">
          <p className="text-sm font-bold text-blue-800">PLAN</p>
          <h2 className="mt-2 text-2xl font-bold text-blue-950">料金プラン一覧</h2>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className={`relative rounded-lg border p-6 shadow-sm ${plan.tone}`}>
              {plan.badge && (
                <div className="absolute -top-3 left-5 rounded-full bg-blue-800 px-3 py-1 text-xs font-bold text-white shadow-sm">
                  {plan.badge}
                </div>
              )}
              <h3 className="text-center text-xl font-bold text-blue-950">{plan.name}</h3>
              <p className="mt-2 min-h-10 text-center text-sm font-medium leading-6 text-slate-600">{plan.subtitle}</p>
              <div className="mt-6 text-center">
                <span className="text-sm font-bold text-slate-600">月額 </span>
                <span className="text-4xl font-bold tracking-tight text-blue-950">{plan.price}</span>
                <span className="text-sm font-bold text-slate-600"> 円〜</span>
                <p className="mt-1 text-xs text-slate-500">{plan.tax}</p>
              </div>
              <div className="my-6 border-t border-slate-200" />
              <p className="text-center text-xs font-bold text-slate-500">プランの特徴</p>
              <ul className="mt-4 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm leading-6 text-slate-700">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-blue-800" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-md bg-white/75 p-4 text-center">
                <p className="text-xs font-bold text-blue-900">こんな薬局におすすめ</p>
                <p className="mt-2 text-xs leading-6 text-slate-600">{plan.recommendation.join(' / ')}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
          {benefits.map((benefit) => {
            const Icon = benefit.icon
            return (
              <div key={benefit.title} className="flex items-start gap-3 border-slate-100 py-2 md:border-r md:pr-4 md:last:border-r-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50">
                  <Icon className="h-5 w-5 text-blue-800" />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-950">{benefit.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{benefit.text}</p>
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-center text-xs text-slate-500">
          表示料金は提案用の目安です。対応範囲、対象エリア、薬局ごとの運用条件により最終調整します。
        </p>
      </section>

      <section className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-bold text-blue-800">START FLOW</p>
            <h2 className="mt-2 text-2xl font-bold text-blue-950">ご利用開始までの流れ</h2>
            <p className="mt-3 text-sm text-slate-600">最短2週間程度で、夜間対応の運用開始を目指します。</p>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-4">
            {steps.map((step, index) => (
              <article key={step.title} className="homepage-card relative rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                {index < steps.length - 1 && <ArrowRight className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-blue-700 lg:block" />}
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-800 text-xs font-bold text-white">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <h3 className="text-sm font-bold text-blue-950">{step.title}</h3>
                </div>
                <p className="mt-3 min-h-12 text-xs leading-6 text-slate-600">{step.text}</p>
                <LineIllustration type={step.illustration} className="mx-auto mt-3 h-28 w-full" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="text-center">
          <p className="text-sm font-bold text-blue-800">FAQ</p>
          <h2 className="mt-2 text-2xl font-bold text-blue-950">よくあるご質問（料金について）</h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {faqs.map((faq) => (
            <article key={faq.question} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-blue-950">Q. {faq.question}</p>
              <p className="mt-3 text-xs leading-6 text-slate-600">A. {faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white px-4 pb-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-5 rounded-lg bg-blue-50 p-6 sm:grid-cols-[0.7fr_1.2fr_1fr] sm:items-center">
          <LineIllustration type="proposal" className="hidden h-28 w-full sm:block" />
          <div>
            <h2 className="text-xl font-bold text-blue-950">サービス資料のダウンロード・お問い合わせ</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              料金の詳細や導入条件を確認したい場合は、資料請求またはお問い合わせからご相談ください。
            </p>
          </div>
          <div className="grid gap-3">
            <Button asChild className="h-12 rounded-md bg-blue-800 font-bold text-white hover:bg-blue-700">
              <Link href="/contact"><Download className="mr-2 h-4 w-4" />資料をダウンロードする</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-md border-blue-900 !bg-white font-bold !text-blue-950 hover:!bg-blue-50">
              <Link href="/contact"><Mail className="mr-2 h-4 w-4" />お問い合わせはこちら</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="bg-blue-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_0.7fr_0.7fr_0.9fr]">
          <div>
            <div className="flex items-center gap-3">
              <Image src="/homepage-assets/from-reference/logo-mark.jpg" alt="任せて在宅ロゴ" width={36} height={36} className="h-9 w-9 rounded bg-white object-contain p-1" />
              <div className="text-2xl font-bold">任せて在宅</div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-7 text-blue-100">
              在宅薬局の夜間対応パートナーとして、24時間体制の薬剤師対応で、薬局の負担を軽減します。
            </p>
          </div>
          <div>
            <h3 className="font-bold">サービス</h3>
            <ul className="mt-4 space-y-2 text-sm text-blue-100">
              <li><Link href="/#features">サービスの特徴</Link></li>
              <li><Link href="/flow">導入への流れ</Link></li>
              <li><Link href="/pricing">料金</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold">サポート</h3>
            <ul className="mt-4 space-y-2 text-sm text-blue-100">
              <li><Link href="/faq">よくあるご質問</Link></li>
              <li><Link href="/contact">資料ダウンロード</Link></li>
              <li><Link href="/contact">お問い合わせ</Link></li>
              <li><Link href="/login">ログイン</Link></li>
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
