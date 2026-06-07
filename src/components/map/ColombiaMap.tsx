// @ts-nocheck — react-simple-maps v3 types are incomplete (missing minZoom, maxZoom, onMouseEnter, onTouchStart)
'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  type Geography as GeoType,
} from 'react-simple-maps'
import { useRouter } from 'next/navigation'
import type { DepartmentSummary } from '@/types'
import { formatNumber, formatPct } from '@/lib/utils'

const GEO_URL = '/colombia-departments.json'

const DPTO_TO_DB_CODE: Record<string, number> = {
  '05': 1,  '08': 3,  '11': 16, '13': 5,  '15': 7,
  '17': 9,  '18': 44, '19': 11, '20': 12, '23': 13,
  '25': 15, '27': 17, '41': 19, '44': 48, '47': 21,
  '50': 52, '52': 23, '54': 25, '63': 26, '66': 24,
  '68': 27, '70': 28, '73': 29, '76': 31, '81': 40,
  '85': 46, '86': 64, '88': 56, '91': 60, '94': 50,
  '95': 54, '97': 68, '99': 72,
}

interface Props {
  departments: DepartmentSummary[]
}

function getDeptColor(dept: DepartmentSummary | undefined): string {
  if (!dept || dept.totalEmitted === 0) return '#D1D5DB'
  const winner = dept.winnerName ?? ''
  const intensity = Math.min(dept.marginPct / 25, 1)
  if (winner.includes('CEPEDA')) {
    const b = Math.round(140 + intensity * 115)
    const g = Math.round(80 - intensity * 40)
    return `rgb(20, ${g}, ${b})`
  }
  if (winner.includes('ESPRIELLA')) {
    const r = Math.round(140 + intensity * 115)
    const gb = Math.round(30 - intensity * 10)
    return `rgb(${r}, ${gb}, ${gb})`
  }
  return '#9CA3AF'
}

export default function ColombiaMap({ departments }: Props) {
  const router = useRouter()
  const [hovered, setHovered] = useState<DepartmentSummary | null>(null)
  const [deptMap, setDeptMap] = useState<Map<number, DepartmentSummary>>(new Map())

  useEffect(() => {
    const map = new Map<number, DepartmentSummary>()
    for (const dept of departments) map.set(dept.code, dept)
    setDeptMap(map)
  }, [departments])

  const findDept = useCallback(
    (dptoCode: string) => {
      const dbCode = DPTO_TO_DB_CODE[dptoCode]
      return dbCode !== undefined ? deptMap.get(dbCode) : undefined
    },
    [deptMap]
  )

  const handleEnter = useCallback(
    (geo: GeoType) => {
      const dept = findDept(geo.properties.DPTO as string)
      if (dept) setHovered(dept)
    },
    [findDept]
  )

  const handleLeave = useCallback(() => setHovered(null), [])

  const handleClick = useCallback(
    (geo: GeoType) => {
      const dept = findDept(geo.properties.DPTO as string)
      if (dept) router.push(`/departamento/${dept.code}`)
    },
    [findDept, router]
  )

  const isBlue = hovered?.winnerName?.includes('CEPEDA')
  const isRed = hovered?.winnerName?.includes('ESPRIELLA')

  return (
    <div className="relative w-full select-none">
      {/* Hover info panel — floats inside the map, visible on desktop and mobile */}
      <div
        className={`absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-150 ${
          hovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
        }`}
      >
        {hovered && (
          <div className={`rounded-xl px-4 py-2.5 shadow-lg border text-center whitespace-nowrap ${
            isBlue
              ? 'bg-blue-600 border-blue-700 text-white'
              : isRed
              ? 'bg-red-600 border-red-700 text-white'
              : 'bg-gray-700 border-gray-800 text-white'
          }`}>
            <p className="font-bold text-base leading-tight">{hovered.name}</p>
            {hovered.totalEmitted > 0 && (
              <div className="flex items-center gap-3 mt-1 text-xs opacity-90 justify-center">
                <span>Cepeda: {formatNumber(hovered.cepedaVotes)}</span>
                <span className="opacity-50">·</span>
                <span>Espriella: {formatNumber(hovered.espriellaVotes)}</span>
              </div>
            )}
          </div>
        )}
      </div>


      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [-74, 4], scale: 1800 }}
        style={{ width: '100%', height: 'auto' }}
      >
        <ZoomableGroup center={[-74, 4]} zoom={1} minZoom={1} maxZoom={8}>
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: GeoType[] }) =>
              geographies.map((geo: GeoType) => {
                const dept = findDept(geo.properties.DPTO as string)
                const isHovered = hovered?.code === dept?.code
                const color = getDeptColor(dept)
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isHovered ? '#FBBF24' : color}
                    stroke="#FFFFFF"
                    strokeWidth={0.8}
                    style={{
                      default: { outline: 'none', cursor: dept ? 'pointer' : 'default' },
                      hover: { outline: 'none' },
                      pressed: { outline: 'none', fill: '#F59E0B' },
                    }}
                    onMouseEnter={() => handleEnter(geo)}
                    onMouseLeave={handleLeave}
                    onTouchStart={() => handleEnter(geo)}
                    onClick={() => handleClick(geo)}
                  />
                )
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Legend */}
      <div className="mt-3 flex gap-4 justify-center text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-3 rounded inline-block" style={{ background: 'rgb(20,40,220)' }} />
          <span className="text-gray-600">Cepeda Castro</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-3 rounded inline-block" style={{ background: 'rgb(220,20,20)' }} />
          <span className="text-gray-600">De la Espriella</span>
        </div>
      </div>
    </div>
  )
}
