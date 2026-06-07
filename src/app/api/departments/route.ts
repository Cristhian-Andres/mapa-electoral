import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(departments)
  } catch (error) {
    console.error('GET /api/departments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
