import ResultClient from './ResultClient'

type PageProps = {
  params: Promise<{ orderId: string }>
}

export const dynamic = 'force-dynamic'

export default async function ResultPage({ params }: PageProps) {
  const { orderId } = await params

  return <ResultClient orderId={orderId} />
}
