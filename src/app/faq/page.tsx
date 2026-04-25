import { PublicSiteHeader } from '@/components/public-site-header'

const faqs = [
  {
    question: 'どのような薬局が対象ですか？',
    answer: '在宅をこれから始めたい薬局、在宅患者数を増やしたい薬局、在宅を行っているが属人化している薬局、無菌調剤など高度な在宅にも対応したい薬局が主な対象です。',
  },
  {
    question: '在宅をまだ始めていない段階でも相談できますか？',
    answer: '相談できます。現状診断から始め、必要備品、役割分担、患者受入基準、営業導線、初回患者対応まで順に整理します。',
  },
  {
    question: '教育サービスとの違いは何ですか？',
    answer: '教育だけで終わらず、営業、患者受入、日次運用、WEBアプリでの定着まで含めて支援する点が違います。在宅件数を増やし続ける運用を重視しています。',
  },
  {
    question: '無菌調剤など高度な手技も学べますか？',
    answer: 'はい。田中平および一部の技術者が、無菌調剤など通常の研修だけでは学びにくい内容も、動画講義や実地講義を組み合わせて支援します。',
  },
  {
    question: '特定の機材や道具を前提にしたサービスですか？',
    answer: '特定の道具だけに依存する設計ではありません。薬局の規模、地域性、スタッフ体制に合わせて、汎用的に回る在宅運用を整えます。',
  },
  {
    question: '在宅件数を増やすための営業も支援しますか？',
    answer: '支援します。医師との話し合いへの参加、信頼関係づくり、手技説明、同行営業、ケアマネ営業まで、営業と運用をつなげて整理します。営業資料作成はオプションです。',
  },
  {
    question: 'WEBアプリでは何を管理しますか？',
    answer: '患者情報、訪問予定、日次タスク、申し送り、回収状況、営業状況などを管理し、薬局の日常業務に在宅運用を組み込みます。',
  },
  {
    question: 'なぜWEBアプリまで必要なのですか？',
    answer: '単発の助言や研修だけでは、現場に残りにくいためです。日々使う業務基盤として組み込むことで、継続的に使われる状態を作ります。',
  },
  {
    question: '夜間はどこまで対応しますか？',
    answer: '日中運用と患者情報が整った薬局から、夜間受付、状況整理、必要な連携、記録、翌朝への申し送りまで段階的に設計します。',
  },
  {
    question: '夜間対応だけを依頼できますか？',
    answer: '夜間対応はオプションとして追加可能です。日中の患者情報や申し送りが整っていることを確認し、必要な準備を整えてから接続します。',
  },
  {
    question: '料金はどのように決まりますか？',
    answer: '薬局数、在宅患者数、伴走範囲、教育範囲、夜間連携の有無によって調整します。初期費用や正式条件は資料にて提示します。無菌調剤講義は料金範囲内の想定です。',
  },
  {
    question: '導入前にどこまで相談できますか？',
    answer: '現在の体制、在宅患者数、スタッフ教育状況、営業課題、夜間方針などを伺い、どの段階から始めるべきかを一緒に整理できます。',
  },
]

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <PublicSiteHeader />
      <section className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <p className="text-sm font-bold text-blue-800">FAQ</p>
          <h1 className="mt-3 text-4xl font-bold tracking-wide text-blue-950">よくあるご質問</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            任せて在宅の支援範囲、教育、営業、WEBアプリ、夜間連携について、導入前に確認されやすい内容をまとめています。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <article key={faq.question} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-blue-950">{faq.question}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
