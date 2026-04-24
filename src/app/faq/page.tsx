const faqs = [
  {
    question: 'どのような薬局が対象ですか？',
    answer: '在宅患者対応を行っている薬局、または今後在宅対応を強化したい薬局を主な対象としています。',
  },
  {
    question: '夜間はどこまで対応しますか？',
    answer: '一次受付、状況整理、必要な連携、記録、翌朝への申し送りまでを基本に設計しています。詳細は運用方針に応じて調整します。',
  },
  {
    question: '薬の配送も含まれますか？',
    answer: '必要に応じて配送導線まで含めた運用設計を想定しています。地域や提携体制に応じて実装範囲を整理します。',
  },
  {
    question: '導入前に相談できますか？',
    answer: 'はい。現状の夜間体制や人員状況を伺いながら、導入イメージをすり合わせます。',
  },
]

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <p className="text-sm font-bold text-blue-800">FAQ</p>
          <h1 className="mt-3 text-4xl font-bold tracking-wide text-blue-950">よくあるご質問</h1>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="space-y-4">
          {faqs.map((faq) => (
            <article key={faq.question} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-blue-950">{faq.question}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
