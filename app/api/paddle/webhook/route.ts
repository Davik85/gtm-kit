import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'

export const runtime = 'nodejs'

const SIGNATURE_HEADER = 'paddle-signature'
const PROVIDER = 'paddle'

const parseSignatureHeader = (signature: string) => {
  const parts = signature.split(',').map((part) => part.trim())
  const entries = parts
    .map((part) => {
      const index = part.indexOf('=')
      if (index === -1) return null
      const key = part.slice(0, index).trim()
      const value = part.slice(index + 1).trim()
      return key && value ? [key, value] : null
    })
    .filter((entry): entry is [string, string] => Boolean(entry))
  return Object.fromEntries(entries)
}

const safeCompare = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  if (leftBuffer.length !== rightBuffer.length) return false
  return crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

const isSignatureValid = (signature: string, rawBody: string, secret: string) => {
  const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const expectedHex = computed.toLowerCase()
  const expectedBase64 = Buffer.from(expectedHex, 'hex').toString('base64')
  const normalized = signature.trim()

  const matchesHex = safeCompare(normalized, expectedHex)
  const matchesBase64 = safeCompare(normalized, expectedBase64)

  return matchesHex || matchesBase64
}

type PaddleWebhookEvent = {
  event_id?: string
  event_type?: string
  data?: {
    id?: string
    custom_data?: { orderId?: string }
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signatureHeader =
    request.headers.get(SIGNATURE_HEADER) || request.headers.get(SIGNATURE_HEADER.toUpperCase())
  const secret = process.env.PADDLE_WEBHOOK_SECRET?.trim()

  if (!signatureHeader || !secret) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const signatureParts = parseSignatureHeader(signatureHeader)
  const signature = signatureParts.h1 || signatureHeader

  if (!isSignatureValid(signature, rawBody, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: PaddleWebhookEvent

  try {
    event = JSON.parse(rawBody) as PaddleWebhookEvent
  } catch (error) {
    console.error('Invalid Paddle webhook payload', error)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Prisma expects JSON-serializable value (InputJsonValue), not unknown.
  const eventJson = event as unknown as Prisma.InputJsonValue

  const eventId =
    event.event_id?.trim() ||
    event.data?.id?.trim() ||
    crypto.createHash('sha256').update(rawBody).digest('hex')
  const eventType = event.event_type?.trim() || 'unknown'

  try {
    await prisma.webhookEvent.create({
      data: {
        provider: PROVIDER,
        eventId,
        eventType,
        payload: eventJson,
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ ok: true, duplicate: true })
    }
    throw error
  }

  const transactionId = event.data?.id?.trim() || null
  const orderId = event.data?.custom_data?.orderId?.trim() || null

  let processingResult = 'ignored'

  if (orderId) {
    if (eventType === 'transaction.completed') {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        if (transactionId) {
          const existingPayment = await tx.payment.findUnique({
            where: { paddleTransactionId: transactionId },
          })

          if (existingPayment) {
            await tx.payment.update({
              where: { id: existingPayment.id },
              data: { status: 'completed' },
            })
          } else {
            await tx.payment.create({
              data: {
                orderId,
                paddleTransactionId: transactionId,
                status: 'completed',
                payload: eventJson,
              },
            })
          }
        }

        await tx.order.updateMany({
          where: { id: orderId, status: { in: ['created', 'brief_submitted'] } },
          data: { status: 'paid' },
        })
      })

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true, result: { select: { id: true } } },
      })

      const isGenerating = ['generating', 'generated', 'delivered'].includes(order?.status ?? '')
      const hasResult = Boolean(order?.result?.id)

      if (!isGenerating && !hasResult) {
        const baseUrl = process.env.APP_BASE_URL?.trim().replace(/\/$/, '')
        if (baseUrl) {
          await fetch(`${baseUrl}/api/results/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId }),
          }).catch((error) => {
            console.error('Failed to trigger generation', error)
          })
        }
      }

      processingResult = 'completed'
    }

    if (eventType === 'transaction.canceled' || eventType === 'transaction.payment_failed') {
      if (transactionId) {
        await prisma.payment.updateMany({
          where: { paddleTransactionId: transactionId },
          data: { status: eventType === 'transaction.canceled' ? 'canceled' : 'failed' },
        })
      }

      await prisma.order.updateMany({
        where: { id: orderId, status: { in: ['paid'] } },
        data: { status: 'created' },
      })

      processingResult = 'payment_failed'
    }
  }

  await prisma.webhookEvent.update({
    where: { eventId },
    data: {
      processedAt: new Date(),
      processingResult,
    },
  })

  return NextResponse.json({ ok: true })
}
