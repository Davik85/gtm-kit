import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { sendResultEmail } from '@/lib/email'

export const runtime = 'nodejs'

const RESEND_WINDOW_MS = 5 * 60 * 1000

type RouteContext = {
  params: Promise<{ orderId?: string }>
}

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message.slice(0, 300)
  }
  return 'Unknown error'
}

export async function POST(_request: Request, ctx: RouteContext) {
  const { orderId: rawOrderId } = await ctx.params
  const orderId = (rawOrderId ?? '').trim()

  if (!orderId) {
    return NextResponse.json({ error: 'Invalid orderId' }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      accessToken: true,
      customer: { select: { email: true } },
      result: { select: { emailSentAt: true } },
    },
  })

  if (!order || !order.customer?.email || !order.result) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const lastSentAt = order.result.emailSentAt
  const shouldSend =
    !lastSentAt || Date.now() - lastSentAt.getTime() > RESEND_WINDOW_MS

  if (!shouldSend) {
    return NextResponse.json(
      { error: 'Email recently sent' },
      { status: 429 },
    )
  }

  try {
    await sendResultEmail({
      to: order.customer.email,
      orderId,
      accessToken: order.accessToken,
      replyTo: process.env.EMAIL_REPLY_TO,
    })

    await prisma.result.update({
      where: { orderId },
      data: { emailSentAt: new Date() },
    })
  } catch (error) {
    const errorMessage = toErrorMessage(error)
    console.error('Failed to resend result email', { orderId, error: errorMessage })
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
