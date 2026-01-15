import 'server-only'
import { buildOrderResultPath } from '@/lib/orderLinks'

export const buildOrderResultUrl = (orderId: string, accessToken: string) => {
  const baseUrl = process.env.APP_BASE_URL?.trim().replace(/\/$/, '')
  const path = buildOrderResultPath(orderId, accessToken)
  return baseUrl ? `${baseUrl}${path}` : path
}
