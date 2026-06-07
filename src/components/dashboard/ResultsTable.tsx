'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { formatNumber, formatPct } from '@/lib/utils'
import type { DepartmentSummary } from '@/types'
import type { MunWithCandidates } from '@/app/page'

type Tab = 'departments' | 'municipalities'
type SortDir = 'asc' | 'desc'
type WinnerFilter = 'all' | 'cepeda' | 'espriella' | 'valencia' | 'fajardo'

interface MunRow {
  id: number
  depCode: number
  munCode: string
  name: string
  depName: string
  cepeda: number
  espriella: number
  valencia: number
  fajardo: number
  margin: number
  marginPct: number
  participationPct: number
  potencial: number
  winner: string | null
}

interface DepRow {
  id: number
  code: number
  name: string
  municipalities: number
  cepeda: number
  espriella: number
  valencia: number
  fajardo: number
  margin: number
  marginPct: number
  participationPct: number
  potencial: number
  winner: string | null
}

interface Props {
  departments: DepartmentSummary[]
  municipalities: MunWithCandidates[]
}

const PER_PAGE = 25

const FILTERS: { key: WinnerFilter; label: string; active: string; keyword: string }[] = [
  { key: 'all',       label: 'Todos',           active: 'bg-gray-800 text-white',   keyword: '' },
  { key: 'cepeda',    label: 'Cepeda',          active: 'bg-blue-600 text-white',   keyword: 'CEPEDA' },
  { key: 'espriella', label: 'De la Espriella', active: 'bg-red-600 text-white',    keyword: 'ESPRIELLA' },
  { key: 'valencia',  label: 'Valencia',        active: 'bg-green-600 text-white',  keyword: 'VALENCIA' },
  { key: 'fajardo',   label: 'Fajardo',         active: 'bg-violet-600 text-white', keyword: 'FAJARDO' },
]

function getVotes(results: { candidateName: string; votes: number }[], keyword: string) {
  return results.find(r => r.candidateName.includes(keyword))?.votes ?? 0
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronDown className="w-3 h-3 opacity-30 inline ml-0.5" />
  return dir === 'desc'
    ? <ChevronDown className="w-3 h-3 text-blue-600 inline ml-0.5" />
    : <ChevronUp className="w-3 h-3 text-blue-600 inline ml-0.5" />
}

