import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, Download, FileText, Mail, Phone, ShieldCheck, TrendingUp, Users } from 'lucide-react'
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
    name: '在宅立ち上げ伴走',
    label: 'ENTRY',
    price: '100,000',
    note: '月額目安',
    description: '在宅に取り組みたいが、何から整えるべきか分からない薬局向け。月1,000件超の在宅対応実績をもとに、初回患者受入までの型を作ります。',
    image: '/homepage-assets/added/consultation-meeting.jpg',
    features: ['現状診断と在宅ロードマップ作成', 'オーナー・現場向けの教育設計', '必要備品・役割分担・受入基準の整理', '営業導線と初回患者受入までの伴走'],
  },
  {
    name: '運用定着DX',
    label: 'CORE',
    price: '150,000',
    note: '月額目安',
    description: '在宅を一時的なコンサルで終わらせず、日々の業務・患者管理・タスク・記録をWEBアプリ上で回り、件数を継続して増やせる状態にします。',
    image: '/homepage-assets/added/pc-operation.jpg',
    badge: '中心プラン',
    features: ['WEBアプリ利用と運用初期設定', '患者管理・日次対応・回収管理の運用化', '在宅件数と営業状況の見える化', '定例レビューと業務改善提案'],
  },
  {
    name: '夜間連携・拡張',
    label: 'EXPAND',
    price: '個別設計',
    note: '体制・地域に応じて見積',
    description: '日中運用が整った薬局が、無菌調剤など高度な在宅や夜間・緊急対応へ進むための拡張プランです。',
    image: '/homepage-assets/added/night-phone-support.jpg',
    features: ['無菌調剤など高度な手技教育', '夜間接続前チェックと患者情報整備', '薬剤師・地域責任者との運用分担整理', '夜間対応実績の確認と改善'],
  },
]

const included = [
  { icon: Users, title: '月1,000件超の実務知見', text: '在宅調剤を多く扱ってきた現場知見を、他薬局でも再現できる形へ整理します。' },
  { icon: FileText, title: '高度な教育・手技講義', text: '無菌調剤など、他では得にくい手技も動画講義や実地講義で支援します。' },
  { icon: TrendingUp, title: '営業と件数増まで伴走', text: '導入先で在宅件数を継続して増やせるよう、営業と運用改善まで見ます。' },
  { icon: ShieldCheck, title: '特定機材に依存しない', text: '薬局の状況に合わせ、どのような在宅にも対応できる体制づくりを支援します。' },
]

const steps = [
  {
    title: '診断',
    text: '在宅に取り組む意思、現場体制、患者受入準備、夜間方針を確認します。',
    image: '/homepage-assets/added/consultation-meeting.jpg',
  },
  {
    title: '設計',
    text: '薬局ごとのロードマップ、営業導線、教育内容、役割、必要テンプレートを設計します。',
    image: '/homepage-assets/added/training-manual.jpg',
  },
  {
    title: '伴走',
    text: '初回患者受入、スタッフ定着、件数増加に向けた営業と日次運用を一緒に進めます。',
    image: '/homepage-assets/added/pharmacy-team.jpg',
  },
  {
    title: '定着',
    text: 'WEBアプリ上で患者・タスク・記録・回収を回し、継続利用される基盤にします。',
    image: '/homepage-assets/added/phone-pc-work.jpg',
  },
]

