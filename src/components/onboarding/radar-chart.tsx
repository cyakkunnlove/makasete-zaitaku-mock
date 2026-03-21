'use client'

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import type { AxisScore } from '@/lib/onboarding'

interface OnboardingRadarChartProps {
  data: AxisScore[]
  compact?: boolean
}

export function OnboardingRadarChart({ data, compact = false }: OnboardingRadarChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    subject: compact
      ? item.subject.replace('夜間接続準備', '夜間').replace('役割分担', '役割')
      : item.subject,
  }))

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={compact ? 220 : 280}>
        <RadarChart data={chartData}>
          <PolarGrid stroke="#d1d5db" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#374151', fontSize: compact ? 10 : 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 5]}
            tickCount={4}
            tick={false}
          />
          <Radar
            dataKey="score"
            stroke="#2563eb"
            fill="#2563eb"
            fillOpacity={0.35}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
