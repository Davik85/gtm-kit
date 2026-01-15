import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { normalizePlanToMarkdown } from '@/lib/formatPlan'

export const runtime = 'nodejs'
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' }
const RESULT_LOG_PREFIX = '[result]'

type RouteContext = {
  params: Promise<{ orderId?: string }>
}

const jsonResponse = <T>(data: T, init?: ResponseInit) => {
  return NextResponse.json(data, {
    ...init,
    headers: { ...init?.headers, ...NO_STORE_HEADERS },
  })
}

const logResultStatus = ({
  orderId,
  status,
  resultId,
}: {
  orderId: string
  status: string
  resultId?: string | null
}) => {
  const suffix = resultId ? ` resultId=${resultId}` : ''
  console.info(`${RESULT_LOG_PREFIX} orderId=${orderId} status=${status}${suffix}`)
}

export async function GET(request: Request, ctx: RouteContext) {
  const { orderId: paramOrderId } = await ctx.params
  const url = new URL(request.url)
  const queryOrderId = url.searchParams.get('orderId') ?? ''
  const accessToken = url.searchParams.get('token')?.trim() ?? ''
  const pathname = url.pathname
  const parts = pathname.split('/').filter(Boolean)
  const resultsIndex = parts.lastIndexOf('results')
  const pathOrderId = resultsIndex >= 0 ? parts[resultsIndex + 1] ?? '' : ''
  const orderId = (paramOrderId || queryOrderId || pathOrderId).trim()

  if (!orderId) {
    logResultStatus({ orderId: 'unknown', status: 'invalid' })
    return jsonResponse(
      {
        ok: false,
        code: 'INVALID_ORDER_ID',
        debug: {
          paramOrderId,
          queryOrderId,
          pathOrderId,
          url: request.url,
        },
      },
      { status: 400 },
    )
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      accessToken: true,
      result: { select: { id: true, resultText: true, updatedAt: true } },
    },
  })

  if (!order || !accessToken || order.accessToken !== accessToken) {
    logResultStatus({ orderId, status: 'access_denied' })
    return jsonResponse({ ok: false, code: 'ACCESS_DENIED' }, { status: 404 })
  }

  if (order.result?.resultText) {
    logResultStatus({ orderId, status: 'ready', resultId: order.result.id })
    const normalizedText = normalizePlanToMarkdown(order.result.resultText)
    return jsonResponse({
      ok: true,
      status: 'ready',
      result: {
        format: 'markdown',
        content: normalizedText,
        updatedAt: order.result.updatedAt,
      },
    })
  }

  if (order.status === 'error') {
    logResultStatus({ orderId, status: 'error' })
    return jsonResponse(
      { ok: false, code: 'ORDER_GENERATION_FAILED' },
      { status: 500 },
    )
  }

  const status = order.status === 'generating' ? 'generating' : 'pending'
  logResultStatus({ orderId, status })
  return jsonResponse({ ok: true, status }, { status: 202 })
}
