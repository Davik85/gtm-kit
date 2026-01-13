const NUMBERED_HEADING_PATTERN = /^\s*\d+\)\s+(.+)\s*$/
const MARKDOWN_HEADING_PATTERN = /^\s*(#{1,6})\s+(.+)\s*$/
const HORIZONTAL_RULE_PATTERN = /^---\s*$/

// Bullets / ordered items
const BULLET_PREFIX_PATTERN = /^\s*(?:[-*•\u2013\u2014]|\d+[.)])\s+/

// Inline labels we want as normal text, not headings
const INLINE_LABELS: Record<string, string> = {
  who: 'Who',
  jtbd: 'JTBD',
  triggers: 'Triggers',
  barriers: 'Barriers',
  'decision criteria': 'Decision criteria',
  alternatives: 'Alternatives',
  'where to reach': 'Where to reach',
  'value/ability to pay signals': 'Value/ability to pay signals',
}

const INLINE_LABEL_KEYS = Object.keys(INLINE_LABELS).sort(
  (a, b) => b.length - a.length,
)

const escapeRegExp = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const LABEL_LINE_PATTERN = new RegExp(
  `^\\s*(?:#{1,6}\\s+)?(${INLINE_LABEL_KEYS.map(escapeRegExp).join('|')}):\\s*(.*)$`,
  'i',
)

/**
 * Case: model writes "... sentence. Top starter channels:" on the SAME line.
 * We want:
 * 1) keep the sentence as-is on the current line
 * 2) move "Top starter channels:" to a NEW line (so it can become a mini-heading + list opener)
 *
 * We only split when the heading is at the END of the line and has a trailing ":".
 */
