import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

const pool = new Pool({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const CEPEDA_CEDULA = '79262397'
const ESPRIELLA_CEDULA = '11004242'

const DATA_DIR = path.join(__dirname, '..', 'data')
const JSON_PATH = path.join(DATA_DIR, 'censo_por_departamento.json')
const CSV_PATH = path.join(DATA_DIR, 'CONSOLIDADO.csv')

// Map department name from JSON to CSV (some differ slightly)
const DEPT_NAME_MAP: Record<string, string> = {
  'NORTE DE SANTANDER': 'NORTE DE SAN',
}

function normalizeDeptName(name: string): string {
  return DEPT_NAME_MAP[name] || name
}

interface CensoResumen {
  total_municipios: number
  total_hombres: number
  total_mujeres: number
  total_potencial: number
  total_mesas: number
  total_puestos: number
}

interface CensoMunicipio {
  codigo_departamento: number
  codigo_municipio: string
  municipio: string
  hombres: number
  mujeres: number
  total: number
  mesas: number
  puestos: number
}

interface CensoDept {
  resumen: CensoResumen
  municipios: CensoMunicipio[]
}

// Aggregated vote data: key = "DEP-MUN", value = map of cedula → votes
type MunicipalityVotes = Map<string, { candidateName: string; partyName: string; votes: number }>
type MunicipalitySpecialVotes = Map<string, { blank: number; null_: number; unmarked: number }>

async function parseCSV(): Promise<{
  byMunicipality: Map<string, MunicipalityVotes>
  specialByMunicipality: MunicipalitySpecialVotes
}> {
  console.log('Parsing CSV (this may take a minute)...')

  const byMunicipality = new Map<string, MunicipalityVotes>()
  const specialByMunicipality = new Map<string, { blank: number; null_: number; unmarked: number }>()

  const fileStream = fs.createReadStream(CSV_PATH, { encoding: 'utf8' })
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity })

  let lineNum = 0

  for await (const line of rl) {
    lineNum++
    if (lineNum === 1) continue // skip header

    const parts = line.split(';')
    if (parts.length < 19) continue

    const dep = parts[0].trim()
    const mun = parts[2].trim()
    const cedula = parts[16].trim()
    const candidateName = parts[17].trim()
    const partyName = parts[14].trim()
    const votes = parseInt(parts[18].trim(), 10) || 0

    const key = `${dep}-${mun}`

    if (cedula === '') {
      // Special votes: blank, null, unmarked
      if (!specialByMunicipality.has(key)) {
        specialByMunicipality.set(key, { blank: 0, null_: 0, unmarked: 0 })
      }
      const special = specialByMunicipality.get(key)!
      if (candidateName === 'VOTOS EN BLANCO') special.blank += votes
      else if (candidateName === 'VOTOS NULOS') special.null_ += votes
      else if (candidateName === 'VOTOS NO MARCADOS') special.unmarked += votes
    } else {
      // Real candidate votes
      if (!byMunicipality.has(key)) {
        byMunicipality.set(key, new Map())
      }
      const munMap = byMunicipality.get(key)!
      if (!munMap.has(cedula)) {
        munMap.set(cedula, { candidateName, partyName, votes: 0 })
      }
      munMap.get(cedula)!.votes += votes
    }
  }

  console.log(`Parsed ${lineNum} lines. Found ${byMunicipality.size} municipality-candidate entries.`)
  return { byMunicipality, specialByMunicipality }
}

