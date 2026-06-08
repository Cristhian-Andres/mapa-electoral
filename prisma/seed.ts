import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool, Client } from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

const connStr = process.env.DIRECT_URL ?? process.env.DATABASE_URL!
const sslOpts = { rejectUnauthorized: false }

const pool = new Pool({
  connectionString: connStr,
  ssl: sslOpts,
  keepAlive: true,
  keepAliveInitialDelayMillis: 1000,
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 60000,
  max: 5,
})
// Disable statement timeout on every new connection in the pool
pool.on('connect', client => { client.query('SET statement_timeout = 0').catch(() => {}) })

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const CEPEDA_CEDULA    = '79262397'
const ESPRIELLA_CEDULA = '11004242'
const VALENCIA_CEDULA  = '25280205'
const FAJARDO_CEDULA   = '70546658'

const CANDIDATE_NAMES: Record<string, string> = {
  [CEPEDA_CEDULA]:    'IVÁN CEPEDA CASTRO',
  [ESPRIELLA_CEDULA]: 'ABELARDO DE LA ESPRIELLA',
  [VALENCIA_CEDULA]:  'PALOMA VALENCIA LASERNA',
  [FAJARDO_CEDULA]:   'SERGIO FAJARDO VALDERRAMA',
}

const DATA_DIR  = path.join(__dirname, '..', 'data')
const JSON_PATH = path.join(DATA_DIR, 'censo_por_departamento.json')
const CSV_PATH  = path.join(DATA_DIR, 'CONSOLIDADO.csv')

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

type MunicipalityVotes = Map<string, { candidateName: string; partyName: string; votes: number }>
type SpecialVotes      = { blank: number; null_: number; unmarked: number }

interface PuestoData {
  puestoName: string
  mesaVotes: Map<string, Record<string, number>> // mesaNum → { cedula: votes }
}

async function parseCSV(): Promise<{
  byMunicipality:        Map<string, MunicipalityVotes>
  specialByMunicipality: Map<string, SpecialVotes>
  byMunMesa:             Map<string, Map<string, PuestoData>>
}> {
  console.log('Parsing CSV (this may take a couple of minutes)...')

  const byMunicipality        = new Map<string, MunicipalityVotes>()
  const specialByMunicipality = new Map<string, SpecialVotes>()
  const byMunMesa             = new Map<string, Map<string, PuestoData>>()

  const fileStream = fs.createReadStream(CSV_PATH, { encoding: 'utf8' })
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity })

  let lineNum = 0

  for await (const line of rl) {
    lineNum++
    if (lineNum === 1) continue

    const parts = line.split(';')
    if (parts.length < 19) continue

    const dep          = parts[0].trim()
    const mun          = parts[2].trim()
    const zona         = parts[4].trim()
    const puestoCode   = parts[5].trim()
    const puestoName   = parts[6].trim()
    const mesaNum      = parts[7].trim()
    const cedula       = parts[16].trim()
    const candidateName = parts[17].trim()
    const partyName    = parts[14].trim()
    const votes        = parseInt(parts[18].trim(), 10) || 0

    const munKey = `${dep}-${mun}`
    const pKey   = `${zona}-${puestoCode}`

    if (cedula === '') {
      if (!specialByMunicipality.has(munKey)) {
        specialByMunicipality.set(munKey, { blank: 0, null_: 0, unmarked: 0 })
      }
      const special = specialByMunicipality.get(munKey)!
      if (candidateName === 'VOTOS EN BLANCO') special.blank += votes
      else if (candidateName === 'VOTOS NULOS') special.null_ += votes
      else if (candidateName === 'VOTOS NO MARCADOS') special.unmarked += votes
    } else {
      if (!byMunicipality.has(munKey)) byMunicipality.set(munKey, new Map())
      const munMap = byMunicipality.get(munKey)!
      if (!munMap.has(cedula)) munMap.set(cedula, { candidateName, partyName, votes: 0 })
      munMap.get(cedula)!.votes += votes

      // Only track per-mesa data for the 4 main candidates
      if (
        cedula === CEPEDA_CEDULA    ||
        cedula === ESPRIELLA_CEDULA ||
        cedula === VALENCIA_CEDULA  ||
        cedula === FAJARDO_CEDULA
      ) {
        if (!byMunMesa.has(munKey)) byMunMesa.set(munKey, new Map())
        const puestoMap = byMunMesa.get(munKey)!
        if (!puestoMap.has(pKey)) puestoMap.set(pKey, { puestoName, mesaVotes: new Map() })
        const pData = puestoMap.get(pKey)!
        if (!pData.mesaVotes.has(mesaNum)) pData.mesaVotes.set(mesaNum, {})
        const mv = pData.mesaVotes.get(mesaNum)!
        mv[cedula] = (mv[cedula] ?? 0) + votes
      }
    }

    if (lineNum % 200_000 === 0) {
      console.log(`  ${lineNum.toLocaleString()} lines processed...`)
    }
  }

  console.log(`Parsed ${lineNum.toLocaleString()} lines. ${byMunicipality.size} municipalities.`)
  return { byMunicipality, specialByMunicipality, byMunMesa }
}

