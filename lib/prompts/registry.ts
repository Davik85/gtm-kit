import 'server-only'

import { readFileSync } from 'fs'
import path from 'path'

export type PromptKey = 'gtm_eu_core'

export const PROMPTS = {
  gtm_eu_core: {
    version: 1,
    file: 'gtm-eu-core.v1.txt',
    name: 'EU GTM Core',
  },
} as const

export const getPromptTemplate = (key: PromptKey) => {
  const prompt = PROMPTS[key]
  const templatePath = path.join(process.cwd(), 'lib', 'prompts', prompt.file)
  const templateText = readFileSync(templatePath, 'utf8')

  return {
    key,
    version: prompt.version,
    name: prompt.name,
    templateText,
  }
}
