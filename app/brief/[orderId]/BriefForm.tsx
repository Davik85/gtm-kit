'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import CountrySelect from '@/components/CountrySelect'
import { buildOrderResultPath, orderAccessTokenStorageKey } from '@/lib/orderLinks'

type BriefFields = {
  product: string
  market: string
  goal: string
  budget: string
}

type BriefFormProps = {
  orderId: string
  initialCountryCode?: string | null
  isGenerated?: boolean
}

const RESULT_ALREADY_GENERATED_MESSAGE = 'Result already generated.'
const SUBMIT_ERROR_MESSAGE = 'Unable to submit brief. Please try again.'
const NETWORK_ERROR_MESSAGE = 'Network error. Please try again.'
const PAYMENT_ERROR_MESSAGE = 'Unable to start checkout. Please try again.'

export default function BriefForm({
  orderId,
  initialCountryCode,
  isGenerated = false,
}: BriefFormProps) {
  const [fields, setFields] = useState<BriefFields>({
    product: '',
    market: '',
    goal: '',
    budget: '',
  })
  const [countryCode, setCountryCode] = useState<string | null>(
    initialCountryCode ?? null,
  )
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSubmittingRef = useRef(false)

  useEffect(() => {
    setAccessToken(sessionStorage.getItem(orderAccessTokenStorageKey(orderId)))
  }, [orderId])

  const handleChange = (key: keyof BriefFields) => (event: ChangeEvent<HTMLInputElement>) => {
    setFields((prev) => ({ ...prev, [key]: event.target.value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isGenerated || isSubmittingRef.current) return
    setError(null)

    if (!event.currentTarget.reportValidity()) {
      return
    }

    isSubmittingRef.current = true
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/brief/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          ...(countryCode ? { countryCode } : {}),
          brief: {
            product: fields.product.trim(),
            market: fields.market.trim(),
            goal: fields.goal.trim(),
            budget: fields.budget.trim(),
          },
        }),
      })

      const data = (await response.json().catch(() => ({}))) as { error?: string }

      if (!response.ok) {
        setError(data.error || SUBMIT_ERROR_MESSAGE)
        return
      }

      const checkoutResponse = await fetch('/api/paddle/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      })

      const checkoutData = (await checkoutResponse.json().catch(() => ({}))) as {
        error?: string
        checkoutUrl?: string
      }

      if (!checkoutResponse.ok || !checkoutData.checkoutUrl) {
        setError(checkoutData.error || PAYMENT_ERROR_MESSAGE)
        return
      }

      window.location.href = checkoutData.checkoutUrl
    } catch (fetchError) {
      console.error(fetchError)
      setError(NETWORK_ERROR_MESSAGE)
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }

  const inputClassName = `rounded border border-gray-300 px-3 py-2 text-base ${
    isGenerated ? 'bg-gray-100 text-gray-500' : ''
  }`

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-16">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-gray-500">Order {orderId}</p>
        <h1 className="text-3xl font-semibold">Brief details</h1>
        <p className="text-base text-gray-600">
          Provide a few details so we can generate a focused go-to-market plan.
        </p>
        {isGenerated ? (
          <div className="space-y-2 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-medium">{RESULT_ALREADY_GENERATED_MESSAGE}</p>
            <p>Brief edits are locked once a result is generated.</p>
            {accessToken ? (
              <p>
                <Link
                  className="underline underline-offset-4"
                  href={buildOrderResultPath(orderId, accessToken)}
                >
                  View result
                </Link>
              </p>
            ) : (
              <p>Check your email for the secure result link.</p>
            )}
          </div>
        ) : null}
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Product
          <input
            className={inputClassName}
            type="text"
            value={fields.product}
            onChange={handleChange('product')}
            placeholder="AI scheduling assistant"
            required
            readOnly={isGenerated}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Target market
          <input
            className={inputClassName}
            type="text"
            value={fields.market}
            onChange={handleChange('market')}
            placeholder="SMB healthcare clinics"
            required
            readOnly={isGenerated}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Primary goal
          <input
            className={inputClassName}
            type="text"
            value={fields.goal}
            onChange={handleChange('goal')}
            placeholder="Drive qualified demo requests"
            required
            readOnly={isGenerated}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Budget
          <input
            className={inputClassName}
            type="text"
            value={fields.budget}
            onChange={handleChange('budget')}
            placeholder="$5k / month"
            required
            readOnly={isGenerated}
          />
        </label>

        <CountrySelect
          value={countryCode}
          onChange={setCountryCode}
          label="Country"
          optional
          disabled={isGenerated}
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting || isGenerated}
          className="rounded bg-black px-4 py-2 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isGenerated ? 'Result generated' : isSubmitting ? 'Submitting...' : 'Generate result'}
        </button>
      </form>
    </div>
  )
}
