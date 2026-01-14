'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { normalizePlanToMarkdown } from '@/lib/formatPlan'

type GenerateResponse = {
  ok?: boolean
  reused?: boolean
  status?: 'pending' | 'generating' | 'ready'
  resultId?: string
  error?: string
}

type ResultResponse = {
  ok?: boolean
  status?: 'pending' | 'generating' | 'ready'
  result?: {
    format?: 'markdown' | 'html'
    content?: string
    updatedAt?: string
  }
  code?: string
  error?: string
}

type ResultClientProps = {
  orderId: string
}

type ResultStatus = 'generating' | 'ready' | 'error'

const COPY_SUCCESS_MESSAGE = 'Copied to clipboard!'
const COPY_ERROR_MESSAGE = 'Copy failed. Please select and copy manually.'
const GENERATION_FAILED_MESSAGE = 'Failed to start generation.'
const NETWORK_ERROR_MESSAGE = 'Network error. Please refresh to try again.'
const RESULT_NOT_AVAILABLE_MESSAGE = 'Result not available yet.'
const ORDER_NOT_FOUND_MESSAGE = 'Order not found.'
const GENERATING_MESSAGE =
  'We are generating your go-to-market plan. This may take a few minutes. Keep this page open — it will update automatically.'
const VIEW_BRIEF_LABEL = 'View brief'

