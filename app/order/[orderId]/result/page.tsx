import ResultAccessPage from '@/app/result/[orderId]/ResultAccessPage'

type PageProps = {
  params: Promise<{ orderId: string }>
  searchParams: Promise<{ token?: string }>
}

export const dynamic = 'force-dynamic'

export default async function OrderResultPage({ params, searchParams }: PageProps) {
  const { orderId } = await params
  const { token } = await searchParams

  return <ResultAccessPage orderId={orderId} token={token} />
}
