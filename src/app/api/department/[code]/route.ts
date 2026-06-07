import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const deptCode = parseInt(code, 10)

    const department = await prisma.department.findUnique({
      where: { code: deptCode },
      include: {
        municipalities: {
          orderBy: { totalPotencial: 'desc' },
        },
      },
    })

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }

    return NextResponse.json(department)
  } catch (error) {
    console.error('GET /api/department/[code] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