export default function ResultClient({ orderId }: ResultClientProps) {
  const [resultText, setResultText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<ResultStatus>('generating')
  const [copyMessage, setCopyMessage] = useState('')
  const [reused, setReused] = useState<boolean | null>(null)

  // In browser code, prefer ReturnType<typeof setInterval> over NodeJS.Timeout
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const canCopy = useMemo(() => Boolean(resultText), [resultText])

  const normalizedContent = useMemo(() => {
    const raw = resultText ?? ''
    return normalizePlanToMarkdown(raw)
  }, [resultText])

  const isReady = status === 'ready'

  const markdownComponents = useMemo(() => {
    return {
      // Prevent accidental giant H1. Render it like a section heading.
      h1: ({ children }: { children?: React.ReactNode }) => (
        <h2 className="mt-8 mb-3 text-[22px] leading-[1.3] font-semibold text-gray-900">
          {children}
        </h2>
      ),
      h2: ({ children }: { children?: React.ReactNode }) => (
        <h2 className="mt-8 mb-3 text-[22px] leading-[1.3] font-semibold text-gray-900">
          {children}
        </h2>
      ),
      h3: ({ children }: { children?: React.ReactNode }) => (
        <h3 className="mt-6 mb-2 text-[18px] leading-[1.35] font-semibold text-gray-900">
          {children}
        </h3>
      ),
      h4: ({ children }: { children?: React.ReactNode }) => (
        <h4 className="mt-5 mb-2 text-[16px] leading-[1.4] font-semibold text-gray-900">
          {children}
        </h4>
      ),
      p: ({ children }: { children?: React.ReactNode }) => (
        <p className="my-3 text-[16px] leading-[1.7] font-normal text-gray-900">
          {children}
        </p>
      ),
      ul: ({ children }: { children?: React.ReactNode }) => (
        <ul className="my-3 list-disc pl-6 text-[16px] leading-[1.7] font-normal text-gray-900">
          {children}
        </ul>
      ),
      ol: ({ children }: { children?: React.ReactNode }) => (
        <ol className="my-3 list-decimal pl-6 text-[16px] leading-[1.7] font-normal text-gray-900">
          {children}
        </ol>
      ),
      li: ({ children }: { children?: React.ReactNode }) => (
        <li className="my-1 text-[16px] leading-[1.7] font-normal text-gray-900">
          {children}
        </li>
      ),
      strong: ({ children }: { children?: React.ReactNode }) => (
        <strong className="font-semibold text-gray-900">{children}</strong>
      ),
      em: ({ children }: { children?: React.ReactNode }) => (
        <em className="italic text-gray-900">{children}</em>
      ),
      a: ({
        children,
        href,
      }: {
        children?: React.ReactNode
        href?: string
      }) => (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          {children}
        </a>
      ),
      hr: () => <hr className="my-6 border-t border-gray-200" />,
      code: ({
        children,
      }: {
        children?: React.ReactNode
      }) => (
        <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.95em] text-gray-900 break-words [overflow-wrap:anywhere] [word-break:break-word]">
          {children}
        </code>
      ),
      pre: ({ children }: { children?: React.ReactNode }) => (
        <pre className="my-4 overflow-x-auto rounded-lg bg-gray-900 p-4 text-gray-100 whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word]">
          {children}
        </pre>
      ),
      blockquote: ({ children }: { children?: React.ReactNode }) => (
        <blockquote className="my-4 border-l-4 border-gray-200 bg-gray-50 px-4 py-3 text-gray-800">
          {children}
        </blockquote>
      ),
    }
  }, [])

  useEffect(() => {
    let isActive = true

    const clearPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }

    const fetchResult = async () => {
      const resultResponse = await fetch(`/api/results/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      const resultData = (await resultResponse
        .json()
        .catch(() => ({}))) as ResultResponse

      if (!isActive) return false

      if (resultResponse.ok) {
        if (resultData.status === 'ready' && resultData.result?.content) {
          setResultText(resultData.result.content)
          setStatus('ready')
          clearPolling()
          return true
        }

        if (resultData.status === 'pending' || resultData.status === 'generating') {
          setError(null)
          setStatus('generating')
          return false
        }
      }

      if (resultResponse.status === 404) {
        setError(ORDER_NOT_FOUND_MESSAGE)
        setStatus('error')
        clearPolling()
        return true
      }

      if (resultResponse.ok) {
        setStatus('generating')
        return false
      }

      setError(resultData.error || RESULT_NOT_AVAILABLE_MESSAGE)
      setStatus('error')
      clearPolling()
      return true
    }

    const startPolling = () => {
      clearPolling()
      pollingRef.current = setInterval(() => {
        void fetchResult().catch((pollError) => {
          console.error(pollError)
          if (!isActive) return
          setError(NETWORK_ERROR_MESSAGE)
          setStatus('error')
          clearPolling()
        })
      }, 4000)
    }

    const loadResult = () => {
      setStatus('generating')
      setError(null)
      setReused(null)
      setCopyMessage('')

      startPolling()
      void fetchResult()

      void fetch('/api/results/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
        cache: 'no-store',
      })
        .then(async (generateResponse) => {
          const generateData = (await generateResponse
            .json()
            .catch(() => ({}))) as GenerateResponse

          if (!isActive) return

          if (!generateResponse.ok) {
            setError(generateData.error || GENERATION_FAILED_MESSAGE)
            setResultText(null)
            setStatus('error')
            clearPolling()
            return
          }

          if (typeof generateData.reused === 'boolean') {
            setReused(generateData.reused)
          }

          if (generateData.status === 'ready') {
            const isReadyNow = await fetchResult()
            if (isActive && !isReadyNow) {
              setStatus('generating')
              startPolling()
            }
          }
        })
        .catch((fetchError) => {
          console.error(fetchError)
          if (!isActive) return
          setError(NETWORK_ERROR_MESSAGE)
          setStatus('error')
          clearPolling()
        })
    }

    loadResult()

    return () => {
      isActive = false
      clearPolling()
    }
  }, [orderId])

  const handleCopy = async () => {
    if (!normalizedContent) return

    try {
      await navigator.clipboard.writeText(normalizedContent)
      setCopyMessage(COPY_SUCCESS_MESSAGE)
    } catch (copyError) {
      console.error(copyError)
      setCopyMessage(COPY_ERROR_MESSAGE)
    }
  }

  const handleDownload = () => {
    if (!isReady) return
    const encodedOrderId = encodeURIComponent(orderId)
    window.location.href = `/api/orders/${encodedOrderId}/download`
  }

  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-8 px-6 py-16">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-gray-500">Order {orderId}</p>
        <h1 className="text-3xl font-semibold">Your go-to-market plan</h1>
        <p className="text-base text-gray-600">
          Review the generated strategy and share it with your team.
        </p>
        {reused !== null ? (
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Reused: {reused ? 'true' : 'false'}
          </p>
        ) : null}
      </header>

      {status === 'generating' ? (
        <div className="flex items-start gap-3 rounded border border-blue-100 bg-blue-50 p-4 text-blue-900">
          <span className="mt-1 h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-sm">{GENERATING_MESSAGE}</p>
        </div>
      ) : status === 'error' ? (
        <div className="space-y-2 rounded border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-medium">We hit a snag</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <div className="space-y-8">
          <article className="mx-auto w-full max-w-[920px] break-words [overflow-wrap:anywhere] [word-break:break-word]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {normalizedContent}
            </ReactMarkdown>
          </article>

          <div className="flex flex-col items-start gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!isReady}
                className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Download Word (.docx)
              </button>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!canCopy}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Copy to clipboard
            </button>
            <Link
              className="text-sm font-medium text-gray-700 underline underline-offset-4"
              href={`/brief/${orderId}`}
            >
              {VIEW_BRIEF_LABEL}
            </Link>
            {copyMessage ? <p className="text-sm text-gray-500">{copyMessage}</p> : null}
          </div>
        </div>
      )}
    </div>
  )
}
