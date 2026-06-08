export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import MapWrapper from '@/components/map/MapWrapper'
import NationalStats from '@/components/dashboard/NationalStats'
import SearchBox from '@/components/ui/SearchBox'
import ResultsTable from '@/components/dashboard/ResultsTable'
import type { DepartmentSummary, MunicipalitySummary } from '@/types'

export type MunWithCandidates = MunicipalitySummary & {
  candidateResults: { candidateName: string; votes: number }[]
}

async function getDepartments(): Promise<DepartmentSummary[]> {
  try {
    return await prisma.department.findMany({ orderBy: { name: 'asc' } })
  } catch (e) {
    console.error('[DB] getDepartments failed:', e)
    return []
  }
}

async function getMunicipalities(): Promise<MunWithCandidates[]> {
  try {
    return await prisma.municipality.findMany({
      select: {
        id: true, departmentCode: true, municipalityCode: true, name: true,
        hombres: true, mujeres: true, totalPotencial: true,
        mesas: true, puestos: true,
        mesasTotal: true, mesasCepeda: true, mesasEspriella: true,
        mesasValencia: true, mesasFajardo: true,
        cepedaVotes: true, espriellaVotes: true, totalEmitted: true,
        blankVotes: true, nullVotes: true, participationPct: true,
        winnerName: true, winnerVotes: true,
        secondName: true, secondVotes: true,
        margin: true, marginPct: true,
        candidateResults: {
          select: { candidateName: true, votes: true },
          where: {
            candidateName: {
              in: ['PALOMA VALENCIA LASERNA', 'SERGIO FAJARDO VALDERRAMA'],
            },
          },
        },
      },
      orderBy: { totalPotencial: 'desc' },
    })
  } catch (e) {
    console.error('[DB] getMunicipalities failed:', e)
    return []
  }
}

export default async function HomePage() {
  const [departments, municipalities] = await Promise.all([getDepartments(), getMunicipalities()])

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mapa Electoral Colombia 2026</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Resultados presidenciales · Click en un departamento para explorar
          </p>
        </div>
        <SearchBox />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <MapWrapper departments={departments} />
        </div>

        <div className="space-y-4 overflow-y-auto max-h-[80vh] lg:max-h-none">
          {departments.length > 0 ? (
            <NationalStats departments={departments} />
          ) : (
            <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
              <p className="text-amber-600 font-semibold mb-2">Base de datos no conectada</p>
              <p className="text-gray-500 text-sm">
                Configura{' '}
                <code className="text-blue-600 bg-gray-100 px-1.5 py-0.5 rounded">.env</code>
                {' '}y ejecuta{' '}
                <code className="text-green-600 bg-gray-100 px-1.5 py-0.5 rounded">npm run db:seed</code>
              </p>
            </div>
          )}
        </div>
      </div>

      {departments.length > 0 && (
        <div className="mt-8">
          <h2 className="text-gray-900 font-semibold text-lg mb-4">Resultados por Departamento y Municipio</h2>
          <ResultsTable departments={departments} municipalities={municipalities as MunWithCandidates[]} />
        </div>
      )}
    </div>
  )
}
