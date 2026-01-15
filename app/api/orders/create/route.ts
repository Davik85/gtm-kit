import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { prisma } from '@/lib/db/prisma'
import { InvalidCountryError, normalizeCountry } from '@/lib/country/normalizeCountry'

export const runtime = 'nodejs'

type CreateOrderPayload = {
  email?: string
  countryCode?: string
  tier?: string
}

const allowedTiers = new Set(['base', 'plus', 'pro'] as const)
type OrderTier = 'base' | 'plus' | 'pro'

const normalizeEmail = (value: string) => value.trim().toLowerCase()
const createAccessToken = () => crypto.randomBytes(32).toString('hex')
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CreateOrderPayload
  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : ''
  let countryCode: string | undefined
  let tier: OrderTier = 'base'

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  if (typeof body.tier === 'string') {
    if (allowedTiers.has(body.tier as OrderTier)) {
      tier = body.tier as OrderTier
    } else {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }
  }

  if (typeof body.countryCode === 'string') {
    try {
      const normalized = normalizeCountry(body.countryCode)
      if (normalized) {
        countryCode = normalized
      }
    } catch (error) {
      if (error instanceof InvalidCountryError) {
        return NextResponse.json(
          { ok: false, error: 'Invalid country' },
          { status: 400 },
        )
      }
      throw error
    }
  }

  const customer = await prisma.customer.upsert({
    where: { email },
    update: countryCode ? { countryCode } : {},
    create: {
      email,
      ...(countryCode ? { countryCode } : {}),
    },
  })

  const order = await prisma.order.create({
    data: {
      status: 'created',
      tier,
      accessToken: createAccessToken(),
      promptKey: 'gtm_eu_core',
      promptVersion: 1,
      customerId: customer.id,
      ...(countryCode ? { countryCode } : {}),
    },
  })

  return NextResponse.json({
    orderId: order.id,
    status: order.status,
    accessToken: order.accessToken,
  })
}