async function main() {
  console.log('Starting seed...')

  // Read census JSON
  const censoRaw = fs.readFileSync(JSON_PATH, 'utf8')
  const censo: Record<string, CensoDept> = JSON.parse(censoRaw)

  // Parse CSV
  const { byMunicipality, specialByMunicipality } = await parseCSV()

  // Clean DB
  console.log('Cleaning existing data...')
  await prisma.candidateResult.deleteMany()
  await prisma.municipality.deleteMany()
  await prisma.department.deleteMany()

  const deptNames = Object.keys(censo).filter(d => d !== 'CONSULADOS')

  console.log(`Seeding ${deptNames.length} departments...`)

  for (const deptName of deptNames) {
    const deptData = censo[deptName]
    const { resumen, municipios } = deptData

    // Use a stable dept code from the first municipality
    // codigo_departamento may be a string like "01" in the JSON when there's a leading zero
    const deptCode = parseInt(String(municipios[0]?.codigo_departamento ?? 0), 10)
    const csvDeptName = normalizeDeptName(deptName)

    // Aggregate dept-level votes
    let deptCepeda = 0
    let deptEspriella = 0
    let deptTotalEmitted = 0
    let deptBlank = 0
    let deptNull = 0

    // Create department record
    const department = await prisma.department.create({
      data: {
        code: deptCode,
        name: deptName,
        totalMunicipalities: resumen.total_municipios,
        totalHombres: resumen.total_hombres,
        totalMujeres: resumen.total_mujeres,
        totalPotencial: resumen.total_potencial,
        totalMesas: resumen.total_mesas,
        totalPuestos: resumen.total_puestos,
      },
    })

    // Seed municipalities
    for (const mun of municipios) {
      // Find matching CSV data: try dep code (padded) + mun code
      // Both values may be numbers or strings with/without leading zeros
      const csvDep = String(deptCode).padStart(2, '0')
      const csvMun = String(mun.codigo_municipio).padStart(3, '0')
      const key = `${csvDep}-${csvMun}`

      const munVotes = byMunicipality.get(key) || new Map()
      const specialVotes = specialByMunicipality.get(key) || { blank: 0, null_: 0, unmarked: 0 }

      // Compute per-candidate totals
      const candidateRows: { cedula: string; name: string; party: string; votes: number }[] = []
      let munTotalCandidateVotes = 0

      for (const [cedula, data] of munVotes) {
        candidateRows.push({ cedula, name: data.candidateName, party: data.partyName, votes: data.votes })
        munTotalCandidateVotes += data.votes
      }

      const munTotalEmitted = munTotalCandidateVotes + specialVotes.blank + specialVotes.null_ + specialVotes.unmarked
      const participation = mun.total > 0 ? (munTotalEmitted / mun.total) * 100 : 0

      // Sort by votes descending
      candidateRows.sort((a, b) => b.votes - a.votes)
      const winner = candidateRows[0]
      const second = candidateRows[1]

      const cepedaVotes = munVotes.get(CEPEDA_CEDULA)?.votes ?? 0
      const espriellaVotes = munVotes.get(ESPRIELLA_CEDULA)?.votes ?? 0
      const margin = Math.abs(cepedaVotes - espriellaVotes)
      const marginPct = munTotalCandidateVotes > 0 ? (margin / munTotalCandidateVotes) * 100 : 0

      deptCepeda += cepedaVotes
      deptEspriella += espriellaVotes
      deptTotalEmitted += munTotalEmitted
      deptBlank += specialVotes.blank
      deptNull += specialVotes.null_

      const municipality = await prisma.municipality.create({
        data: {
          departmentCode: deptCode,
          municipalityCode: String(mun.codigo_municipio).padStart(3, '0'),
          name: mun.municipio,
          hombres: mun.hombres,
          mujeres: mun.mujeres,
          totalPotencial: mun.total,
          mesas: mun.mesas,
          puestos: mun.puestos,
          cepedaVotes,
          espriellaVotes,
          totalEmitted: munTotalEmitted,
          blankVotes: specialVotes.blank,
          nullVotes: specialVotes.null_,
          participationPct: parseFloat(participation.toFixed(2)),
          winnerName: winner?.name ?? null,
          winnerVotes: winner?.votes ?? 0,
          secondName: second?.name ?? null,
          secondVotes: second?.votes ?? 0,
          margin,
          marginPct: parseFloat(marginPct.toFixed(2)),
        },
      })

      // Insert candidate results
      if (candidateRows.length > 0) {
        const candidateData = candidateRows.map(c => ({
          municipalityId: municipality.id,
          candidateName: c.name,
          partyName: c.party,
          candidateCedula: c.cedula,
          votes: c.votes,
          pct: munTotalCandidateVotes > 0 ? parseFloat(((c.votes / munTotalCandidateVotes) * 100).toFixed(2)) : 0,
        }))

        await prisma.candidateResult.createMany({ data: candidateData })
      }
    }

    // Update department with aggregated results
    const deptCandidateRows: { cedula: string; votes: number }[] = []
    // Collect all candidate totals for this dept
    const deptCandidateMap = new Map<string, { name: string; party: string; votes: number }>()
    for (const mun of municipios) {
      const csvDep = String(deptCode).padStart(2, '0')
      const csvMun = String(mun.codigo_municipio).padStart(3, '0')
      const key = `${csvDep}-${csvMun}`
      const munVotes = byMunicipality.get(key) || new Map()
      for (const [cedula, data] of munVotes) {
        if (!deptCandidateMap.has(cedula)) {
          deptCandidateMap.set(cedula, { name: data.candidateName, party: data.partyName, votes: 0 })
        }
        deptCandidateMap.get(cedula)!.votes += data.votes
      }
    }

    const sortedDept = [...deptCandidateMap.entries()].sort((a, b) => b[1].votes - a[1].votes)
    const deptWinner = sortedDept[0]
    const deptSecond = sortedDept[1]
    const deptTotalCandidate = sortedDept.reduce((s, [, v]) => s + v.votes, 0)
    const deptMargin = Math.abs(deptCepeda - deptEspriella)
    const deptMarginPct = deptTotalCandidate > 0 ? (deptMargin / deptTotalCandidate) * 100 : 0
    const deptParticipation = resumen.total_potencial > 0 ? (deptTotalEmitted / resumen.total_potencial) * 100 : 0

    await prisma.department.update({
      where: { id: department.id },
      data: {
        cepedaVotes: deptCepeda,
        espriellaVotes: deptEspriella,
        totalEmitted: deptTotalEmitted,
        blankVotes: deptBlank,
        nullVotes: deptNull,
        participationPct: parseFloat(deptParticipation.toFixed(2)),
        winnerName: deptWinner?.[1].name ?? null,
        winnerVotes: deptWinner?.[1].votes ?? 0,
        secondName: deptSecond?.[1].name ?? null,
        secondVotes: deptSecond?.[1].votes ?? 0,
        margin: deptMargin,
        marginPct: parseFloat(deptMarginPct.toFixed(2)),
      },
    })

    console.log(`  ✓ ${deptName} (${municipios.length} municipios)`)
  }

  console.log('Seed completed successfully!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
