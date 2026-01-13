import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { normalizePlanToMarkdown } from '@/lib/formatPlan'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ orderId?: string }>
}

export async function GET(_: Request, ctx: RouteContext) {
  const { orderId: rawOrderId } = await ctx.params
  const orderId = rawOrderId?.trim() ?? ''

  if (!orderId) {
    return NextResponse.json(
      { error: 'Invalid orderId' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const result = await prisma.result.findUnique({
    where: { orderId },
    select: { resultText: true },
  })

  if (!result) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const normalizedText = normalizePlanToMarkdown(result.resultText ?? '')
  return new NextResponse(normalizedText, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="gtm-result-${orderId}.txt"`,
      'Cache-Control': 'no-store',
    },
  })
}
