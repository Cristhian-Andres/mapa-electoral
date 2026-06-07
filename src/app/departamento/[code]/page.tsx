import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin } from 'lucide-react'
import CandidateComparison from '@/components/dashboard/CandidateComparison'
import ParticipationCard from '@/components/dashboard/ParticipationCard'
import MunicipalityList from '@/components/dashboard/MunicipalityList'
import MunicipalityBarChart from '@/components/dashboard/MunicipalityBarChart'
import StatCard from '@/components/ui/StatCard'
import { formatNumber, formatPct } from '@/lib/utils'

interface Props {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: Props) {
  const { code } = await params
  const dept = await prisma.department.findUnique({ where: { code: parseInt(code) } })
  return { title: dept ? `${dept.name} · Mapa Electoral Colombia` : 'Departamento' }
}

export default async function DepartmentPage({ params }: Props) {
  const { code } = await params
  const deptCode = parseInt(code, 10)

  const dept = await prisma.department.findUnique({
    where: { code: deptCode },
    include: { municipalities: { orderBy: { totalPotencial: 'desc' } } },
  })

  if (!dept) notFound()

  const isBlue = dept.winnerName?.includes('CEPEDA')
  const isRed = dept.winnerName?.includes('ESPRIELLA')

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />
        Volver al mapa nacional
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 ${
            isBlue ? 'bg-blue-600' : isRed ? 'bg-red-600' : 'bg-gray-500'
          }`}
        >
          {dept.name.slice(0, 2)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-400" />
            {dept.name}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {dept.totalMunicipalities} municipios · {formatNumber(dept.totalPotencial)} habilitados
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Potencial electoral"
          value={formatNumber(dept.totalPotencial)}
          sub={`${formatNumber(dept.totalHombres)} H / ${formatNumber(dept.totalMujeres)} M`}
          color="gray"
        />
        <StatCard
          label="Votos emitidos"
          value={formatNumber(dept.totalEmitted)}
          sub={formatPct(dept.participationPct) + ' participación'}
          color="green"
        />
        <StatCard
          label="Mesas"
          value={formatNumber(dept.totalMesas)}
          sub={`${formatNumber(dept.totalPuestos)} puestos`}
          color="gray"
        />
        <StatCard
          label="Margen"
          value={formatPct(dept.marginPct)}
          sub={`${formatNumber(dept.margin)} votos`}
          color={isBlue ? 'blue' : isRed ? 'red' : 'gray'}
        />
      </div>

      {/* Main 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 mb-8">
        {/* Left */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <h2 className="text-gray-900 font-semibold mb-4">Resultados — Cepeda vs De la Espriella</h2>
            <CandidateComparison
              cepedaVotes={dept.cepedaVotes}
              espriellaVotes={dept.espriellaVotes}
              totalEmitted={dept.totalEmitted}
              margin={dept.margin}
              marginPct={dept.marginPct}
              winnerName={dept.winnerName}
              size="lg"
            />
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <h2 className="text-gray-900 font-semibold mb-4">Top municipios por votos</h2>
            <MunicipalityBarChart municipalities={dept.municipalities} maxItems={12} />
          </div>
        </div>

        {/* Right */}
        <div className="space-y-4">
          <ParticipationCard
            potencial={dept.totalPotencial}
            emitted={dept.totalEmitted}
            participationPct={dept.participationPct}
            blankVotes={dept.blankVotes}
            nullVotes={dept.nullVotes}
            mesas={dept.totalMesas}
            puestos={dept.totalPuestos}
          />

          {/* Census breakdown */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
            <h3 className="text-gray-900 font-semibold text-sm">Censo Electoral</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Hombres</span>
                <div className="text-right">
                  <span className="text-gray-900">{formatNumber(dept.totalHombres)}</span>
                  <span className="text-gray-400 text-xs ml-1">
                    ({formatPct(dept.totalPotencial > 0 ? (dept.totalHombres / dept.totalPotencial) * 100 : 0, 1)})
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Mujeres</span>
                <div className="text-right">
                  <span className="text-gray-900">{formatNumber(dept.totalMujeres)}</span>
                  <span className="text-gray-400 text-xs ml-1">
                    ({formatPct(dept.totalPotencial > 0 ? (dept.totalMujeres / dept.totalPotencial) * 100 : 0, 1)})
                  </span>
                </div>
              </div>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-blue-400"
                style={{ width: `${dept.totalPotencial > 0 ? (dept.totalHombres / dept.totalPotencial) * 100 : 50}%` }}
              />
              <div className="h-full bg-pink-400 flex-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Municipality list */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
        <h2 className="text-gray-900 font-semibold mb-4">
          Municipios ({dept.totalMunicipalities})
        </h2>
        <MunicipalityList municipalities={dept.municipalities} departmentCode={dept.code} />
      </div>
    </div>
  )
}
