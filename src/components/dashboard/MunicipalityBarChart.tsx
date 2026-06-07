'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { formatNumber } from '@/lib/utils'
import type { MunicipalitySummary } from '@/types'

interface Props {
  municipalities: MunicipalitySummary[]
  maxItems?: number
}

export default function MunicipalityBarChart({ municipalities, maxItems = 15 }: Props) {
  const data = [...municipalities]
    .sort((a, b) => b.totalPotencial - a.totalPotencial)
    .slice(0, maxItems)
    .map(m => ({
      name: m.name.length > 16 ? m.name.slice(0, 15) + '…' : m.name,
      Cepeda: m.cepedaVotes,
      'De la Espriella': m.espriellaVotes,
    }))

  const CustomTooltip = ({
    active, payload, label,
  }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-2 text-xs shadow-sm">
        <p className="text-gray-900 font-medium mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.name === 'Cepeda' ? '#2563EB' : '#DC2626' }}>
            {p.name}: {formatNumber(p.value)}
          </p>
        ))}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={maxItems * 44 + 40}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: '#6B7280', fontSize: 10 }}
          tickFormatter={(v: number) => formatNumber(v)}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: '#374151', fontSize: 10 }}
          width={112}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value: string) => (
            <span className="text-gray-600 text-xs">{value}</span>
          )}
        />
        <Bar dataKey="Cepeda" fill="#2563EB" radius={[0, 3, 3, 0]} />
        <Bar dataKey="De la Espriella" fill="#DC2626" radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