const faqs = [
  {
    question: '単発コンサルとの違いは何ですか？',
    answer: '資料を渡して終わりではなく、教育、営業、運用設計、WEBアプリでの日常運用までつなげます。ノウハウを現場に残し、継続的に使われる状態を作る点が違います。',
  },
  {
    question: '夜間対応だけを依頼できますか？',
    answer: '夜間対応は、日中の患者情報や申し送りが整っていることが前提です。まずは在宅運用の状態を確認し、必要な準備を整えてから接続します。',
  },
  {
    question: '料金は固定ですか？',
    answer: '表示金額は目安です。薬局数、在宅患者数、伴走範囲、夜間連携の有無により調整します。正式な料金はヒアリング後に提示します。',
  },
  {
    question: 'どんな薬局が対象ですか？',
    answer: '在宅を始めたい薬局、在宅患者数を増やしたい薬局、無菌調剤など高度な在宅にも対応したい薬局、在宅をやっているが属人化している薬局が主な対象です。',
  },
]

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/homepage-assets/from-reference/logo-mark.jpg" alt="任せて在宅ロゴ" width={40} height={40} className="h-10 w-10 object-contain" />
            <span>
              <span className="block text-xs font-semibold text-slate-600">在宅薬局の立ち上げ・運用支援</span>
              <span className="block text-2xl font-bold tracking-wide text-blue-950">任せて在宅</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-800 lg:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={item.href === '/pricing' ? 'border-b-2 border-blue-800 pb-2 text-blue-900' : 'homepage-nav-link hover:text-blue-700'}>
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
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-16">
          <div>
            <div className="text-xs font-semibold text-slate-500">
              <Link href="/" className="hover:text-blue-800">ホーム</Link>
              <span className="mx-2">/</span>
              <span>料金</span>
            </div>
            <p className="mt-10 text-sm font-bold text-blue-800">PRICING</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-wide text-blue-950 sm:text-5xl">
              在宅薬局を作り、
              <br />
              続く運用へ
            </h1>
            <div className="mt-5 h-1 w-14 rounded-full bg-blue-800" />
            <p className="mt-6 max-w-xl text-sm font-medium leading-8 text-slate-600">
              任せて在宅は、1薬局あたり月1,000件超の在宅対応実績をもとに、田中社長が実務で培ってきた在宅調剤の進め方を、他薬局でも再現できるようにする伴走型サービスです。
              営業、教育、無菌調剤などの手技講義、WEBアプリ運用まで組み込み、どのような在宅にも対応できる薬局づくりを支えます。
            </p>
            <div className="mt-7 inline-flex rounded-md bg-blue-50 px-4 py-2 text-xs font-bold text-blue-900">
              月1,000件超の在宅対応実績 + 営業伴走 + 高度な教育 + WEBアプリを段階的に提供
            </div>
          </div>

          <div className="rounded-lg bg-blue-50/40 px-6 py-8">
            <Image
              src="/homepage-assets/added/pharmacy-team.jpg"
              alt="在宅薬局を支える薬局スタッフチーム"
              width={920}
              height={560}
              className="mx-auto h-auto w-full max-w-xl object-contain"
              priority
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="text-center">
          <p className="text-sm font-bold text-blue-800">PLAN</p>
          <h2 className="mt-2 text-2xl font-bold text-blue-950">薬局の成熟度に合わせた提供プラン</h2>
          <p className="mt-3 text-sm text-slate-600">特定の道具だけに依存する単機能サービスではなく、在宅事業を立ち上げて定着させるための料金設計です。</p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className="relative rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              {plan.badge && <div className="absolute -top-3 left-5 rounded-full bg-blue-800 px-3 py-1 text-xs font-bold text-white shadow-sm">{plan.badge}</div>}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-blue-800">{plan.label}</p>
                  <h3 className="mt-2 text-xl font-bold text-blue-950">{plan.name}</h3>
                </div>
                <Image src={plan.image} alt="" width={92} height={72} className="h-16 w-20 shrink-0 object-contain" />
              </div>
              <p className="mt-4 min-h-24 text-sm leading-7 text-slate-600">{plan.description}</p>
              <div className="mt-5 rounded-md bg-blue-50 px-4 py-3">
                <p className="text-xs font-bold text-blue-900">{plan.note}</p>
                {plan.price === '個別設計' ? (
                  <p className="mt-1 text-2xl font-bold tracking-tight text-blue-950">{plan.price}</p>
                ) : (
                  <p className="mt-1 text-3xl font-bold tracking-tight text-blue-950">月額 {plan.price}円〜</p>
                )}
              </div>
              <ul className="mt-5 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm leading-6 text-slate-700">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-blue-800" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
          {included.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="flex items-start gap-3 border-slate-100 py-2 md:border-r md:pr-4 md:last:border-r-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50">
                  <Icon className="h-5 w-5 text-blue-800" />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-950">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{item.text}</p>
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-center text-xs text-slate-500">表示料金は提案用の目安です。薬局数、対象患者数、支援範囲、夜間連携の有無により最終調整します。</p>
      </section>

      <section className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-bold text-blue-800">PROCESS</p>
            <h2 className="mt-2 text-2xl font-bold text-blue-950">導入から継続利用まで</h2>
            <p className="mt-3 text-sm text-slate-600">在宅を始めるだけでなく、営業で件数を増やし、現場で回り続ける状態まで一緒に作ります。</p>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-4">
            {steps.map((step, index) => (
              <article key={step.title} className="homepage-card relative rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                {index < steps.length - 1 && <ArrowRight className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-blue-700 lg:block" />}
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-800 text-xs font-bold text-white">{String(index + 1).padStart(2, '0')}</div>
                  <h3 className="text-base font-bold text-blue-950">{step.title}</h3>
                </div>
                <p className="mt-3 min-h-16 text-sm leading-7 text-slate-600">{step.text}</p>
                <Image src={step.image} alt="" width={180} height={120} className="mx-auto mt-3 h-24 w-full object-contain" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div className="rounded-lg bg-blue-50 p-8">
            <Image src="/homepage-assets/added/pc-operation.jpg" alt="WEBアプリで運用するスタッフのイラスト" width={360} height={260} className="mx-auto h-auto w-full max-w-sm object-contain" />
          </div>
          <div>
            <p className="text-sm font-bold text-blue-800">WHY CONTINUE</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-blue-950">満足したら終わり、にしないためのWEBアプリ</h2>
            <p className="mt-5 text-sm leading-8 text-slate-600">
              従来の在宅コンサルは、ノウハウが伝わると契約が終わりやすい構造があります。任せて在宅では、患者管理、日次対応、教育、記録、回収管理、営業状況、夜間連携をアプリ上の運用に組み込み、薬局の日常業務そのものを支える形にします。
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {['患者・訪問予定が日々の業務で使われる', '無菌調剤などの教育とタスクが残り続ける', '在宅件数と営業状況が経営判断につながる', '夜間連携の前提情報として必要になる'].map((item) => (
                <div key={item} className="rounded-md border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-700 shadow-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-bold text-blue-800">FAQ</p>
            <h2 className="mt-2 text-2xl font-bold text-blue-950">よくあるご質問（料金・提供範囲）</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <article key={faq.question} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-bold text-blue-950">Q. {faq.question}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">A. {faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-6 rounded-lg bg-blue-50 p-6 sm:grid-cols-[0.7fr_1.2fr_1fr] sm:items-center">
          <Image src="/homepage-assets/added/greeting-consultant.jpg" alt="" width={180} height={140} className="hidden h-28 w-full object-contain sm:block" />
          <div>
            <h2 className="text-xl font-bold text-blue-950">まずは在宅化の現状診断から</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">料金だけで判断するのではなく、薬局がどの段階にあり、どこまで伴走が必要かを一緒に整理します。</p>
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
            <p className="mt-4 max-w-sm text-sm leading-7 text-blue-100">在宅薬局の立ち上げ、運用定着、夜間連携までを支える薬局DXサービスです。</p>
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
            <p className="mt-3 flex items-center gap-3 text-2xl font-bold"><Phone className="h-6 w-6" />03-1234-5678</p>
          </div>
        </div>
        <div className="border-t border-white/15 py-4 text-center text-xs text-blue-100">© 2026 任せて在宅</div>
      </footer>
    </main>
  )
}
