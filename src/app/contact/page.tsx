import Image from 'next/image'
import { Mail, Phone } from 'lucide-react'

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <p className="text-sm font-bold text-blue-800">CONTACT</p>
          <h1 className="mt-3 text-4xl font-bold tracking-wide text-blue-950">お問い合わせ</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            導入相談、資料請求、在宅立ち上げ、教育、運用DX、夜間連携に関するご相談はこちらから受け付けます。正式フォーム実装前の仮ページです。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-blue-950">お問い合わせ内容</h2>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
              <li>・サービス資料の請求</li>
              <li>・導入可能性の相談</li>
              <li>・在宅立ち上げや教育体制の相談</li>
              <li>・運用設計や導入準備の相談</li>
              <li>・夜間対応フローの確認</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <Image
              src="/homepage-assets/added/profile-card.jpg"
              alt="問い合わせ先情報を示すカードのイラスト"
              width={260}
              height={150}
              className="mx-auto mb-6 h-24 w-full object-contain"
            />
            <h2 className="text-xl font-bold text-blue-950">連絡方法</h2>
            <div className="mt-5 space-y-4 text-sm text-slate-700">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-800" />
                <span>フォーム実装予定（仮）</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-blue-800" />
                <span>03-1234-5678（仮）</span>
              </div>
            </div>
            <p className="mt-6 text-sm leading-7 text-slate-600">
              ※ 電話番号・フォーム接続先は正式情報確定後に反映します。
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
