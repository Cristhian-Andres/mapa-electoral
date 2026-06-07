import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, MapPin, BarChart2, Trophy } from 'lucide-react'
import CandidateComparison from '@/components/dashboard/CandidateComparison'
import ParticipationCard from '@/components/dashboard/ParticipationCard'
import VoteDonut from '@/components/dashboard/VoteDonut'
import StatCard from '@/components/ui/StatCard'
import { formatNumber, formatPct } from '@/lib/utils'

interface Props {
  params: Promise<{ depCode: string; munCode: string }>
}

export async function generateMetadata({ params }: Props) {
  const { depCode, munCode } = await params
  const mun = await prisma.municipality.findUnique({
    where: { departmentCode_municipalityCode: { departmentCode: parseInt(depCode), municipalityCode: munCode } },
    select: { name: true },
  })
  return { title: mun ? `${mun.name} · Mapa Electoral Colombia` : 'Municipio' }
}

export default async function MunicipalityPage({ params }: Props) {
  const { depCode, munCode } = await params
  const deptCode = parseInt(depCode, 10)

  const mun = await prisma.municipality.findUnique({
    where: { departmentCode_municipalityCode: { departmentCode: deptCode, municipalityCode: munCode } },
    include: {
      candidateResults: { orderBy: { votes: 'desc' } },
      department: { select: { name: true, code: true } },
    },
  })

  if (!mun) notFound()

  const isBlue = mun.winnerName?.includes('CEPEDA')
  const isRed = mun.winnerName?.includes('ESPRIELLA')
  const winnerShort = isBlue ? 'Cepeda Castro' : isRed ? 'De la Espriella' : 'Sin datos'

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Back */}
      <Link
        href={`/departamento/${deptCode}`}
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        {mun.department.name}
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
            isBlue ? 'bg-blue-600' : isRed ? 'bg-red-600' : 'bg-gray-500'
          }`}
        >
          <MapPin className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{mun.name}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {mun.department.name} · {formatNumber(mun.totalPotencial)} habilitados para votar
          </p>
        </div>
        {mun.winnerName && (
          <div
            className={`ml-auto text-center px-4 py-2 rounded-xl border-2 ${
              isBlue ? 'border-blue-300 bg-blue-50' : 'border-red-300 bg-red-50'
            }`}
          >
            <div className="flex items-center gap-1.5 justify-center">
              <Trophy className={`w-4 h-4 ${isBlue ? 'text-blue-600' : 'text-red-600'}`} />
              <span className="text-gray-900 font-bold text-sm">{winnerShort}</span>
            </div>
            <p className="text-gray-500 text-xs mt-0.5">{formatNumber(mun.winnerVotes)} votos</p>
          </div>
        )}
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Habilitados"
          value={formatNumber(mun.totalPotencial)}
          sub={`${formatNumber(mun.hombres)} H · ${formatNumber(mun.mujeres)} M`}
          color="gray"
        />
        <StatCard
          label="Votos emitidos"
          value={formatNumber(mun.totalEmitted)}
          sub={formatPct(mun.participationPct) + ' del censo'}
          color="green"
        />
        <StatCard
          label="Puestos / Mesas"
          value={`${mun.puestos} / ${mun.mesas}`}
          sub="de votación"
          color="gray"
        />
        <StatCard
          label="Margen"
          value={formatPct(mun.marginPct)}
          sub={`${formatNumber(mun.margin)} votos`}
          color={isBlue ? 'blue' : isRed ? 'red' : 'gray'}
        />
      </div>

      {/* Main comparison */}
      <div
        className={`rounded-2xl p-6 border-2 mb-6 ${
          isBlue ? 'border-blue-300 bg-blue-50' : isRed ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
        }`}
      >
        <h2 className="text-gray-900 font-bold text-lg mb-5 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-amber-500" />
          Iván Cepeda vs Abelardo De la Espriella
        </h2>
        <CandidateComparison
          cepedaVotes={mun.cepedaVotes}
          espriellaVotes={mun.espriellaVotes}
          totalEmitted={mun.totalEmitted}
          margin={mun.margin}
          marginPct={mun.marginPct}
          winnerName={mun.winnerName}
          size="lg"
        />
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ParticipationCard
          potencial={mun.totalPotencial}
          emitted={mun.totalEmitted}
          participationPct={mun.participationPct}
          blankVotes={mun.blankVotes}
          nullVotes={mun.nullVotes}
          mesas={mun.mesas}
          puestos={mun.puestos}
        />

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <h3 className="text-gray-900 font-semibold mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            Todos los candidatos
          </h3>
          <VoteDonut
            candidateResults={mun.candidateResults}
            blankVotes={mun.blankVotes}
            nullVotes={mun.nullVotes}
            totalEmitted={mun.totalEmitted}
          />
        </div>
      </div>

      {/* All candidates table */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
        <h2 className="text-gray-900 font-semibold mb-4">Resultados completos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-2 py-2.5 text-gray-500 font-medium">#</th>
                <th className="text-left px-2 py-2.5 text-gray-500 font-medium">Candidato</th>
                <th className="text-left px-2 py-2.5 text-gray-500 font-medium hidden sm:table-cell">Partido</th>
                <th className="text-right px-2 py-2.5 text-gray-500 font-medium">Votos</th>
                <th className="text-right px-2 py-2.5 text-gray-500 font-medium">%</th>
                <th className="px-2 py-2.5 w-24" />
              </tr>
            </thead>
            <tbody>
              {mun.candidateResults.map((c: import('@/types').CandidateResult, i: number) => {
                const isCepeda = c.candidateCedula === '79262397'
                const isEspriella = c.candidateCedula === '11004242'
                return (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-2 py-2.5 text-gray-400">{i + 1}</td>
                    <td className="px-2 py-2.5">
                      <span
                        className={`font-medium ${
                          isCepeda ? 'text-blue-600' : isEspriella ? 'text-red-600' : 'text-gray-700'
                        }`}
                      >
                        {c.candidateName}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-gray-400 hidden sm:table-cell text-xs">
                      {c.partyName}
                    </td>
                    <td className="px-2 py-2.5 text-right text-gray-900 font-medium">
                      {formatNumber(c.votes)}
                    </td>
                    <td className="px-2 py-2.5 text-right text-gray-500">
                      {formatPct(c.pct)}
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isCepeda ? 'bg-blue-500' : isEspriella ? 'bg-red-500' : 'bg-gray-400'}`}
                          style={{ width: `${c.pct}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-3 text-center text-sm">
          <div>
            <p className="text-gray-500 text-xs">En blanco</p>
            <p className="text-gray-900 font-medium">{formatNumber(mun.blankVotes)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Nulos</p>
            <p className="text-gray-900 font-medium">{formatNumber(mun.nullVotes)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">No marcados</p>
            <p className="text-gray-900 font-medium">
              {formatNumber(mun.totalEmitted - mun.candidateResults.reduce((s, c) => s + c.votes, 0) - mun.blankVotes - mun.nullVotes)}
            </p>
          </div>
        </div>
      </div>

      {/* Social share */}
      <div className="mt-6 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <p className="text-gray-600 text-sm mb-3 font-medium">Compartir resultados</p>
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://twitter.com/intent/tweet?text=En ${mun.name}, ${winnerShort} obtuvo ${formatNumber(mun.winnerVotes ?? 0)} votos con un margen de ${formatPct(mun.marginPct)}. #EleccionesColombia2026 #CepedaPresidente`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Twitter / X
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://mapa-electoral-colombia.vercel.app')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook
          </a>
          <a
            href={`https://api.whatsapp.com/send?text=Resultados en ${mun.name}: ${winnerShort} ganó con ${formatNumber(mun.winnerVotes ?? 0)} votos. Margen: ${formatPct(mun.marginPct)}. #CepedaPresidente`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
