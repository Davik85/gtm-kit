import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import ResultClient from './ResultClient'

type ResultAccessPageProps = {
  orderId: string
  token?: string | null
}

export default async function ResultAccessPage({
  orderId,
  token,
}: ResultAccessPageProps) {
  const accessToken = token?.trim()

  if (!accessToken) {
    return notFound()
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { accessToken: true },
  })

  if (!order || order.accessToken !== accessToken) {
    return notFound()
  }

  return <ResultClient orderId={orderId} accessToken={accessToken} />
}
