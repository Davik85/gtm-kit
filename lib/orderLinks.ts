export const orderAccessTokenStorageKey = (orderId: string) => {
  return `order-access-token:${orderId}`
}

export const buildOrderResultPath = (orderId: string, accessToken: string) => {
  const encodedOrderId = encodeURIComponent(orderId)
  const encodedToken = encodeURIComponent(accessToken)
  return `/order/${encodedOrderId}/result?token=${encodedToken}`
}
