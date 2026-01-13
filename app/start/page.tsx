'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import CountrySelect from '@/components/CountrySelect'

const isValidEmail = (value: string) => value.includes('@')

export default function StartPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [countryCode, setCountryCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const trimmedEmail = email.trim()

    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    if (!event.currentTarget.reportValidity()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: trimmedEmail,
          ...(countryCode ? { countryCode } : {}),
        }),
      })

      const data = (await response.json().catch(() => ({}))) as {
        orderId?: string
        error?: string
      }

      if (!response.ok || !data.orderId) {
        setError(data.error || 'Unable to create order. Please try again.')
        return
      }

      router.push(`/brief/${data.orderId}`)
    } catch (fetchError) {
      console.error(fetchError)
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col gap-8 px-6 py-16">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-gray-500">GTM Kit</p>
        <h1 className="text-3xl font-semibold">Start your GTM brief</h1>
        <p className="text-base text-gray-600">
          Share your email and market to begin. We&apos;ll use this to personalize the brief.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Email
          <input
            className="rounded border border-gray-300 px-3 py-2 text-base"
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            required
          />
        </label>

        <CountrySelect
          value={countryCode}
          onChange={setCountryCode}
          label="Country"
          optional
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-black px-4 py-2 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Creating order...' : 'Continue'}
        </button>
      </form>
    </div>
  )
}
