import { NextRequest } from 'next/server'
import { normalizePlanToMarkdown } from '@/lib/formatPlan'
import { buildDocxFromMarkdown } from '@/lib/planExport'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

const NOT_FOUND = 'Result not found.'
const BAD_REQUEST = 'Missing orderId.'

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  // Create a fresh copy to guarantee a plain ArrayBuffer (not SharedArrayBuffer)
  const copy = Uint8Array.from(bytes)
  return copy.buffer
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
  const safeName = `gtm-kit-${orderId}`

  if (format !== 'docx') {
    return new Response(
      JSON.stringify({ error: 'Unsupported format. Only docx is available.' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      },
    )
  }

  // default: docx
  const docxBytes = await buildDocxFromMarkdown(normalized, 'Go-to-market plan')
  const docxBody = toArrayBuffer(docxBytes)

  return new Response(docxBody, {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${safeName}.docx"`,
      'Cache-Control': 'no-store',
    },
  })
}
