import { PublicSiteHeader } from '@/components/public-site-header'

const steps = [
  {
    title: '現状診断',
    description: '在宅への取り組み状況、スタッフ体制、営業課題、患者受入準備、夜間方針を整理します。',
  },
  {
    title: 'ロードマップ設計',
    description: '薬局ごとの目標に合わせて、同行営業、ケアマネ営業、教育内容、受入基準、役割分担、必要テンプレートを設計します。',
  },
  {
    title: '教育・初回受入',
    description: '基礎教育、無菌調剤などの手技講義、初回患者受入、医師との話し合いやケアマネ連携を伴走します。',
  },
  {
    title: 'WEBアプリで定着',
    description: '患者管理、日次タスク、申し送り、回収状況、営業状況を日々の業務として回る状態にします。',
  },
  {
    title: '夜間連携へ拡張',
    description: '日中運用と患者情報が整った薬局から、夜間受付、記録、翌朝申し送りへ段階的に接続します。',
  },
]

export default function FlowPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <PublicSiteHeader />
      <section className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <p className="text-sm font-bold text-blue-800">FLOW</p>
          <h1 className="mt-3 text-4xl font-bold tracking-wide text-blue-950">導入への流れ</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            ご相談から在宅立ち上げ、教育、運用定着、夜間連携まで、薬局の現場に合わせて段階的に進めます。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <article key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-800 text-sm font-bold text-white">
                  {index + 1}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-blue-950">{step.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
