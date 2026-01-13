'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { COUNTRIES } from '@/lib/country/countries'
import {
  COUNTRY_ALIASES,
  InvalidCountryError,
  normalizeCountry,
} from '@/lib/country/normalizeCountry'

type CountrySelectProps = {
  value: string | null
  onChange: (codeOrNull: string | null) => void
  label?: string
  optional?: boolean
  disabled?: boolean
}

const COUNTRY_PLACEHOLDER = 'Germany (DE) or DE'
const COUNTRY_HELPER_TEXT = 'Use country name or ISO 2-letter code (DE, FR, IT…).'
const COUNTRY_INVALID_MESSAGE =
  'Enter a valid country name or 2-letter ISO code (e.g., Germany or DE).'
const COUNTRY_INPUT_NAME = 'countryCode'
const DEFAULT_LABEL = 'Country'

const formatCountryLabel = (code: string) => {
  const match = COUNTRIES.find((country) => country.code === code)
  return match ? `${match.name} (${match.code})` : code
}

const canMatchCountry = (value: string) => {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return false

  return (
    COUNTRIES.some((country) => {
      const name = country.name.toLowerCase()
      const code = country.code.toLowerCase()
      return (
        name.startsWith(normalized) ||
        code.startsWith(normalized) ||
        `${name} (${code})`.startsWith(normalized)
      )
    }) ||
    Object.keys(COUNTRY_ALIASES).some((alias) => alias.startsWith(normalized))
  )
}

const tryNormalizeCountry = (value: string) => {
  try {
    return normalizeCountry(value)
  } catch (error) {
    if (error instanceof InvalidCountryError) {
      return null
    }
    throw error
  }
}

export default function CountrySelect({
  value,
  onChange,
  label = DEFAULT_LABEL,
  optional = false,
  disabled = false,
}: CountrySelectProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isFocused) return
    setInputValue(value ? formatCountryLabel(value) : '')
    setError(null)
  }, [isFocused, value])

  const filteredCountries = useMemo(() => {
    const query = inputValue.trim().toLowerCase()
    if (!query) return COUNTRIES
    return COUNTRIES.filter((country) => {
      const name = country.name.toLowerCase()
      const code = country.code.toLowerCase()
      return name.includes(query) || code.includes(query)
    })
  }, [inputValue])

  const setValidityMessage = (message: string) => {
    if (inputRef.current) {
      inputRef.current.setCustomValidity(message)
    }
  }

  const handleChange = (nextValue: string) => {
    if (disabled) return
    setInputValue(nextValue)

    const trimmed = nextValue.trim()
    if (!trimmed) {
      setError(null)
      setValidityMessage('')
      onChange(null)
      return
    }

    const normalized = tryNormalizeCountry(trimmed)
    if (normalized) {
      setError(null)
      setValidityMessage('')
      onChange(normalized)
      return
    }

    onChange(null)

    if (canMatchCountry(trimmed)) {
      setError(null)
      setValidityMessage('')
      return
    }

    setError(COUNTRY_INVALID_MESSAGE)
    setValidityMessage(COUNTRY_INVALID_MESSAGE)
  }

  const handleBlur = () => {
    if (disabled) return
    setIsFocused(false)
    const trimmed = inputValue.trim()

    if (!trimmed) {
      setError(null)
      setValidityMessage('')
      onChange(null)
      return
    }

    const normalized = tryNormalizeCountry(trimmed)
    if (normalized) {
      setError(null)
      setValidityMessage('')
      onChange(normalized)
      setInputValue(formatCountryLabel(normalized))
      return
    }

    setError(COUNTRY_INVALID_MESSAGE)
    setValidityMessage(COUNTRY_INVALID_MESSAGE)
  }

  const inputClassName = `rounded border border-gray-300 px-3 py-2 text-base ${
    disabled ? 'bg-gray-100 text-gray-500' : ''
  }`

  return (
    <label className="flex flex-col gap-2 text-sm font-medium">
      <span>
        {label}
        {optional ? <span className="text-gray-400"> (optional)</span> : null}
      </span>
      <input
        ref={inputRef}
        className={inputClassName}
        type="text"
        value={inputValue}
        onChange={(event) => handleChange(event.target.value)}
        onFocus={() => {
          if (disabled) return
          setIsFocused(true)
        }}
        onBlur={handleBlur}
        placeholder={COUNTRY_PLACEHOLDER}
        name={COUNTRY_INPUT_NAME}
        list={listId}
        aria-invalid={error ? true : undefined}
        disabled={disabled}
      />
      <span className="text-xs font-normal text-gray-500">{COUNTRY_HELPER_TEXT}</span>
      {error ? <span className="text-xs font-normal text-red-600">{error}</span> : null}
      <datalist id={listId}>
        {filteredCountries.map((country) => (
          <option
            key={country.code}
            value={`${country.name} (${country.code})`}
          />
        ))}
      </datalist>
    </label>
  )
}
