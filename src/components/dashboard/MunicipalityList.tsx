'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { formatNumber, formatPct } from '@/lib/utils'
import type { MunicipalitySummary } from '@/types'
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'

type SortField = 'name' | 'cepedaVotes' | 'espriellaVotes' | 'margin' | 'participationPct' | 'totalPotencial'
type SortDir = 'asc' | 'desc'

interface Props {
  municipalities: MunicipalitySummary[]
  departmentCode: number
}

export default function MunicipalityList({ municipalities, departmentCode }: Props) {
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'totalPotencial', dir: 'desc' })
  const [filter, setFilter] = useState<'all' | 'cepeda' | 'espriella'>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let list = [...municipalities]
    if (filter === 'cepeda') list = list.filter(m => m.winnerName?.includes('CEPEDA'))
    if (filter === 'espriella') list = list.filter(m => m.winnerName?.includes('ESPRIELLA'))
    if (search) list = list.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
    list.sort((a, b) => {
      const av = a[sort.field] as number | string
      const bv = b[sort.field] as number | string
      if (typeof av === 'string') return sort.dir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av)
      return sort.dir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
    return list
  }, [municipalities, sort, filter, search])

  const toggleSort = (field: SortField) => {
    setSort(prev =>
      prev.field === field
        ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { field, dir: 'desc' }
    )
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sort.field !== field) return <ChevronDown className="w-3 h-3 opacity-30" />
    return sort.dir === 'desc' ? <ChevronDown className="w-3 h-3 text-amber-500" /> : <ChevronUp className="w-3 h-3 text-amber-500" />
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Filtrar municipio..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <div className="flex gap-1">
          {(['all', 'cepeda', 'espriella'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? f === 'cepeda'
                    ? 'bg-blue-600 text-white'
                    : f === 'espriella'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'cepeda' ? 'Cepeda' : 'De la Espriella'}
            </button>
          ))}
        </div>
      </div>

      <p className="text-gray-400 text-xs">{filtered.length} municipios</p>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-3 py-2.5 text-gray-600 font-medium">
                <button onClick={() => toggleSort('name')} className="flex items-center gap-1 hover:text-gray-900">
                  Municipio <SortIcon field="name" />
                </button>
              </th>
              <th className="text-right px-3 py-2.5 text-blue-600 font-medium hidden sm:table-cell">
                <button onClick={() => toggleSort('cepedaVotes')} className="flex items-center gap-1 ml-auto hover:text-blue-700">
                  Cepeda <SortIcon field="cepedaVotes" />
                </button>
              </th>
              <th className="text-right px-3 py-2.5 text-red-600 font-medium hidden sm:table-cell">
                <button onClick={() => toggleSort('espriellaVotes')} className="flex items-center gap-1 ml-auto hover:text-red-700">
                  De la Espriella <SortIcon field="espriellaVotes" />
                </button>
              </th>
              <th className="text-right px-3 py-2.5 text-amber-600 font-medium">
                <button onClick={() => toggleSort('margin')} className="flex items-center gap-1 ml-auto hover:text-amber-700">
                  Margen <SortIcon field="margin" />
                </button>
              </th>
              <th className="text-right px-3 py-2.5 text-green-600 font-medium hidden md:table-cell">
                <button onClick={() => toggleSort('participationPct')} className="flex items-center gap-1 ml-auto hover:text-green-700">
                  Partic. <SortIcon field="participationPct" />
                </button>
              </th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => {
              const isBlue = m.winnerName?.includes('CEPEDA')
              const isRed = m.winnerName?.includes('ESPRIELLA')
              return (
                <tr
                  key={m.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isBlue ? 'bg-blue-500' : isRed ? 'bg-red-500' : 'bg-gray-400'
                        }`}
                      />
                      <span className="text-gray-900 font-medium">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right text-blue-600 hidden sm:table-cell">
                    {formatNumber(m.cepedaVotes)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-red-600 hidden sm:table-cell">
                    {formatNumber(m.espriellaVotes)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                      isBlue ? 'bg-blue-100 text-blue-700' : isRed ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {formatPct(m.marginPct, 1)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-green-600 text-xs hidden md:table-cell">
                    {formatPct(m.participationPct, 1)}
                  </td>
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/municipio/${departmentCode}/${m.municipalityCode}`}
                      className="text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
