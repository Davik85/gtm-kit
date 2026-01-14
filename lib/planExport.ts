// lib/planExport.ts
import { remark } from 'remark'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import HTMLtoDOCX from 'html-to-docx'
import puppeteer from 'puppeteer'

/**
 * IMPORTANT:
 * - We DO NOT use remark-gfm in export, because it can crash with "inTable"
 *   depending on dependency resolutions. Export must stay deterministic.
 * - DOCX export via html-to-docx maps <h1>/<h2>/<h3> to Word "Heading" styles,
 *   which are often huge and can override CSS.
 * - To keep fonts stable and match the on-page look, we demote headings to <p>
 *   with classes (.h2/.h3) and style them via CSS.
 */

const EXPORT_CSS = `
  @page { size: A4; margin: 20mm 16mm 20mm 16mm; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, "Noto Sans", sans-serif;
    font-size: 11pt;
    line-height: 1.55;
    color: #111;
  }

  /* "Heading-like" paragraphs (instead of real <h*> tags) */
  p.h2 {
    font-size: 14pt;
    line-height: 1.25;
    margin: 14pt 0 8pt;
    font-weight: 700;
  }

  p.h3 {
    font-size: 12pt;
    line-height: 1.3;
    margin: 12pt 0 6pt;
    font-weight: 700;
  }

  p {
    margin: 9pt 0;
  }

  ul, ol {
    margin: 8pt 0 8pt 18pt;
    padding: 0;
  }

  li {
    margin: 4pt 0;
  }

  /* Prevent huge spacing when Markdown produces <p> inside <li> */
  li > p {
    margin: 0;
  }

  strong {
    font-weight: 600;
  }

  hr {
    margin: 12pt 0;
  }

  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 10pt;
  }

  pre {
    white-space: pre-wrap;
    word-break: break-word;
    overflow-wrap: anywhere;
  }
`

/**
 * PDF mismatch root cause (most common):
 * model sometimes outputs inline labels as Markdown headings:
 *   ### Triggers: ...
 * Those become <h3> and then our demotion makes them <p class="h3"> => larger text in PDF/DOCX.
 *
 * We normalize such lines BEFORE markdown->HTML conversion:
 *   ### Triggers: text  ->  **Triggers:** text
 *
 * This keeps the font size at base 11pt and matches the result page + Word.
 */
const INLINE_LABELS: Record<string, string> = {
  who: 'Who',
  jtbd: 'JTBD',
  triggers: 'Triggers',
  barriers: 'Barriers',
  'barriers/objections': 'Barriers/objections',
  'decision criteria': 'Decision criteria',
  alternatives: 'Alternatives',
  'where to reach': 'Where to reach',
  'value/ability to pay signals': 'Value & ability to pay signals',
  'value & ability to pay signals': 'Value & ability to pay signals',
  'value and ability to pay signals': 'Value & ability to pay signals',
}

const INLINE_LABEL_KEYS = Object.keys(INLINE_LABELS)
  .map((k) => k.toLowerCase())
  .sort((a, b) => b.length - a.length)

const escapeRegExp = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const INLINE_LABEL_HEADING_LINE_PATTERN = new RegExp(
  `^\\s*#{1,6}\\s+(?:\\*\\*)?(${INLINE_LABEL_KEYS.map(escapeRegExp).join('|')})(?:\\*\\*)?\\s*:\\s*(.*)$`,
  'i',
)

function normalizeInlineLabelHeadings(markdown: string): string {
  const normalizedLineBreaks = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalizedLineBreaks.split('\n')

  const out = lines.map((line) => {
    const m = line.match(INLINE_LABEL_HEADING_LINE_PATTERN)
    if (!m) return line

    const rawKey = (m[1] ?? '').trim().toLowerCase()
    const rest = (m[2] ?? '').trim()
    const canonical = INLINE_LABELS[rawKey] ?? rawKey

    if (!rest) return `**${canonical}**:`
    return `**${canonical}:** ${rest}`
  })

  return out.join('\n')
}

function createRemarkProcessor() {
  // IMPORTANT: no remark-gfm here to avoid "inTable" crashes
  return remark().use(remarkRehype).use(rehypeStringify)
}

async function markdownToHtmlBody(markdown: string): Promise<string> {
  const prepared = normalizeInlineLabelHeadings(markdown)
  const file = await createRemarkProcessor().process(prepared)
  return String(file)
}

function demoteHtmlHeadingsToParagraphs(bodyHtml: string): string {
  // Convert any <h1>/<h2> to <p class="h2"> ... </p>
  // Convert any <h3>-<h6> to <p class="h3"> ... </p>
  // This prevents Word Heading styles (huge fonts) in DOCX export.
  return bodyHtml
    .replace(/<h1\b[^>]*>/gi, '<p class="h2">')
    .replace(/<\/h1>/gi, '</p>')
    .replace(/<h2\b[^>]*>/gi, '<p class="h2">')
    .replace(/<\/h2>/gi, '</p>')
    .replace(/<h3\b[^>]*>/gi, '<p class="h3">')
    .replace(/<\/h3>/gi, '</p>')
    .replace(/<h4\b[^>]*>/gi, '<p class="h3">')
    .replace(/<\/h4>/gi, '</p>')
    .replace(/<h5\b[^>]*>/gi, '<p class="h3">')
    .replace(/<\/h5>/gi, '</p>')
    .replace(/<h6\b[^>]*>/gi, '<p class="h3">')
    .replace(/<\/h6>/gi, '</p>')
}

function wrapHtmlDocument(bodyHtml: string, title = 'Go-to-market plan'): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>${EXPORT_CSS}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`
}

export async function buildDocxFromMarkdown(
  markdown: string,
  title?: string,
): Promise<Uint8Array> {
  const body = await markdownToHtmlBody(markdown)
  const safeBody = demoteHtmlHeadingsToParagraphs(body)
  const html = wrapHtmlDocument(safeBody, title)

  const docx = await HTMLtoDOCX(html, undefined, {
    pageNumber: true,
    footer: true,
  })

  if (Buffer.isBuffer(docx)) return new Uint8Array(docx)
  return new Uint8Array(docx as ArrayBuffer)
}

export async function buildPdfFromMarkdown(
  markdown: string,
  title?: string,
): Promise<Uint8Array> {
  const body = await markdownToHtmlBody(markdown)
  const safeBody = demoteHtmlHeadingsToParagraphs(body)
  const html = wrapHtmlDocument(safeBody, title)

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    await page.emulateMediaType('screen')

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '16mm', bottom: '20mm', left: '16mm' },
    })

    return new Uint8Array(pdf)
  } finally {
    await browser.close()
  }
}
