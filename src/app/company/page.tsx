import Image from 'next/image'

const companyItems = [
  { label: '会社名', value: '任せて在宅株式会社（予定）' },
  { label: '事業内容', value: '在宅薬局向け夜間対応支援 / 薬局運用支援 / 地域連携支援' },
  { label: '所在地', value: '東京都内（詳細確認中）' },
  { label: 'お問い合わせ', value: 'お問い合わせページよりご連絡ください。' },
]

export default function CompanyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <p className="text-sm font-bold text-blue-800">COMPANY</p>
          <h1 className="mt-3 text-4xl font-bold tracking-wide text-blue-950">会社概要</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            任せて在宅は、在宅薬局の夜間対応と運用整備を支えるためのサービスです。地域医療を止めない体制づくりを目指しています。
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:items-start">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-blue-950">基本情報</h2>
          <dl className="mt-6 space-y-5">
            {companyItems.map((item) => (
              <div key={item.label} className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                <dt className="text-sm font-semibold text-slate-500">{item.label}</dt>
                <dd className="mt-2 text-base leading-7 text-slate-800">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
          <Image
            src="/homepage-assets/from-reference/logo-full.jpg"
            alt="任せて在宅ロゴ"
            width={420}
            height={160}
            className="h-auto w-full object-contain"
          />
          <p className="mt-6 text-sm leading-7 text-slate-600">
            現時点ではトップページの営業情報を先行して整備しています。会社情報は正式確定に合わせて順次更新します。
          </p>
        </div>
      </section>
    </main>
  )
}
