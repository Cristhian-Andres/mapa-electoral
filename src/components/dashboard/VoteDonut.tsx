'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { formatNumber, formatPct } from '@/lib/utils'
import type { CandidateResult } from '@/types'

interface Props {
  candidateResults: CandidateResult[]
  blankVotes: number
  nullVotes: number
  totalEmitted: number
}

const CANDIDATE_COLORS: Record<string, string> = {
  '79262397': '#2563EB',
  '11004242': '#DC2626',
}

const SHORT_NAMES: Record<string, string> = {
  'IVÁN CEPEDA CASTRO': 'Cepeda',
  'ABELARDO DE LA ESPRIELLA': 'De la Espriella',
  'PALOMA VALENCIA LASERNA': 'Valencia',
  'SERGIO FAJARDO VALDERRAMA': 'Fajardo',
  'CLAUDIA LÓPEZ': 'López',
  'RAÚL SANTIAGO BOTERO JARAMILLO': 'Botero',
  'ÓSCAR MAURICIO LIZCANO ARANGO': 'Lizcano',
  'MIGUEL URIBE LONDOÑO': 'Uribe L.',
}

export default function VoteDonut({ candidateResults, blankVotes, nullVotes, totalEmitted }: Props) {
  const data = [
    ...candidateResults.map(c => ({
      name: SHORT_NAMES[c.candidateName] || c.candidateName.split(' ')[0],
      votes: c.votes,
      pct: totalEmitted > 0 ? (c.votes / totalEmitted) * 100 : 0,
      color: CANDIDATE_COLORS[c.candidateCedula] || '#9CA3AF',
    })),
    ...(blankVotes > 0 ? [{ name: 'En blanco', votes: blankVotes, pct: totalEmitted > 0 ? (blankVotes / totalEmitted) * 100 : 0, color: '#D1D5DB' }] : []),
    ...(nullVotes > 0 ? [{ name: 'Nulos', votes: nullVotes, pct: totalEmitted > 0 ? (nullVotes / totalEmitted) * 100 : 0, color: '#6B7280' }] : []),
  ]

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: typeof data[0] }[]; label?: string }) => {
    if (!active || !payload?.length) return null
    const item = payload[0].payload
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-2 text-xs shadow-sm">
        <p className="text-gray-900 font-medium">{label}</p>
        <p className="text-gray-700">{formatNumber(item.votes)} votos</p>
        <p className="text-gray-500">{formatPct(item.pct, 2)}</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={data.length * 36 + 20}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 50, left: 0, bottom: 0 }}
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
          width={90}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="votes" radius={[0, 3, 3, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
