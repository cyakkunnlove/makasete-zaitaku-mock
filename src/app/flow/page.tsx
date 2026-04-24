const steps = [
  {
    title: 'ご相談・ヒアリング',
    description: '現在の夜間体制、在宅患者数、課題感を整理します。',
  },
  {
    title: '運用設計',
    description: '対応範囲、連絡手順、申し送り方法、役割分担を設計します。',
  },
  {
    title: '初期設定・テスト',
    description: '現場運用に合わせて初期導線を確認し、試験的に流れを整えます。',
  },
  {
    title: '本番開始・改善',
    description: '運用開始後も記録と振り返りを通じて改善を継続します。',
  },
]

export default function FlowPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <p className="text-sm font-bold text-blue-800">FLOW</p>
          <h1 className="mt-3 text-4xl font-bold tracking-wide text-blue-950">導入への流れ</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            ご相談から本番運用開始まで、薬局の現場に合わせて段階的に進めます。
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
