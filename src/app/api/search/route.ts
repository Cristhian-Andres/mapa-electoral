import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim()

    if (!q || q.length < 2) {
      return NextResponse.json([])
    }

    const municipalities = await prisma.municipality.findMany({
      where: {
        name: {
          contains: q.toUpperCase(),
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        municipalityCode: true,
        departmentCode: true,
        winnerName: true,
        department: { select: { name: true } },
      },
      take: 10,
      orderBy: { totalPotencial: 'desc' },
    })

    return NextResponse.json(municipalities)
  } catch (error) {
    console.error('GET /api/search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
