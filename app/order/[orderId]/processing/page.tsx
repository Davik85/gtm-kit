type ProcessingPageProps = {
  params: Promise<{ orderId: string }>
}

export default async function ProcessingPage({ params }: ProcessingPageProps) {
  const { orderId } = await params
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6 py-16 text-center">
      <p className="text-sm uppercase tracking-wide text-gray-500">Order {orderId}</p>
      <h1 className="text-3xl font-semibold">Payment received</h1>
      <p className="text-base text-gray-600">
        We are generating your GTM plan. You will get an email when it’s ready.
      </p>
    </div>
  )
}
