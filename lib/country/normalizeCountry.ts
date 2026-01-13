import { COUNTRIES } from './countries'

export class InvalidCountryError extends Error {
  constructor(message = 'Invalid country') {
    super(message)
    this.name = 'InvalidCountryError'
  }
}

export const COUNTRY_ALIASES: Record<string, string> = {
  uk: 'GB',
  'united kingdom': 'GB',
  'great britain': 'GB',
  britain: 'GB',
  'czech republic': 'CZ',
}

const COUNTRY_CODE_SET = new Set(COUNTRIES.map((country) => country.code))

const normalizeValue = (value: string) => value.trim().toLowerCase()

const normalizeCode = (value: string) => value.trim().toUpperCase()

const parseCountryWithCodeSuffix = (value: string) => {
  const match = value.match(/\(([^)]+)\)\s*$/)
  if (!match) return null
  const codeCandidate = match[1]?.trim() ?? ''
  const nameCandidate = value.replace(/\s*\([^)]+\)\s*$/, '').trim()
  return { codeCandidate, nameCandidate }
}

export function normalizeCountry(input: string | null | undefined): string | null {
  if (input == null) return null

  const trimmed = input.trim()

  if (!trimmed) return null

  const withSuffix = parseCountryWithCodeSuffix(trimmed)
  if (withSuffix?.codeCandidate) {
    const suffixCode = normalizeCode(withSuffix.codeCandidate)
    if (/^[A-Z]{2}$/.test(suffixCode) && COUNTRY_CODE_SET.has(suffixCode)) {
      return suffixCode
    }
  }

  const upper = normalizeCode(trimmed)
  if (/^[A-Z]{2}$/.test(upper)) {
    const alias = COUNTRY_ALIASES[upper.toLowerCase()]
    const resolved = alias ?? upper
    if (COUNTRY_CODE_SET.has(resolved)) {
      return resolved
    }
    throw new InvalidCountryError()
  }

  const normalizedName = normalizeValue(trimmed)
  const alias = COUNTRY_ALIASES[normalizedName]
  if (alias) {
    return alias
  }

  if (withSuffix?.nameCandidate) {
    const normalizedCandidate = normalizeValue(withSuffix.nameCandidate)
    const candidateAlias = COUNTRY_ALIASES[normalizedCandidate]
    if (candidateAlias) {
      return candidateAlias
    }
  }

  const match = COUNTRIES.find(
    (country) => country.name.toLowerCase() === normalizedName,
  )

  if (match) {
    return match.code
  }

  throw new InvalidCountryError()
}
