import 'server-only'

import OpenAI from 'openai'

const buildHeaders = () => {
  const headers: Record<string, string> = {}

  if (process.env.OPENAI_ORG) {
    headers['OpenAI-Organization'] = process.env.OPENAI_ORG
  }

  if (process.env.OPENAI_PROJECT) {
    headers['OpenAI-Project'] = process.env.OPENAI_PROJECT
  }

  return headers
}

let openaiClient: OpenAI | null = null

const getOpenAIClient = () => {
  if (openaiClient) {
    return openaiClient
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  openaiClient = new OpenAI({
    apiKey,
    fetch: async (url, init) => {
      const headers = new Headers(init?.headers)

      for (const [key, value] of Object.entries(buildHeaders())) {
        headers.set(key, value)
      }

      return fetch(url, { ...init, headers })
    },
  })

  return openaiClient
}

export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenAIClient() as OpenAI)[prop as keyof OpenAI]
  },
}) as OpenAI
