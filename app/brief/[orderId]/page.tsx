import { prisma } from '@/lib/db/prisma'
import BriefForm from './BriefForm'

type PageProps = {
  params: Promise<{ orderId: string }>
}

export default async function BriefPage({ params }: PageProps) {
  const { orderId } = await params
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      countryCode: true,
      status: true,
      customer: { select: { countryCode: true } },
    },
  })

  const initialCountryCode = order?.countryCode ?? order?.customer?.countryCode ?? null
  const isGenerated = order?.status === 'generated'

  return (
    <BriefForm
      orderId={orderId}
      initialCountryCode={initialCountryCode}
      isGenerated={isGenerated}
    />
  )
}
