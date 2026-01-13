import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const runtime = 'nodejs'

export async function GET() {
  const orders = await prisma.order.count()
  return NextResponse.json({ ok: true, orders })
}
