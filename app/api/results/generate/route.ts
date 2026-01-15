import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { normalizePlanToMarkdown } from '@/lib/formatPlan'
import { openai } from '@/lib/openaiClient'
import { buildOrderResultUrl } from '@/lib/orderLinks.server'
import { PROMPTS, type PromptKey, getPromptTemplate } from '@/lib/prompts/registry'

export const runtime = 'nodejs'

type GenerateResultPayload = {
  orderId?: string
  accessToken?: string
}

type TransactionClient = any

type ErrorDetails = {
  name?: string
  message?: string
  status?: number
  code?: string
  type?: string
}

const MAX_OUTPUT_TOKENS = 8000
const MAX_CONTINUATIONS = 4
const CONTINUATION_TAIL_CHARS = 1000
const ORDER_STATUS_GENERATING = 'generating'
const ORDER_STATUS_BRIEF_SUBMITTED = 'brief_submitted'
const ORDER_STATUS_GENERATED = 'generated'
const ORDER_STATUS_ERROR = 'error'
const ERROR_INVALID_ORDER_ID = 'Invalid orderId'
const ERROR_ORDER_NOT_FOUND = 'Order not found'
const ERROR_BRIEF_NOT_SUBMITTED = 'Brief not submitted'
const ERROR_OPENAI_MISSING = 'OPENAI_API_KEY is not set'
const ERROR_GENERATION_FAILED = 'OpenAI generation failed'
const ERROR_REQUEST_FAILED = 'Request failed'
const ERROR_UNKNOWN_PROMPT_KEY = 'Unknown prompt key'
const DEFAULT_MODEL = 'gpt-4o'
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' }
const GENERATE_LOG_PREFIX = '[generate]'

const jsonResponse = <T>(data: T, init?: ResponseInit) => {
  return NextResponse.json(data, {
    ...init,
    headers: { ...init?.headers, ...NO_STORE_HEADERS },
  })
}

const logGenerateStatus = ({
  orderId,
  status,
  resultId,
}: {
  orderId: string
  status: string
  resultId?: string | null
}) => {
  const suffix = resultId ? ` resultId=${resultId}` : ''
  console.info(`${GENERATE_LOG_PREFIX} orderId=${orderId} status=${status}${suffix}`)
}

const getFinishReason = (response: unknown) => {
  const result = response as
    | {
        finish_reason?: string
        finishReason?: string
        output?: Array<{
          finish_reason?: string
          finishReason?: string
          content?: Array<{ finish_reason?: string; finishReason?: string }>
        }>
      }
    | undefined

  const directReason = result?.finish_reason ?? result?.finishReason
  if (directReason) {
    return directReason
  }

  if (Array.isArray(result?.output)) {
    for (const output of result.output) {
      const outputReason = output.finish_reason ?? output.finishReason
      if (outputReason) {
        return outputReason
      }
      if (Array.isArray(output.content)) {
        for (const content of output.content) {
          const contentReason = content.finish_reason ?? content.finishReason
          if (contentReason) {
            return contentReason
          }
        }
      }
    }
  }

  return null
}

const isTruncated = (finishReason: string | null) => {
  return finishReason === 'length' || finishReason === 'max_output_tokens'
}

const buildContinuationInput = (assembledText: string) => {
  const tail = assembledText.slice(-CONTINUATION_TAIL_CHARS)
  return ['Previous text tail:', tail].join('\n')
}

const getOrderId = (payload: GenerateResultPayload) => {
  return typeof payload.orderId === 'string' ? payload.orderId.trim() : ''
}

const getAccessToken = (payload: GenerateResultPayload) => {
  return typeof payload.accessToken === 'string' ? payload.accessToken.trim() : ''
}

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message.slice(0, 300)
  }
  return 'Unknown error'
}

