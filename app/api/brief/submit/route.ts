import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { InvalidCountryError, normalizeCountry } from '@/lib/country/normalizeCountry'
export const runtime = 'nodejs'

const ORDER_STATUS_GENERATED = 'generated'
const ORDER_STATUS_BRIEF_SUBMITTED = 'brief_submitted'
const ERROR_INVALID_ORDER_ID = 'Invalid orderId'
const ERROR_INVALID_COUNTRY = 'Invalid country'
const ERROR_ORDER_NOT_FOUND = 'Order not found'
const ERROR_RESULT_ALREADY_GENERATED = 'Result already generated'

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }
type TransactionClient = any

const isJsonValue = (value: unknown): value is JsonValue => {
  if (value === null) return true
  const valueType = typeof value
  if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
    return true
  }
  if (Array.isArray(value)) {
    return value.every(isJsonValue)
  }
  if (valueType === 'object') {
    return Object.values(value as Record<string, unknown>).every(isJsonValue)
  }
  return false
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as unknown
  if (!isPlainObject(body)) {
    return NextResponse.json({ ok: false, code: 'INVALID_BRIEF' }, { status: 400 })
  }

  const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : ''
  let countryCode: string | undefined

  if (!orderId) {
    return NextResponse.json({ error: ERROR_INVALID_ORDER_ID }, { status: 400 })
  }

  if (typeof body.countryCode === 'string') {
    try {
      const normalized = normalizeCountry(body.countryCode)
      if (normalized) {
        countryCode = normalized
      }
    } catch (error) {
      if (error instanceof InvalidCountryError) {
        return NextResponse.json({ error: ERROR_INVALID_COUNTRY }, { status: 400 })
      }
      throw error
    }
  }

  const briefCandidate = body.brief
  if (!briefCandidate || typeof briefCandidate !== 'object' || !isJsonValue(briefCandidate)) {
    return NextResponse.json({ ok: false, code: 'INVALID_BRIEF' }, { status: 400 })
  }
  const briefPayload = briefCandidate as JsonValue

  const result = await prisma.$transaction(async (tx: TransactionClient) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, customerId: true, status: true },
    })

    if (!order) {
      return { order: null, brief: null, alreadyGenerated: false }
    }

    if (order.status === ORDER_STATUS_GENERATED) {
      return { order, brief: null, alreadyGenerated: true }
    }

    const brief = await tx.brief.upsert({
      where: { orderId },
      create: { orderId, payload: briefPayload },
      update: { payload: briefPayload },
      select: { id: true, orderId: true, createdAt: true },
    })

    if (countryCode && order.customerId) {
      await tx.customer.update({
        where: { id: order.customerId },
        data: { countryCode },
      })
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: ORDER_STATUS_BRIEF_SUBMITTED,
        ...(countryCode ? { countryCode } : {}),
      },
    })

    return { order, brief, alreadyGenerated: false }
  })

  if (!result.order) {
    return NextResponse.json({ error: ERROR_ORDER_NOT_FOUND }, { status: 404 })
  }

  if (result.alreadyGenerated) {
    return NextResponse.json({ ok: false, error: ERROR_RESULT_ALREADY_GENERATED }, { status: 409 })
  }

  return NextResponse.json({ ok: true, brief: result.brief })
}
