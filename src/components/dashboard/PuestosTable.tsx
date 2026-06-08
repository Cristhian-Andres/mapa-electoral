'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import type { PuestoResult } from '@/types'

type SortField    = 'puestoName' | 'mesasCepeda' | 'mesasEspriella' | 'mesasTotal' | 'cepedaVotes' | 'espriellaVotes' | 'totalVotes'
type SortDir      = 'asc' | 'desc'
type WinnerFilter = 'all' | 'cepeda' | 'espriella'

const CEPEDA_CEDULA    = '79262397'
const ESPRIELLA_CEDULA = '11004242'
const VALENCIA_CEDULA  = '25280205'
const FAJARDO_CEDULA   = '70546658'

const PER_PAGE = 20

interface Props {
  puestos: PuestoResult[]
}

function WinnerDot({ cedula }: { cedula: string | null }) {
  if (cedula === CEPEDA_CEDULA)    return <span className="inline-block w-2 h-2 rounded-full bg-blue-500 shrink-0" />
  if (cedula === ESPRIELLA_CEDULA) return <span className="inline-block w-2 h-2 rounded-full bg-red-500 shrink-0" />
  if (cedula === VALENCIA_CEDULA)  return <span className="inline-block w-2 h-2 rounded-full bg-green-500 shrink-0" />
  if (cedula === FAJARDO_CEDULA)   return <span className="inline-block w-2 h-2 rounded-full bg-violet-500 shrink-0" />
  return <span className="inline-block w-2 h-2 rounded-full bg-gray-300 shrink-0" />
}

function winnerLabel(cedula: string | null) {
  if (cedula === CEPEDA_CEDULA)    return 'Cepeda'
  if (cedula === ESPRIELLA_CEDULA) return 'Espriella'
  if (cedula === VALENCIA_CEDULA)  return 'Valencia'
  if (cedula === FAJARDO_CEDULA)   return 'Fajardo'
  return '—'
}

function MesaBar({ cepeda, espriella, valencia, fajardo, total }: {
  cepeda: number; espriella: number; valencia: number; fajardo: number; total: number
}) {
  if (total === 0) return null
  return (
    <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-gray-200 mt-1">
      <div className="bg-blue-500 h-full"   style={{ width: `${(cepeda    / total) * 100}%` }} />
      <div className="bg-red-500 h-full"    style={{ width: `${(espriella / total) * 100}%` }} />
      <div className="bg-green-500 h-full"  style={{ width: `${(valencia  / total) * 100}%` }} />
      <div className="bg-violet-500 h-full" style={{ width: `${(fajardo   / total) * 100}%` }} />
    </div>
  )
}

