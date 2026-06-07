export interface DepartmentSummary {
  id: number
  code: number
  name: string
  totalMunicipalities: number
  totalHombres: number
  totalMujeres: number
  totalPotencial: number
  totalMesas: number
  totalPuestos: number
  cepedaVotes: number
  espriellaVotes: number
  totalEmitted: number
  blankVotes: number
  nullVotes: number
  participationPct: number
  winnerName: string | null
  winnerVotes: number
  secondName: string | null
  secondVotes: number
  margin: number
  marginPct: number
}

export interface MunicipalitySummary {
  id: number
  departmentCode: number
  municipalityCode: string
  name: string
  hombres: number
  mujeres: number
  totalPotencial: number
  mesas: number
  puestos: number
  cepedaVotes: number
  espriellaVotes: number
  totalEmitted: number
  blankVotes: number
  nullVotes: number
  participationPct: number
  winnerName: string | null
  winnerVotes: number
  secondName: string | null
  secondVotes: number
  margin: number
  marginPct: number
}

export interface CandidateResult {
  id: number
  municipalityId: number
  candidateName: string
  partyName: string
  candidateCedula: string
  votes: number
  pct: number
}

export interface MunicipalityDetail extends MunicipalitySummary {
  candidateResults: CandidateResult[]
}

export interface DepartmentDetail extends DepartmentSummary {
  municipalities: MunicipalitySummary[]
}

export const CEPEDA = {
  name: 'IVÁN CEPEDA CASTRO',
  shortName: 'Cepeda',
  party: 'Pacto Histórico',
  cedula: '79262397',
  color: '#2563EB',
  colorLight: '#DBEAFE',
}

export const ESPRIELLA = {
  name: 'ABELARDO DE LA ESPRIELLA',
  shortName: 'De la Espriella',
  party: 'Defensores de la Patria',
  cedula: '11004242',
  color: '#DC2626',
  colorLight: '#FEE2E2',
}
