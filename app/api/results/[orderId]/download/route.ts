import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { normalizePlanToMarkdown } from '@/lib/formatPlan'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ orderId?: string }>
}

export async function GET(request: Request, ctx: RouteContext) {
  const { orderId: rawOrderId } = await ctx.params
  const orderId = rawOrderId?.trim() ?? ''

  if (!orderId) {
    return NextResponse.json(
      { error: 'Invalid orderId' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { accessToken: true, result: { select: { resultText: true } } },
  })

  const accessToken = order?.accessToken ?? ''
  const requestToken = new URL(request.url).searchParams.get('token')?.trim() ?? ''

  if (!order || !requestToken || accessToken !== requestToken) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const rawResult = order.result?.resultText?.trim()
  if (!rawResult) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const normalizedText = normalizePlanToMarkdown(rawResult)
  return new NextResponse(normalizedText, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="gtm-result-${orderId}.txt"`,
      'Cache-Control': 'no-store',
    },
  })
}
