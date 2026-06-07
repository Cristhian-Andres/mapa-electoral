'use client'

import { formatNumber, formatPct } from '@/lib/utils'
import { CEPEDA, ESPRIELLA } from '@/types'

interface Props {
  cepedaVotes: number
  espriellaVotes: number
  totalEmitted: number
  margin: number
  marginPct: number
  winnerName: string | null
  size?: 'sm' | 'md' | 'lg'
}

export default function CandidateComparison({
  cepedaVotes,
  espriellaVotes,
  totalEmitted,
  margin,
  marginPct,
  winnerName,
  size = 'md',
}: Props) {
  const total = cepedaVotes + espriellaVotes
  const cepedaPct = total > 0 ? (cepedaVotes / total) * 100 : 0
  const espriellaPct = total > 0 ? (espriellaVotes / total) * 100 : 0

  const isCepedaWinner = winnerName?.includes('CEPEDA')
  const isEspriellaWinner = winnerName?.includes('ESPRIELLA')

  const textSizes = {
    sm: { name: 'text-sm', votes: 'text-lg', pct: 'text-sm' },
    md: { name: 'text-base', votes: 'text-2xl', pct: 'text-base' },
    lg: { name: 'text-lg', votes: 'text-4xl', pct: 'text-lg' },
  }
  const t = textSizes[size]

  return (
    <div className="space-y-4">
      {/* Dual bar */}
      <div className="relative h-8 rounded-full overflow-hidden bg-gray-200 flex">
        <div
          className="h-full bg-blue-600 transition-all duration-700 flex items-center justify-end pr-2"
          style={{ width: `${cepedaPct}%` }}
        >
          {cepedaPct > 8 && (
            <span className="text-white text-xs font-bold">{cepedaPct.toFixed(1)}%</span>
          )}
        </div>
        <div
          className="h-full bg-red-600 transition-all duration-700 flex items-center justify-start pl-2"
          style={{ width: `${espriellaPct}%` }}
        >
          {espriellaPct > 8 && (
            <span className="text-white text-xs font-bold">{espriellaPct.toFixed(1)}%</span>
          )}
        </div>
      </div>

      {/* Candidate rows */}
      <div className="grid grid-cols-2 gap-3">
        {/* Cepeda */}
        <div
          className={`rounded-xl p-3 border-2 transition-all ${
            isCepedaWinner
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
            <span className={`font-semibold text-gray-900 ${t.name}`}>{CEPEDA.shortName}</span>
            {isCepedaWinner && (
              <span className="ml-auto text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                Ganó
              </span>
            )}
          </div>
          <p className={`font-bold text-blue-600 ${t.votes}`}>{formatNumber(cepedaVotes)}</p>
          <p className={`text-gray-500 ${t.pct}`}>{formatPct(cepedaPct)}</p>
          <p className="text-gray-400 text-xs mt-1">{CEPEDA.party}</p>
        </div>

        {/* Espriella */}
        <div
          className={`rounded-xl p-3 border-2 transition-all ${
            isEspriellaWinner
              ? 'border-red-400 bg-red-50'
              : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
            <span className={`font-semibold text-gray-900 ${t.name}`}>{ESPRIELLA.shortName}</span>
            {isEspriellaWinner && (
              <span className="ml-auto text-xs bg-red-600 text-white px-1.5 py-0.5 rounded-full">
                Ganó
              </span>
            )}
          </div>
          <p className={`font-bold text-red-600 ${t.votes}`}>{formatNumber(espriellaVotes)}</p>
          <p className={`text-gray-500 ${t.pct}`}>{formatPct(espriellaPct)}</p>
          <p className="text-gray-400 text-xs mt-1">{ESPRIELLA.party}</p>
        </div>
      </div>

      {/* Margin */}
      <div className="bg-gray-100 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
        <span className="text-gray-600 text-sm">Margen de victoria</span>
        <div className="text-right">
          <p className="text-amber-600 font-bold text-lg">
            {formatNumber(margin)} votos
          </p>
          <p className="text-gray-500 text-xs">{formatPct(marginPct)} diferencia</p>
        </div>
      </div>
    </div>
  )
}
