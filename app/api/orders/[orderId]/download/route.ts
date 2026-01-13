import { NextRequest } from 'next/server'
import { normalizePlanToMarkdown } from '@/lib/formatPlan'
import { buildDocxFromMarkdown, buildPdfFromMarkdown } from '@/lib/planExport'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

const NOT_FOUND = 'Result not found.'
const BAD_REQUEST = 'Missing orderId.'
const TITLE = 'Go-to-market plan'

const asBinaryResponse = (bytes: Uint8Array, mimeType: string, filename: string) => {
  const arrayBuffer = new Uint8Array(bytes).buffer
  const body = new Blob([arrayBuffer], { type: mimeType })

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> },
): Promise<Response> {
  const { orderId: rawOrderId } = await context.params
  const orderId = (rawOrderId ?? '').trim()

  if (!orderId) {
    return new Response(BAD_REQUEST, { status: 400 })
  }

  const url = new URL(req.url)
  const format = (url.searchParams.get('format') ?? 'docx').toLowerCase()

  // Keep filename safe and simple
  const safeName = `gtm-kit-${orderId.replace(/[^a-zA-Z0-9-_]/g, '_')}`

  const row = await prisma.result.findUnique({
    where: { orderId },
    select: { resultText: true },
  })

  const raw = row?.resultText?.trim()
  if (!raw) {
    return new Response(NOT_FOUND, { status: 404 })
  }

  // IMPORTANT: export must match the on-page formatting rules
  const normalized = normalizePlanToMarkdown(raw)

  if (format === 'txt') {
    return new Response(normalized, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${safeName}.txt"`,
        'Cache-Control': 'no-store',
      },
    })
  }

  if (format === 'pdf') {
    const pdfBytes = await buildPdfFromMarkdown(normalized, TITLE)
    return asBinaryResponse(pdfBytes, 'application/pdf', `${safeName}.pdf`)
  }

  // default: docx
  const docxBytes = await buildDocxFromMarkdown(normalized, TITLE)
  return asBinaryResponse(
    docxBytes,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    `${safeName}.docx`,
  )
}
