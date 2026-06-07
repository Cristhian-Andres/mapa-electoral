'use client'

import { formatNumber, formatPct } from '@/lib/utils'
import type { DepartmentSummary } from '@/types'

interface Props {
  departments: DepartmentSummary[]
}

export default function NationalStats({ departments: depts }: Props) {
  const totalPotencial = depts.reduce((s, d) => s + d.totalPotencial, 0)
  const totalEmitted = depts.reduce((s, d) => s + d.totalEmitted, 0)
  const totalCepeda = depts.reduce((s, d) => s + d.cepedaVotes, 0)
  const totalEspriella = depts.reduce((s, d) => s + d.espriellaVotes, 0)
  const totalBlank = depts.reduce((s, d) => s + d.blankVotes, 0)
  const totalNull = depts.reduce((s, d) => s + d.nullVotes, 0)
  const participacion = totalPotencial > 0 ? (totalEmitted / totalPotencial) * 100 : 0
  const totalCandidates = totalCepeda + totalEspriella
  const cepedaPct = totalCandidates > 0 ? (totalCepeda / totalCandidates) * 100 : 0
  const espriellaPct = totalCandidates > 0 ? (totalEspriella / totalCandidates) * 100 : 0
  const margin = Math.abs(totalCepeda - totalEspriella)
  const marginPct = totalCandidates > 0 ? (margin / totalCandidates) * 100 : 0

  const cepedaDepts = depts.filter(d => d.winnerName?.includes('CEPEDA')).length
  const espriellaDepts = depts.filter(d => d.winnerName?.includes('ESPRIELLA')).length

  return (
    <div className="space-y-4">
      <h2 className="text-gray-900 font-bold text-lg">Resultados Nacionales</h2>

      {/* Participation */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-500 text-sm">Participación nacional</span>
          <span className="text-green-600 font-bold text-xl">{formatPct(participacion)}</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-1000"
            style={{ width: `${participacion}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>{formatNumber(totalEmitted)} votaron</span>
          <span>{formatNumber(totalPotencial - totalEmitted)} abstuvieron</span>
        </div>
      </div>

      {/* Main comparison bar */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-3">
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Cepeda vs De la Espriella</p>
        <div className="relative h-10 rounded-full overflow-hidden bg-gray-200 flex">
          <div
            className="h-full bg-blue-600 flex items-center justify-end pr-3 transition-all duration-1000"
            style={{ width: `${cepedaPct}%` }}
          >
            <span className="text-white text-sm font-bold">{cepedaPct.toFixed(1)}%</span>
          </div>
          <div
            className="h-full bg-red-600 flex items-center justify-start pl-3 transition-all duration-1000"
            style={{ width: `${espriellaPct}%` }}
          >
            <span className="text-white text-sm font-bold">{espriellaPct.toFixed(1)}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <p className="text-blue-600 text-2xl font-bold">{formatNumber(totalCepeda)}</p>
            <p className="text-gray-500 text-xs">Iván Cepeda</p>
          </div>
          <div className="text-center">
            <p className="text-red-600 text-2xl font-bold">{formatNumber(totalEspriella)}</p>
            <p className="text-gray-500 text-xs">De la Espriella</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center">
          <span className="text-amber-700 font-bold">
            Margen: {formatNumber(margin)} votos ({formatPct(marginPct, 2)})
          </span>
        </div>
      </div>

      {/* Dept wins */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
          <p className="text-blue-600 text-3xl font-bold">{cepedaDepts}</p>
          <p className="text-gray-600 text-xs mt-1">Departamentos<br />Cepeda</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
          <p className="text-red-600 text-3xl font-bold">{espriellaDepts}</p>
          <p className="text-gray-600 text-xs mt-1">Departamentos<br />De la Espriella</p>
        </div>
      </div>

      {/* Extra stats */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
          <p className="text-gray-500 text-xs">Votos en blanco</p>
          <p className="text-gray-900 font-semibold">{formatNumber(totalBlank)}</p>
          <p className="text-gray-400 text-xs">{formatPct(totalEmitted > 0 ? (totalBlank / totalEmitted) * 100 : 0, 1)}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
          <p className="text-gray-500 text-xs">Votos nulos</p>
          <p className="text-gray-900 font-semibold">{formatNumber(totalNull)}</p>
          <p className="text-gray-400 text-xs">{formatPct(totalEmitted > 0 ? (totalNull / totalEmitted) * 100 : 0, 1)}</p>
        </div>
      </div>

      {/* Segunda vuelta alert */}
      {cepedaPct < 50 && espriellaPct < 50 && totalCandidates > 0 && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3">
          <p className="text-yellow-700 font-semibold text-sm">Segunda vuelta requerida</p>
          <p className="text-gray-600 text-xs mt-1">
            Ningún candidato supera el 50%. Se requiere segunda vuelta entre Cepeda ({formatPct(cepedaPct, 1)}) y De la Espriella ({formatPct(espriellaPct, 1)}).
          </p>
        </div>
      )}
    </div>
  )
}