function computeMesaWinner(mv: Record<string, number>): string {
  let winCedula = ''
  let winVotes  = 0
  for (const [ced, v] of Object.entries(mv)) {
    if (v > winVotes) { winVotes = v; winCedula = ced }
  }
  return winCedula
}

async function main() {
  console.log('Starting seed...')

  const censoRaw = fs.readFileSync(JSON_PATH, 'utf8')
  const censo: Record<string, CensoDept> = JSON.parse(censoRaw)

  const { byMunicipality, specialByMunicipality, byMunMesa } = await parseCSV()

  console.log('Cleaning existing data...')
  // Use a dedicated Client (not pool) so SET statement_timeout=0 sticks for TRUNCATE
  const cleanClient = new Client({ connectionString: connStr, ssl: sslOpts })
  await cleanClient.connect()
  await cleanClient.query('SET statement_timeout = 0')
  await cleanClient.query('TRUNCATE TABLE "Department" CASCADE')
  await cleanClient.end()
  console.log('Tables truncated.')

  const deptNames = Object.keys(censo).filter(d => d !== 'CONSULADOS')
  console.log(`Seeding ${deptNames.length} departments...`)

  for (const deptName of deptNames) {
    const deptData = censo[deptName]
    const { resumen, municipios } = deptData
    const deptCode = parseInt(String(municipios[0]?.codigo_departamento ?? 0), 10)

    // ── 1. Create department shell ──────────────────────────────────────────
    const department = await prisma.department.create({
      data: {
        code:                deptCode,
        name:                deptName,
        totalMunicipalities: resumen.total_municipios,
        totalHombres:        resumen.total_hombres,
        totalMujeres:        resumen.total_mujeres,
        totalPotencial:      resumen.total_potencial,
        totalMesas:          resumen.total_mesas,
        totalPuestos:        resumen.total_puestos,
      },
    })

    // ── 2. Build municipality data objects ──────────────────────────────────
    let deptCepeda = 0, deptEspriella = 0, deptTotalEmitted = 0, deptBlank = 0, deptNull = 0
    const deptCandidateMap = new Map<string, { name: string; party: string; votes: number }>()

    // Prepared municipality insert data (no ID yet)
    const munInsertData: {
      key: string // lookup key for candidates/puestos
      data: Parameters<typeof prisma.municipality.create>[0]['data']
      candidateRows: { cedula: string; name: string; party: string; votes: number; pct: number }[]
      puestoRows: {
        puestoCode: string; puestoName: string
        mesasTotal: number; mesasCepeda: number; mesasEspriella: number
        mesasValencia: number; mesasFajardo: number
        cepedaVotes: number; espriellaVotes: number; valenciaVotes: number; fajardoVotes: number
        totalVotes: number; winnerName: string | null; winnerCedula: string | null
      }[]
    }[] = []

    for (const mun of municipios) {
      const csvDep = String(deptCode).padStart(2, '0')
      const csvMun = String(mun.codigo_municipio).padStart(3, '0')
      const key    = `${csvDep}-${csvMun}`

      const munVotes     = byMunicipality.get(key) || new Map()
      const specialVotes = specialByMunicipality.get(key) || { blank: 0, null_: 0, unmarked: 0 }
      const puestoMap    = byMunMesa.get(key)

      // Candidate rows
      const candidateRows: { cedula: string; name: string; party: string; votes: number }[] = []
      let munTotalCandidateVotes = 0
      for (const [cedula, data] of munVotes) {
        candidateRows.push({ cedula, name: data.candidateName, party: data.partyName, votes: data.votes })
        munTotalCandidateVotes += data.votes
        // Dept-level aggregate
        if (!deptCandidateMap.has(cedula)) deptCandidateMap.set(cedula, { name: data.candidateName, party: data.partyName, votes: 0 })
        deptCandidateMap.get(cedula)!.votes += data.votes
      }
      candidateRows.sort((a, b) => b.votes - a.votes)

      const munTotalEmitted = munTotalCandidateVotes + specialVotes.blank + specialVotes.null_ + specialVotes.unmarked
      const participation   = mun.total > 0 ? (munTotalEmitted / mun.total) * 100 : 0
      const winner  = candidateRows[0]
      const second  = candidateRows[1]

      const cepedaVotes    = munVotes.get(CEPEDA_CEDULA)?.votes    ?? 0
      const espriellaVotes = munVotes.get(ESPRIELLA_CEDULA)?.votes ?? 0
      const margin         = Math.abs(cepedaVotes - espriellaVotes)
      const marginPct      = munTotalCandidateVotes > 0 ? (margin / munTotalCandidateVotes) * 100 : 0

      deptCepeda       += cepedaVotes
      deptEspriella    += espriellaVotes
      deptTotalEmitted += munTotalEmitted
      deptBlank        += specialVotes.blank
      deptNull         += specialVotes.null_

      // Puesto rows
      let munMesasCepeda = 0, munMesasEspriella = 0, munMesasValencia = 0, munMesasFajardo = 0, munMesasTotal = 0
      const puestoRows: (typeof munInsertData)[0]['puestoRows'] = []

      if (puestoMap) {
        for (const [pCode, pData] of puestoMap) {
          let pMesasCepeda = 0, pMesasEspriella = 0, pMesasValencia = 0, pMesasFajardo = 0
          let pCepeda = 0, pEspriella = 0, pValencia = 0, pFajardo = 0, pTotal = 0

          for (const [, mv] of pData.mesaVotes) {
            const winCed = computeMesaWinner(mv)
            if      (winCed === CEPEDA_CEDULA)    pMesasCepeda++
            else if (winCed === ESPRIELLA_CEDULA)  pMesasEspriella++
            else if (winCed === VALENCIA_CEDULA)   pMesasValencia++
            else if (winCed === FAJARDO_CEDULA)    pMesasFajardo++

            pCepeda    += mv[CEPEDA_CEDULA]    ?? 0
            pEspriella += mv[ESPRIELLA_CEDULA] ?? 0
            pValencia  += mv[VALENCIA_CEDULA]  ?? 0
            pFajardo   += mv[FAJARDO_CEDULA]   ?? 0
            pTotal     += Object.values(mv).reduce((s, v) => s + v, 0)
          }

          const pVotesByCed = ([
            [CEPEDA_CEDULA, pCepeda],
            [ESPRIELLA_CEDULA, pEspriella],
            [VALENCIA_CEDULA, pValencia],
            [FAJARDO_CEDULA, pFajardo],
          ] as [string, number][]).sort((a, b) => b[1] - a[1])

          const pWinnerCedula = pVotesByCed[0][1] > 0 ? pVotesByCed[0][0] : null
          const pWinnerName   = pWinnerCedula ? (CANDIDATE_NAMES[pWinnerCedula] ?? null) : null

          puestoRows.push({
            puestoCode:     pCode,
            puestoName:     pData.puestoName,
            mesasTotal:     pData.mesaVotes.size,
            mesasCepeda:    pMesasCepeda,
            mesasEspriella: pMesasEspriella,
            mesasValencia:  pMesasValencia,
            mesasFajardo:   pMesasFajardo,
            cepedaVotes:    pCepeda,
            espriellaVotes: pEspriella,
            valenciaVotes:  pValencia,
            fajardoVotes:   pFajardo,
            totalVotes:     pTotal,
            winnerName:     pWinnerName,
            winnerCedula:   pWinnerCedula,
          })

          munMesasCepeda    += pMesasCepeda
          munMesasEspriella += pMesasEspriella
          munMesasValencia  += pMesasValencia
          munMesasFajardo   += pMesasFajardo
          munMesasTotal     += pData.mesaVotes.size
        }
      }

      munInsertData.push({
        key,
        data: {
          departmentCode:   deptCode,
          municipalityCode: csvMun,
          name:             mun.municipio,
          hombres:          mun.hombres,
          mujeres:          mun.mujeres,
          totalPotencial:   mun.total,
          mesas:            mun.mesas,
          puestos:          mun.puestos,
          cepedaVotes,
          espriellaVotes,
          totalEmitted:     munTotalEmitted,
          blankVotes:       specialVotes.blank,
          nullVotes:        specialVotes.null_,
          participationPct: parseFloat(participation.toFixed(2)),
          winnerName:       winner?.name ?? null,
          winnerVotes:      winner?.votes ?? 0,
          secondName:       second?.name ?? null,
          secondVotes:      second?.votes ?? 0,
          margin,
          marginPct:        parseFloat(marginPct.toFixed(2)),
          mesasTotal:       munMesasTotal,
          mesasCepeda:      munMesasCepeda,
          mesasEspriella:   munMesasEspriella,
          mesasValencia:    munMesasValencia,
          mesasFajardo:     munMesasFajardo,
        },
        candidateRows: candidateRows.map(c => ({
          ...c,
          pct: munTotalCandidateVotes > 0 ? parseFloat(((c.votes / munTotalCandidateVotes) * 100).toFixed(2)) : 0,
        })),
        puestoRows,
      })
    }

    // ── 3. Batch-insert all municipalities → get IDs back ───────────────────
    const createdMuns = await prisma.municipality.createManyAndReturn({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: munInsertData.map(m => m.data) as any[],
      select: { id: true, municipalityCode: true },
    })

    // Map municipalityCode → id
    const munIdMap = new Map<string, number>()
    for (const m of createdMuns) munIdMap.set(m.municipalityCode, m.id)

    // ── 4. Batch-insert candidates and puestos for the whole department ─────
    const allCandidates: object[] = []
    const allPuestos:    object[] = []

    for (const m of munInsertData) {
      const munId = munIdMap.get(m.data.municipalityCode as string)
      if (!munId) continue
      for (const c of m.candidateRows) {
        allCandidates.push({
          municipalityId:  munId,
          candidateName:   c.name,
          partyName:       c.party,
          candidateCedula: c.cedula,
          votes:           c.votes,
          pct:             c.pct,
        })
      }
      for (const p of m.puestoRows) {
        allPuestos.push({ ...p, municipalityId: munId })
      }
    }

    if (allCandidates.length > 0) {
      await prisma.candidateResult.createMany({ data: allCandidates as Parameters<typeof prisma.candidateResult.createMany>[0]['data'] })
    }
    if (allPuestos.length > 0) {
      await prisma.puestoResult.createMany({ data: allPuestos as Parameters<typeof prisma.puestoResult.createMany>[0]['data'] })
    }

    // ── 5. Update department with vote totals ───────────────────────────────
    const sortedDept      = [...deptCandidateMap.entries()].sort((a, b) => b[1].votes - a[1].votes)
    const deptWinner      = sortedDept[0]
    const deptSecond      = sortedDept[1]
    const deptTotalCand   = sortedDept.reduce((s, [, v]) => s + v.votes, 0)
    const deptMargin      = Math.abs(deptCepeda - deptEspriella)
    const deptMarginPct   = deptTotalCand > 0 ? (deptMargin / deptTotalCand) * 100 : 0
    const deptPartic      = resumen.total_potencial > 0 ? (deptTotalEmitted / resumen.total_potencial) * 100 : 0

    await prisma.department.update({
      where: { id: department.id },
      data: {
        cepedaVotes:      deptCepeda,
        espriellaVotes:   deptEspriella,
        totalEmitted:     deptTotalEmitted,
        blankVotes:       deptBlank,
        nullVotes:        deptNull,
        participationPct: parseFloat(deptPartic.toFixed(2)),
        winnerName:       deptWinner?.[1].name  ?? null,
        winnerVotes:      deptWinner?.[1].votes ?? 0,
        secondName:       deptSecond?.[1].name  ?? null,
        secondVotes:      deptSecond?.[1].votes ?? 0,
        margin:           deptMargin,
        marginPct:        parseFloat(deptMarginPct.toFixed(2)),
      },
    })

    console.log(`  ✓ ${deptName} (${municipios.length} mun, ${allPuestos.length} puestos)`)
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
    await pool.end()
  })