export default function PuestosTable({ puestos }: Props) {
  const [search, setSearch]     = useState('')
  const [winner, setWinner]     = useState<WinnerFilter>('all')
  const [sort, setSort]         = useState<{ field: SortField; dir: SortDir }>({ field: 'totalVotes', dir: 'desc' })
  const [page, setPage]         = useState(1)

  const filtered = useMemo(() => {
    let list = [...puestos]
    if (search) list = list.filter(p => p.puestoName.toLowerCase().includes(search.toLowerCase()))
    if (winner === 'cepeda')    list = list.filter(p => p.winnerCedula === CEPEDA_CEDULA)
    if (winner === 'espriella') list = list.filter(p => p.winnerCedula === ESPRIELLA_CEDULA)
    list.sort((a, b) => {
      const av = a[sort.field] as number | string
      const bv = b[sort.field] as number | string
      if (typeof av === 'string') {
        return sort.dir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av)
      }
      return sort.dir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
    return list
  }, [puestos, search, winner, sort])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paged      = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  function toggleSort(field: SortField) {
    setSort(prev => prev.field === field
      ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { field, dir: 'desc' }
    )
    setPage(1)
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sort.field !== field) return <ChevronDown className="w-3 h-3 opacity-30 inline ml-0.5" />
    return sort.dir === 'desc'
      ? <ChevronDown className="w-3 h-3 text-blue-600 inline ml-0.5" />
      : <ChevronUp   className="w-3 h-3 text-blue-600 inline ml-0.5" />
  }

  function Th({ field, label, className = '' }: { field: SortField; label: string; className?: string }) {
    return (
      <th
        className={`px-3 py-3 font-medium text-xs cursor-pointer select-none whitespace-nowrap ${className}`}
        onClick={() => toggleSort(field)}
      >
        {label}<SortIcon field={field} />
      </th>
    )
  }

  // Counts for filter badges
  const countCepeda    = useMemo(() => puestos.filter(p => p.winnerCedula === CEPEDA_CEDULA).length,    [puestos])
  const countEspriella = useMemo(() => puestos.filter(p => p.winnerCedula === ESPRIELLA_CEDULA).length, [puestos])

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Search + filters */}
      <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar puesto de votación..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Winner filter buttons */}
        <div className="flex gap-1">
          <button
            onClick={() => { setWinner('all'); setPage(1) }}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              winner === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos
            <span className="ml-1.5 opacity-70">{puestos.length}</span>
          </button>
          <button
            onClick={() => { setWinner('cepeda'); setPage(1) }}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              winner === 'cepeda' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Cepeda
            <span className="ml-1.5 opacity-80">{countCepeda}</span>
          </button>
          <button
            onClick={() => { setWinner('espriella'); setPage(1) }}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              winner === 'espriella' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            De la Espriella
            <span className="ml-1.5 opacity-80">{countEspriella}</span>
          </button>
        </div>

        <span className="text-xs text-gray-400 shrink-0 ml-auto">{filtered.length} puestos</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left">
              <Th field="puestoName"     label="Puesto de Votación"    className="text-gray-600" />
              <Th field="mesasCepeda"    label="Mesas Cepeda"          className="text-blue-600 text-right" />
              <Th field="mesasEspriella" label="Mesas Espriella"       className="text-red-600 text-right" />
              <Th field="mesasTotal"     label="Total Mesas"           className="text-gray-500 text-right" />
              <Th field="cepedaVotes"    label="Votos Cepeda"          className="text-blue-500 text-right hidden sm:table-cell" />
              <Th field="espriellaVotes" label="Votos Espriella"       className="text-red-500 text-right hidden sm:table-cell" />
              <Th field="totalVotes"     label="Total Votos"           className="text-gray-500 text-right hidden md:table-cell" />
              <th className="px-3 py-3 text-xs font-medium text-gray-500 text-center">Ganador</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">
                  Sin resultados
                </td>
              </tr>
            ) : paged.map(p => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2.5 max-w-[220px]">
                  <p className="font-medium text-gray-900 text-xs leading-tight truncate">{p.puestoName}</p>
                  <MesaBar
                    cepeda={p.mesasCepeda}
                    espriella={p.mesasEspriella}
                    valencia={p.mesasValencia}
                    fajardo={p.mesasFajardo}
                    total={p.mesasTotal}
                  />
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className="text-blue-600 font-semibold text-sm">{p.mesasCepeda}</span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className="text-red-600 font-semibold text-sm">{p.mesasEspriella}</span>
                </td>
                <td className="px-3 py-2.5 text-right text-gray-500 text-sm">{p.mesasTotal}</td>
                <td className="px-3 py-2.5 text-right text-blue-600 hidden sm:table-cell text-xs">{formatNumber(p.cepedaVotes)}</td>
                <td className="px-3 py-2.5 text-right text-red-600 hidden sm:table-cell text-xs">{formatNumber(p.espriellaVotes)}</td>
                <td className="px-3 py-2.5 text-right text-gray-500 hidden md:table-cell text-xs">{formatNumber(p.totalVotes)}</td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <WinnerDot cedula={p.winnerCedula} />
                    <span className={`text-xs font-medium ${
                      p.winnerCedula === CEPEDA_CEDULA    ? 'text-blue-700' :
                      p.winnerCedula === ESPRIELLA_CEDULA ? 'text-red-700'  : 'text-gray-700'
                    }`}>{winnerLabel(p.winnerCedula)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            {((page - 1) * PER_PAGE) + 1}–{Math.min(page * PER_PAGE, filtered.length)} de {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p: number
              if (totalPages <= 7) p = i + 1
              else if (page <= 4) p = i + 1
              else if (page >= totalPages - 3) p = totalPages - 6 + i
              else p = page - 3 + i
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    page === p ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}>
                  {p}
                </button>
              )
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-400 hidden sm:block">Pág. {page} de {totalPages}</p>
        </div>
      )}
    </div>
  )
}
