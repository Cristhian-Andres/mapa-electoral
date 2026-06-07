'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

interface SearchResult {
  id: number
  name: string
  municipalityCode: string
  departmentCode: number
  winnerName: string | null
  department: { name: string }
}

export default function SearchBox() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setOpen(false)
      return
    }

    const debounce = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data)
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(debounce)
  }, [query])

  const handleSelect = (r: SearchResult) => {
    router.push(`/municipio/${r.departmentCode}/${r.municipalityCode}`)
    setQuery('')
    setOpen(false)
  }

  const winnerColor = (name: string | null) => {
    if (!name) return 'bg-gray-300'
    if (name.includes('CEPEDA')) return 'bg-blue-500'
    if (name.includes('ESPRIELLA')) return 'bg-red-500'
    return 'bg-gray-400'
  }

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar municipio..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm shadow-sm"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {loading ? (
            <div className="p-3 text-gray-500 text-sm text-center">Buscando...</div>
          ) : results.length === 0 ? (
            <div className="p-3 text-gray-500 text-sm text-center">Sin resultados</div>
          ) : (
            <ul>
              {results.map(r => (
                <li key={r.id}>
                  <button
                    onClick={() => handleSelect(r)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${winnerColor(r.winnerName)}`} />
                    <div>
                      <p className="text-gray-900 text-sm font-medium">{r.name}</p>
                      <p className="text-gray-500 text-xs">{r.department.name}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