const toErrorDetails = (error: unknown): ErrorDetails => {
  const err = error as
    | (Error & { status?: number; response?: { status?: number }; code?: string; type?: string })
    | undefined

  return {
    name: err?.name,
    message: err?.message,
    status: err?.status ?? err?.response?.status,
    code: err?.code,
    type: err?.type,
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const isPromptKey = (value: string): value is PromptKey => {
  return Object.prototype.hasOwnProperty.call(PROMPTS, value)
}

const getBriefField = (brief: unknown, field: string) => {
  if (!isRecord(brief)) {
    return null
  }

  const value = brief[field]
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

const buildPromptInput = ({
  orderId,
  countryCode,
  brief,
}: {
  orderId: string
  countryCode: string | null
  brief: unknown
}) => {
  const countryLabel = countryCode ?? 'Unknown'
  const briefPayload = typeof brief === 'string' ? brief : JSON.stringify(brief, null, 2)
  const goal = getBriefField(brief, 'goal')
  const budget = getBriefField(brief, 'budget')
  const sections = [`Order ID: ${orderId}`, `Country code: ${countryLabel}`]

  if (goal) {
    sections.push(`Goal: ${goal}`)
  }

  if (budget) {
    sections.push(`Budget: ${budget}`)
  }

  sections.push('Brief fields:', briefPayload)

  return sections.join('\n\n')
}

const buildPromptSnapshot = (templateText: string, input: string) => {
  return ['Instructions:', templateText.trim(), 'Input:', input.trim()].join('\n\n')
}

const markOrderError = async (orderId: string, errorMessage?: string) => {
  await prisma.order
    .update({
      where: { id: orderId },
      data: { status: ORDER_STATUS_ERROR },
    })
    .catch(() => null)

  if (errorMessage) {
    await prisma.result
      .update({
        where: { orderId },
        data: { errorMessage },
      })
      .catch(() => null)
  }
}

const fetchExistingResultInfo = async (orderId: string) => {
  const result = await prisma.result.findUnique({
    where: { orderId },
    select: { id: true, resultText: true },
  })

  return result ?? null
}

export async function POST(request: Request) {
  let orderId = ''

  try {
    const body = (await request.json().catch(() => ({}))) as GenerateResultPayload
    orderId = getOrderId(body)
    const accessToken = getAccessToken(body)

    if (!orderId) {
      logGenerateStatus({ orderId: 'unknown', status: 'invalid' })
      return jsonResponse({ error: ERROR_INVALID_ORDER_ID }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        accessToken: true,
        promptKey: true,
        promptVersion: true,
        countryCode: true,
        customer: { select: { countryCode: true } },
        brief: { select: { payload: true } },
        result: {
          select: {
            id: true,
            resultText: true,
            modelUsed: true,
            provider: true,
            providerResponseId: true,
            errorMessage: true,
          },
        },
      },
    })

    if (!order) {
      logGenerateStatus({ orderId, status: 'not_found' })
      return jsonResponse({ error: ERROR_ORDER_NOT_FOUND }, { status: 404 })
    }

    if (!accessToken || order.accessToken !== accessToken) {
      logGenerateStatus({ orderId, status: 'access_denied' })
      return jsonResponse({ error: 'Access denied' }, { status: 404 })
    }

    const resultLink = buildOrderResultUrl(orderId, accessToken)

    if (order.status === ORDER_STATUS_GENERATED || order.result?.resultText) {
      const existingResult = order.result ?? (await fetchExistingResultInfo(orderId))

      if (existingResult?.id) {
        logGenerateStatus({
          orderId,
          status: 'ready',
          resultId: existingResult.id,
        })
        return jsonResponse({
          ok: true,
          orderId,
          status: 'ready',
          code: 'already_generated',
          resultId: existingResult.id,
          resultLink,
        })
      }
    }

    if (!order.brief) {
      logGenerateStatus({ orderId, status: 'pending' })
      return jsonResponse(
        { ok: true, orderId, status: 'pending', code: 'brief_missing' },
        { status: 202 },
      )
    }

    if (order.status === ORDER_STATUS_ERROR) {
      logGenerateStatus({ orderId, status: 'error' })
      return jsonResponse({ ok: false, error: 'Order failed to generate' }, { status: 500 })
    }

    if (order.status === ORDER_STATUS_GENERATING) {
      logGenerateStatus({ orderId, status: 'generating' })
      return jsonResponse(
        { ok: true, orderId, status: 'generating', code: 'already_generating' },
        { status: 202 },
      )
    }

    if (order.status !== ORDER_STATUS_BRIEF_SUBMITTED) {
      logGenerateStatus({ orderId, status: 'pending' })
      return jsonResponse(
        { ok: true, orderId, status: 'pending', code: 'awaiting_requirements' },
        { status: 202 },
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      await markOrderError(orderId, ERROR_OPENAI_MISSING)
      logGenerateStatus({ orderId, status: 'error' })
      return jsonResponse({ ok: false, error: ERROR_OPENAI_MISSING }, { status: 500 })
    }

    const locked = await prisma.order.updateMany({
      where: { id: orderId, status: ORDER_STATUS_BRIEF_SUBMITTED },
      data: { status: ORDER_STATUS_GENERATING },
    })

    if (locked.count === 0) {
      const currentOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true, result: { select: { id: true, resultText: true } } },
      })

      const existingResult =
        currentOrder?.result ?? (await fetchExistingResultInfo(orderId))

      if (existingResult?.id) {
        logGenerateStatus({
          orderId,
          status: 'ready',
          resultId: existingResult.id,
        })
        return jsonResponse({
          ok: true,
          orderId,
          status: 'ready',
          code: 'already_generated',
          resultId: existingResult.id,
          resultLink,
        })
      }

      if (currentOrder?.status === ORDER_STATUS_GENERATING) {
        logGenerateStatus({ orderId, status: 'generating' })
        return jsonResponse(
          { ok: true, orderId, status: 'generating', code: 'already_generating' },
          { status: 202 },
        )
      }

      logGenerateStatus({ orderId, status: 'pending' })
      return jsonResponse(
        { ok: true, orderId, status: 'pending', code: 'awaiting_requirements' },
        { status: 202 },
      )
    }

    const countryCode = order.countryCode ?? order.customer?.countryCode ?? null
    const promptKey = order.promptKey?.trim()

    if (!promptKey || !isPromptKey(promptKey)) {
      const errorMessage = `${ERROR_UNKNOWN_PROMPT_KEY}: ${promptKey || 'missing'}`
      await markOrderError(orderId, errorMessage)
      logGenerateStatus({ orderId, status: 'error' })
      return jsonResponse({ ok: false, error: errorMessage }, { status: 500 })
    }

    const template = getPromptTemplate(promptKey)
    const input = buildPromptInput({
      orderId,
      countryCode,
      brief: order.brief.payload,
    })
    const promptSnapshot = buildPromptSnapshot(template.templateText, input)

    const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL
    const chunks: string[] = []
    let response
    let finishReason: string | null = null
    let attempts = 0

    try {
      response = await openai.responses.create({
        model,
        instructions: template.templateText,
        input,
        max_output_tokens: MAX_OUTPUT_TOKENS,
        store: false,
        metadata: {
          orderId,
          countryCode: countryCode ?? 'unknown',
          promptKey: template.key,
          promptVersion: template.version.toString(),
        },
      })
    } catch (error) {
      console.error(error)
      const errorMessage = toErrorMessage(error)
      await markOrderError(orderId, errorMessage)
      logGenerateStatus({ orderId, status: 'error' })

      return jsonResponse(
        {
          ok: false,
          error: ERROR_GENERATION_FAILED,
          details: toErrorDetails(error),
        },
        { status: 500 }
      )
    }

    while (response) {
      const chunkText = response.output_text?.trim()
      finishReason = getFinishReason(response)

      if (!chunkText) {
      const error = new Error('OpenAI response returned empty output')
      console.error(error)
      const errorMessage = toErrorMessage(error)
      await markOrderError(orderId, errorMessage)
      logGenerateStatus({ orderId, status: 'error' })

      return jsonResponse(
        {
          ok: false,
            error: ERROR_GENERATION_FAILED,
            details: toErrorDetails(error),
          },
          { status: 500 }
        )
      }

      chunks.push(chunkText)

      if (!isTruncated(finishReason) || attempts >= MAX_CONTINUATIONS) {
        break
      }

      attempts += 1
      const assembledText = chunks.join('\n')
      const continuationInput = buildContinuationInput(assembledText)

      response = await openai.responses.create({
        model,
        instructions:
          'Continue from the exact point you stopped. Do not repeat. Output only the continuation text.',
        input: continuationInput,
        max_output_tokens: MAX_OUTPUT_TOKENS,
        store: false,
        metadata: {
          orderId,
          countryCode: countryCode ?? 'unknown',
          continuation: attempts.toString(),
        },
      })
    }

    const resultText = normalizePlanToMarkdown(chunks.join('\n'))

    let createdResultId: string | null = null

    try {
      createdResultId = await prisma.$transaction(async (tx: TransactionClient) => {
        const createdResult = await tx.result.create({
          data: {
            orderId,
            resultText,
            promptKey: template.key,
            promptVersion: template.version,
            promptSnapshot,
            modelUsed: model,
            provider: 'openai',
            providerResponseId: response?.id ?? null,
            errorMessage: null,
          },
          select: { id: true },
        })

        await tx.order.update({
          where: { id: orderId },
          data: { status: ORDER_STATUS_GENERATED },
        })

        return createdResult.id
      })
    } catch (error) {
      const err = error as { code?: string }
      if (err.code === 'P2002') {
        const existingResult = await fetchExistingResultInfo(orderId)

        if (existingResult?.id) {
          logGenerateStatus({
            orderId,
            status: 'ready',
            resultId: existingResult.id,
          })
          return jsonResponse({
            ok: true,
            orderId,
            status: 'ready',
            code: 'already_generated',
            resultId: existingResult.id,
          })
        }
      }

      throw error
    }

    logGenerateStatus({ orderId, status: 'ready', resultId: createdResultId })
      return jsonResponse({
        ok: true,
        orderId,
        status: 'ready',
        resultId: createdResultId,
        reused: false,
        resultLink,
        resultText,
        chunksCount: chunks.length,
        totalChars: resultText.length,
        finalFinishReason: finishReason ?? 'unknown',
    })
  } catch (error) {
    const errorMessage = toErrorMessage(error)
    console.error('Failed to generate result', { error: errorMessage })

    if (orderId) {
      await markOrderError(orderId, errorMessage)
    }
    logGenerateStatus({ orderId: orderId || 'unknown', status: 'error' })

    return jsonResponse(
      {
        ok: false,
        error: ERROR_REQUEST_FAILED,
        details: toErrorDetails(error),
      },
      { status: 500 }
    )
  }
}