export default function ResultsTable({ departments, municipalities }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('departments')
  const [search, setSearch] = useState('')
  const [winner, setWinner] = useState<WinnerFilter>('all')
  const [sort, setSort] = useState<{ field: string; dir: SortDir }>({ field: 'potencial', dir: 'desc' })
  const [page, setPage] = useState(1)

  const depNameMap = useMemo(() => {
    const m = new Map<number, string>()
    departments.forEach(d => m.set(d.code, d.name))
    return m
  }, [departments])

  const depRows: DepRow[] = useMemo(() => {
    const depValencia = new Map<number, number>()
    const depFajardo = new Map<number, number>()
    municipalities.forEach(m => {
      const v = getVotes(m.candidateResults, 'VALENCIA')
      const f = getVotes(m.candidateResults, 'FAJARDO')
      depValencia.set(m.departmentCode, (depValencia.get(m.departmentCode) ?? 0) + v)
      depFajardo.set(m.departmentCode, (depFajardo.get(m.departmentCode) ?? 0) + f)
    })
    return departments.map(d => ({
      id: d.id, code: d.code, name: d.name,
      municipalities: d.totalMunicipalities,
      cepeda: d.cepedaVotes, espriella: d.espriellaVotes,
      valencia: depValencia.get(d.code) ?? 0,
      fajardo: depFajardo.get(d.code) ?? 0,
      margin: d.margin, marginPct: d.marginPct,
      participationPct: d.participationPct,
      potencial: d.totalPotencial, winner: d.winnerName,
    }))
  }, [departments, municipalities])

  const munRows: MunRow[] = useMemo(() =>
    municipalities.map(m => ({
      id: m.id, depCode: m.departmentCode, munCode: m.municipalityCode,
      name: m.name, depName: depNameMap.get(m.departmentCode) ?? '',
      cepeda: m.cepedaVotes, espriella: m.espriellaVotes,
      valencia: getVotes(m.candidateResults, 'VALENCIA'),
      fajardo: getVotes(m.candidateResults, 'FAJARDO'),
      margin: m.margin, marginPct: m.marginPct,
      participationPct: m.participationPct,
      potencial: m.totalPotencial, winner: m.winnerName,
    })),
    [municipalities, depNameMap]
  )

  function applyFilters(rows: (DepRow | MunRow)[]) {
    let list = [...rows]
    if (search) list = list.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    const f = FILTERS.find(x => x.key === winner)
    if (f && f.keyword) list = list.filter(r => r.winner?.includes(f.keyword))
    list.sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[sort.field] as number | string
      const bv = (b as unknown as Record<string, unknown>)[sort.field] as number | string
      if (typeof av === 'string') return sort.dir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av)
      return sort.dir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
    return list
  }

  const filteredDeps = useMemo(() => applyFilters(depRows) as DepRow[], [depRows, search, winner, sort])
  const filteredMuns = useMemo(() => applyFilters(munRows) as MunRow[], [munRows, search, winner, sort])

  const rows = tab === 'departments' ? filteredDeps : filteredMuns
  const totalPages = Math.ceil(rows.length / PER_PAGE)
  const pagedDeps = filteredDeps.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const pagedMuns = filteredMuns.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  function toggleSort(field: string) {
    setSort(prev => prev.field === field
      ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { field, dir: 'desc' }
    )
    setPage(1)
  }

  function changeTab(t: Tab) {
    setTab(t)
    setSearch('')
    setWinner('all')
    setSort({ field: 'potencial', dir: 'desc' })
    setPage(1)
  }

  const Th = ({ field, label, className = '' }: { field: string; label: string; className?: string }) => (
    <th className={`px-3 py-3 font-medium text-xs cursor-pointer select-none whitespace-nowrap ${className}`}
      onClick={() => toggleSort(field)}>
      {label}<SortIcon active={sort.field === field} dir={sort.dir} />
    </th>
  )

  const isBlue = (w: string | null) => w?.includes('CEPEDA')
  const isRed  = (w: string | null) => w?.includes('ESPRIELLA')

  const winnerBadge = (w: string | null) =>
    isBlue(w) ? 'bg-blue-100 text-blue-700'
    : isRed(w) ? 'bg-red-100 text-red-700'
    : 'bg-gray-100 text-gray-600'

  const winnerDot = (w: string | null) =>
    isBlue(w) ? 'bg-blue-500' : isRed(w) ? 'bg-red-500' : 'bg-gray-300'

  const winnerShort = (w: string | null) =>
    isBlue(w) ? 'Cepeda' : isRed(w) ? 'Espriella' : '1°'

  const MarginBadge = ({ winner, marginPct }: { winner: string | null; marginPct: number }) => (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${winnerBadge(winner)}`}>
      {winnerShort(winner)} +{formatPct(marginPct, 1)}
    </span>
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['departments', 'municipalities'] as const).map(t => (
          <button key={t} onClick={() => changeTab(t)}
            className={`flex-1 sm:flex-none px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${
              tab === t
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}>
            {t === 'departments' ? 'Departamentos' : 'Municipios'}
            <span className="ml-2 text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
              {t === 'departments' ? filteredDeps.length : filteredMuns.length}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-gray-100">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder={tab === 'departments' ? 'Filtrar departamento...' : 'Filtrar municipio...'}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => { setWinner(f.key); setPage(1) }}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                winner === f.key ? f.active : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left">
              {tab === 'departments' ? (
                <>
                  <Th field="name" label="Departamento" className="text-gray-600" />
                  <Th field="cepeda"    label="Cepeda"          className="text-blue-600 text-right" />
                  <Th field="espriella" label="De la Espriella" className="text-red-600 text-right" />
                  <Th field="valencia"  label="Valencia"        className="text-green-600 text-right hidden xl:table-cell" />
                  <Th field="fajardo"   label="Fajardo"         className="text-violet-600 text-right hidden xl:table-cell" />
                  <Th field="marginPct"       label="Margen"  className="text-amber-600 text-right" />
                  <Th field="participationPct" label="Partic." className="text-gray-500 text-right" />
                  <th className="w-6" />
                </>
              ) : (
                <>
                  <Th field="name" label="Municipio" className="text-gray-600" />
                  <th className="px-3 py-3 text-xs text-gray-500 font-medium hidden md:table-cell">Departamento</th>
                  <Th field="cepeda"    label="Cepeda"          className="text-blue-600 text-right" />
                  <Th field="espriella" label="De la Espriella" className="text-red-600 text-right" />
                  <Th field="valencia"  label="Valencia"        className="text-green-600 text-right hidden xl:table-cell" />
                  <Th field="fajardo"   label="Fajardo"         className="text-violet-600 text-right hidden xl:table-cell" />
                  <Th field="marginPct"       label="Margen"  className="text-amber-600 text-right" />
                  <Th field="participationPct" label="Partic." className="text-gray-500 text-right" />
                  <th className="w-6" />
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-gray-400 text-sm">
                  Sin resultados para tu búsqueda
                </td>
              </tr>
            ) : tab === 'departments' ? (
              pagedDeps.map(row => (
                <tr key={row.id}
                  onClick={() => router.push(`/departamento/${row.code}`)}
                  className="border-b border-gray-100 hover:bg-blue-50/40 cursor-pointer transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${winnerDot(row.winner)}`} />
                      <span className="font-medium text-gray-900">{row.name}</span>
                      <span className="text-gray-400 text-xs hidden sm:inline">· {row.municipalities} mun.</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right text-blue-600 font-medium">{formatNumber(row.cepeda)}</td>
                  <td className="px-3 py-2.5 text-right text-red-600 font-medium">{formatNumber(row.espriella)}</td>
                  <td className="px-3 py-2.5 text-right text-green-600 hidden xl:table-cell">{formatNumber(row.valencia)}</td>
                  <td className="px-3 py-2.5 text-right text-violet-600 hidden xl:table-cell">{formatNumber(row.fajardo)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <MarginBadge winner={row.winner} marginPct={row.marginPct} />
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-500">{formatPct(row.participationPct, 1)}</td>
                  <td className="px-3 py-2.5 text-gray-300">›</td>
                </tr>
              ))
            ) : (
              pagedMuns.map(row => (
                <tr key={row.id}
                  onClick={() => router.push(`/municipio/${row.depCode}/${row.munCode}`)}
                  className="border-b border-gray-100 hover:bg-blue-50/40 cursor-pointer transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${winnerDot(row.winner)}`} />
                      <span className="font-medium text-gray-900">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 text-xs hidden md:table-cell">{row.depName}</td>
                  <td className="px-3 py-2.5 text-right text-blue-600 font-medium">{formatNumber(row.cepeda)}</td>
                  <td className="px-3 py-2.5 text-right text-red-600 font-medium">{formatNumber(row.espriella)}</td>
                  <td className="px-3 py-2.5 text-right text-green-600 hidden xl:table-cell">{formatNumber(row.valencia)}</td>
                  <td className="px-3 py-2.5 text-right text-violet-600 hidden xl:table-cell">{formatNumber(row.fajardo)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <MarginBadge winner={row.winner} marginPct={row.marginPct} />
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-500">{formatPct(row.participationPct, 1)}</td>
                  <td className="px-3 py-2.5 text-gray-300">›</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            {((page - 1) * PER_PAGE) + 1}–{Math.min(page * PER_PAGE, rows.length)} de {rows.length}
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