const INLINE_STAGE_HEADING_AT_END_PATTERN =
  /^(.*?)([.!?])(["”’']?)\s+([A-Z][^:\n]{2,80}):\s*$/ // keep conservative to avoid false positives

const normalizeBulletMarker = (line: string) => {
  // Normalize bullets to "- "
  let out = line.replace(/^\s*(?:[*•\u2013\u2014])\s+/, '- ')
  // Fix "- - Something" -> "- Something"
  out = out.replace(/^\s*-\s*-\s+/, '- ')
  return out
}

const stripBulletPrefix = (line: string) => {
  const trimmed = line.trim()
  if (trimmed.startsWith('- ')) return trimmed.slice(2).trim()
  if (trimmed.startsWith('* ')) return trimmed.slice(2).trim()
  if (trimmed.startsWith('• ')) return trimmed.slice(2).trim()
  return trimmed
}

const stripHeadingHashes = (line: string) => {
  const m = line.match(MARKDOWN_HEADING_PATTERN)
  if (!m) return line.trim()
  return (m[2] ?? '').trim()
}

const toInlineLabel = (text: string) => {
  const match = text.trim().match(LABEL_LINE_PATTERN)
  if (!match) return null

  const rawLabel = (match[1] ?? '').trim()
  const rest = (match[2] ?? '').trim()
  const canonical = INLINE_LABELS[rawLabel.toLowerCase()] ?? rawLabel

  if (!rest) return `**${canonical}**:`
  return `**${canonical}:** ${rest}`
}

const clampMarkdownHeading = (line: string) => {
  const m = line.match(MARKDOWN_HEADING_PATTERN)
  if (!m) return line

  const level = (m[1] ?? '').length
  const text = (m[2] ?? '').trim()
  if (!text) return ''

  // If this is actually "Who: ..." etc — convert to inline label paragraph
  const inline = toInlineLabel(text)
  if (inline) return inline

  // Clamp heading levels so there is never huge H1
  if (level <= 1) return `## ${text}`
  if (level === 2) return `## ${text}`
  return `### ${text}`
}

const normalizeNumberedHeading = (line: string) => {
  const m = line.match(NUMBERED_HEADING_PATTERN)
  if (!m) return line
  const text = (m[1] ?? '').trim()
  return text ? `## ${text}` : line.trim()
}

/**
 * Split inline labels that got glued inside one paragraph.
 * IMPORTANT: handle both plain and already-bold markdown variants:
 * - " Who: ..." -> new paragraph
 * - " **Who:** ..." -> new paragraph
 * - " **Who**: ..." -> new paragraph
 */
const splitInlineLabelsInsideParagraph = (markdown: string) => {
  let out = markdown

  for (const key of INLINE_LABEL_KEYS) {
    const canonical = INLINE_LABELS[key] ?? key

    // **Who:** ...
    out = out.replace(
      new RegExp(`\\s+\\*\\*${escapeRegExp(canonical)}:\\*\\*\\s+`, 'g'),
      `\n\n${canonical}: `,
    )

    // **Who**: ...
    out = out.replace(
      new RegExp(`\\s+\\*\\*${escapeRegExp(canonical)}\\*\\*:\\s+`, 'g'),
      `\n\n${canonical}: `,
    )

    // Who: ...
    out = out.replace(
      new RegExp(`\\s+${escapeRegExp(canonical)}:\\s+`, 'g'),
      `\n\n${canonical}: `,
    )
  }

  return out
}

const splitInlineStageHeadingAtEnd = (line: string): string[] => {
  const src = line.replace(/[ \t]+$/g, '')
  const m = src.match(INLINE_STAGE_HEADING_AT_END_PATTERN)
  if (!m) return [line]

  const before = (m[1] ?? '').trimEnd()
  const punct = (m[2] ?? '')
  const quote = (m[3] ?? '')
  const heading = (m[4] ?? '').trim()

  if (!heading) return [line]

  const left = `${before}${punct}${quote}`.trimEnd()
  const headingLine = `${heading}:`

  if (!left) return [headingLine]
  return [left, headingLine]
}

export function normalizePlanToMarkdown(raw: string): string {
  const normalizedLineBreaks = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  const lines = normalizedLineBreaks
    .split('\n')
    .map((l) => l.replace(/[ \t]+$/g, ''))

  // We need this to stop list mode when a new numbered section begins.
  const isNumberedHeader = lines.map((l) => NUMBERED_HEADING_PATTERN.test(l.trim()))

  // Pass 1: normalize headings + bullets (without changing line count)
  const base = lines.map((line) => {
    let out = normalizeBulletMarker(line)
    out = clampMarkdownHeading(out)
    out = normalizeNumberedHeading(out)

    // Normalize plain label lines too (not only heading versions)
    const inline = toInlineLabel(out)
    if (inline) out = inline

    return out
  })

  // Pass 2: list-mode formatting + split inline stage headings glued to the previous sentence
  const out: string[] = []
  let listMode = false
  let blankInList = 0

  const pushBlankIfNeeded = () => {
    if (out.length === 0) return
    if (out[out.length - 1] !== '') out.push('')
  }

  const emitHeaderLine = (rawLine: string) => {
    const trimmed = rawLine.trim()
    const headerText = stripHeadingHashes(stripBulletPrefix(trimmed))
      .replace(/:$/, '')
      .trim()

    pushBlankIfNeeded()
    out.push(headerText ? `**${headerText}**:` : trimmed)
    // Blank line after header helps Markdown reliably start a new list block
    out.push('')
  }

  for (let i = 0; i < base.length; i += 1) {
    const original = base[i] ?? ''
    const parts = splitInlineStageHeadingAtEnd(original)

    for (let p = 0; p < parts.length; p += 1) {
      const line = parts[p] ?? ''
      const trimmed = line.trim()

      // Stop list mode on numbered section headers or horizontal rules
      if (
        listMode &&
        (HORIZONTAL_RULE_PATTERN.test(trimmed) || isNumberedHeader[i] === true)
      ) {
        listMode = false
        blankInList = 0
      }

      if (listMode) {
        if (!trimmed) {
          blankInList += 1
          // allow some whitespace inside list, but don't kill list too early
          if (blankInList >= 3) {
            listMode = false
            blankInList = 0
            out.push('')
          }
          continue
        }

        blankInList = 0

        // Header inside list => end list block, print header, start a new list block
        if (trimmed.endsWith(':') && !LABEL_LINE_PATTERN.test(trimmed)) {
          listMode = false
          blankInList = 0
          emitHeaderLine(trimmed)
          listMode = true
          continue
        }

        // If already bullet — keep it (normalized)
        if (BULLET_PREFIX_PATTERN.test(trimmed)) {
          out.push(normalizeBulletMarker(trimmed))
          continue
        }

        // Headings inside list => convert to bullet items
        const headingMatch = trimmed.match(MARKDOWN_HEADING_PATTERN)
        if (headingMatch) {
          const text = (headingMatch[2] ?? '').trim()
          if (text) {
            out.push(`- ${text}`)
            continue
          }
        }

        // Otherwise, make it a bullet
        out.push(`- ${trimmed}`)
        continue
      }

      // Non-list mode:
      if (!trimmed) {
        out.push('')
        continue
      }

      // If line ends with ":" it introduces a list block: make it a bold header line
      if (trimmed.endsWith(':') && !LABEL_LINE_PATTERN.test(trimmed)) {
        emitHeaderLine(trimmed)
        listMode = true
        blankInList = 0
        continue
      }

      out.push(trimmed)
    }
  }

  // Pass 3: split inline labels inside long paragraphs and normalize them again
  const joined = out.join('\n').replace(/\n{3,}/g, '\n\n')
  const withSplit = splitInlineLabelsInsideParagraph(joined)

  // Normalize label lines after split
  const final = withSplit
    .split('\n')
    .map((l) => {
      const inline = toInlineLabel(l)
      return inline ?? l
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')

  return final
}
