import { NextResponse } from 'next/server'
import type { Payment } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'
import { getPriceIdByTier, paddleRequest } from '@/lib/paddleApi'

export const runtime = 'nodejs'

const ERROR_INVALID_ORDER_ID = 'Invalid orderId'
const ERROR_ORDER_NOT_FOUND = 'Order not found'
const ERROR_ALREADY_PAID = 'Order already paid'
const ERROR_MISSING_CHECKOUT_URL = 'Unable to create checkout'

const getCheckoutUrlFromPayload = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as { data?: { checkout?: { url?: string } }; checkout?: { url?: string } }
  return record.data?.checkout?.url ?? record.checkout?.url ?? null
}

type PaddleTransactionResponse = {
  data?: {
    id?: string
    checkout?: {
      url?: string
    }
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { orderId?: string } | null
  const orderId = body?.orderId?.trim() || ''

  if (!orderId) {
    return NextResponse.json({ error: ERROR_INVALID_ORDER_ID }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: true },
  })

  if (!order) {
    return NextResponse.json({ error: ERROR_ORDER_NOT_FOUND }, { status: 404 })
  }

  const completedPayment = order.payments.find((payment: Payment) => payment.status === 'completed')
  if (order.status === 'paid' || completedPayment) {
    const existingUrl = getCheckoutUrlFromPayload(completedPayment?.payload as unknown)
    if (existingUrl && completedPayment?.paddleTransactionId) {
      return NextResponse.json({
        checkoutUrl: existingUrl,
        transactionId: completedPayment.paddleTransactionId,
        alreadyPaid: true,
      })
    }
    return NextResponse.json({ error: ERROR_ALREADY_PAID }, { status: 409 })
  }

  const existingPayment = order.payments.find((payment: Payment) =>
    ['created', 'draft'].includes(payment.status),
  )

  if (existingPayment?.paddleTransactionId) {
    const existingUrl = getCheckoutUrlFromPayload(existingPayment.payload as unknown)
    if (existingUrl) {
      return NextResponse.json({
        checkoutUrl: existingUrl,
        transactionId: existingPayment.paddleTransactionId,
      })
    }
  }

  const priceId = getPriceIdByTier(order.tier)
  const baseUrl = process.env.APP_BASE_URL?.trim().replace(/\/$/, '')
  const successUrl = baseUrl ? `${baseUrl}/order/${orderId}/processing` : undefined
  const cancelUrl = baseUrl ? `${baseUrl}/brief/${orderId}` : undefined

  const payload = {
    enable_checkout: true,
    items: [{ price_id: priceId, quantity: 1 }],
    custom_data: { orderId },
    ...(successUrl || cancelUrl
      ? {
          checkout: {
            ...(successUrl ? { success_url: successUrl } : {}),
            ...(cancelUrl ? { cancel_url: cancelUrl } : {}),
          },
        }
      : {}),
  }

  let response: PaddleTransactionResponse

  try {
    response = await paddleRequest<PaddleTransactionResponse>('/transactions', 'POST', payload)
  } catch (error) {
    console.error('Failed to create Paddle transaction', error)
    return NextResponse.json({ error: ERROR_MISSING_CHECKOUT_URL }, { status: 502 })
  }

  const transactionId = response.data?.id
  const checkoutUrl = response.data?.checkout?.url

  if (!transactionId || !checkoutUrl) {
    return NextResponse.json({ error: ERROR_MISSING_CHECKOUT_URL }, { status: 502 })
  }

  await prisma.payment.create({
    data: {
      orderId,
      paddleTransactionId: transactionId,
      status: 'created',
      payload: response as unknown,
    },
  })

  return NextResponse.json({ checkoutUrl, transactionId })
}
