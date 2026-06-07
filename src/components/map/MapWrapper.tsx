'use client'

import dynamic from 'next/dynamic'
import type { DepartmentSummary } from '@/types'

const ColombiaMap = dynamic(() => import('./ColombiaMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[3/4] bg-gray-800 rounded-xl animate-pulse flex items-center justify-center">
      <span className="text-gray-500 text-sm">Cargando mapa...</span>
    </div>
  ),
})

export default function MapWrapper({ departments }: { departments: DepartmentSummary[] }) {
  return <ColombiaMap departments={departments} />
}
