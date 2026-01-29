const PADDLE_API_VERSION = '1'
const PADDLE_BASE_URL_PROD = 'https://api.paddle.com'
const PADDLE_BASE_URL_SANDBOX = 'https://sandbox-api.paddle.com'

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

type RequestBody = Record<string, unknown> | undefined

const getRequiredEnv = (key: string) => {
  const value = process.env[key]?.trim()
  if (!value) {
    throw new Error(`Missing ${key} environment variable`)
  }
  return value
}

export const getPaddleBaseUrl = () => {
  const env = process.env.PADDLE_ENV?.trim().toLowerCase()
  if (env === 'sandbox') {
    return PADDLE_BASE_URL_SANDBOX
  }
  return PADDLE_BASE_URL_PROD
}

export const paddleRequest = async <T>(
  path: string,
  method: HttpMethod,
  body?: RequestBody,
) => {
  const apiKey = getRequiredEnv('PADDLE_API_KEY')
  const apiVersion = process.env.PADDLE_API_VERSION?.trim() || PADDLE_API_VERSION
  const url = `${getPaddleBaseUrl()}${path}`

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Paddle-Version': apiVersion,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  const responseText = await response.text()
  if (!response.ok) {
    throw new Error(`Paddle request failed: ${response.status} ${responseText}`)
  }

  return (responseText ? JSON.parse(responseText) : {}) as T
}

export const getPriceIdByTier = (tier: string) => {
  const normalized = tier.trim().toLowerCase()
  if (normalized === 'base') {
    return getRequiredEnv('PADDLE_PRICE_BASE')
  }
  if (normalized === 'plus') {
    return getRequiredEnv('PADDLE_PRICE_PLUS')
  }
  if (normalized === 'pro') {
    return getRequiredEnv('PADDLE_PRICE_PRO')
  }
  throw new Error(`Unknown tier: ${tier}`)
}
