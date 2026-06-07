'use client'

import { formatNumber, formatPct } from '@/lib/utils'

interface Props {
  potencial: number
  emitted: number
  participationPct: number
  blankVotes: number
  nullVotes: number
  mesas: number
  puestos: number
}

export default function ParticipationCard({
  potencial,
  emitted,
  participationPct,
  blankVotes,
  nullVotes,
  mesas,
  puestos,
}: Props) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const dash = (participationPct / 100) * circumference

  const color =
    participationPct >= 65
      ? '#16A34A'
      : participationPct >= 50
      ? '#D97706'
      : '#DC2626'

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-4">
      <h3 className="text-gray-900 font-semibold">Participación Electoral</h3>

      <div className="flex items-center gap-6">
        {/* SVG gauge */}
        <div className="relative shrink-0">
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle
              cx="65" cy="65" r={radius}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="12"
            />
            <circle
              cx="65" cy="65" r={radius}
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeLinecap="round"
              transform="rotate(-90 65 65)"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{formatPct(participationPct, 1)}</span>
            <span className="text-xs text-gray-500">participación</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Habilitados</span>
            <span className="text-gray-900 font-medium">{formatNumber(potencial)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Votaron</span>
            <span className="text-green-600 font-medium">{formatNumber(emitted)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Abstención</span>
            <span className="text-red-600 font-medium">{formatNumber(potencial - emitted)}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between">
            <span className="text-gray-500">Votos en blanco</span>
            <span className="text-gray-700">{formatNumber(blankVotes)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Votos nulos</span>
            <span className="text-gray-700">{formatNumber(nullVotes)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900">{formatNumber(puestos)}</p>
          <p className="text-xs text-gray-500">Puestos de votación</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900">{formatNumber(mesas)}</p>
          <p className="text-xs text-gray-500">Mesas</p>
        </div>
      </div>
    </div>
  )
}
