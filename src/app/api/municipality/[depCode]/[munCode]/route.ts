import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ depCode: string; munCode: string }> }
) {
  try {
    const { depCode, munCode } = await params
    const deptCode = parseInt(depCode, 10)

    const municipality = await prisma.municipality.findUnique({
      where: {
        departmentCode_municipalityCode: {
          departmentCode: deptCode,
          municipalityCode: munCode,
        },
      },
      include: {
        candidateResults: {
          orderBy: { votes: 'desc' },
        },
        department: {
          select: { name: true, code: true },
        },
      },
    })

    if (!municipality) {
      return NextResponse.json({ error: 'Municipality not found' }, { status: 404 })
    }

    return NextResponse.json(municipality)
  } catch (error) {
    console.error('GET /api/municipality error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
