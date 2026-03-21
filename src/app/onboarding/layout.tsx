import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '任せて在宅 | 導入支援',
  description: '在宅薬局の導入から初回受入までを伴走支援するアプリ',
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-6 pb-24">
        {children}
      </div>
    </div>
  )
}
