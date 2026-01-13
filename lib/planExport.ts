const requireModule = (id: string) => {
  // eslint-disable-next-line no-eval
  const req = eval('require') as NodeRequire
  return req(id)
}

// DOCX: keep pt-based typography (Word-friendly)
const EXPORT_CSS_DOCX = `
  @page { size: A4; margin: 20mm 16mm 20mm 16mm; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, "Noto Sans", sans-serif;
    font-size: 11pt;
    line-height: 1.55;
    color: #111;
  }
  h1 {
    font-size: 18pt;
    line-height: 1.2;
    margin: 0 0 12pt;
    font-weight: 700;
  }
  h2 {
    font-size: 16pt;
    line-height: 1.25;
    margin: 14pt 0 8pt;
    font-weight: 700;
  }
  h3 {
    font-size: 13pt;
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
  strong, b {
    font-weight: 600;
  }
  hr {
    margin: 12pt 0;
  }
  code, pre {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 10pt;
  }
  pre {
    white-space: pre-wrap;
    word-break: break-word;
  }
`

// PDF: use px-based typography (browser-print stable, smaller defaults)
const EXPORT_CSS_PDF = `
  @page { size: A4; margin: 20mm 16mm 20mm 16mm; }

  html { font-size: 12px; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, "Noto Sans", sans-serif;
    font-size: 12px;
    line-height: 1.55;
    color: #111;
  }

  h1 {
    font-size: 18px;
    line-height: 1.2;
    margin: 0 0 12px;
    font-weight: 700;
  }
  h2 {
    font-size: 16px;
    line-height: 1.25;
    margin: 14px 0 8px;
    font-weight: 700;
  }
  h3 {
    font-size: 14px;
    line-height: 1.3;
    margin: 12px 0 6px;
    font-weight: 700;
  }

  p { margin: 8px 0; }
  ul, ol {
    margin: 8px 0 8px 18px;
    padding: 0;
  }
  li { margin: 4px 0; }

  strong, b { font-weight: 600; }
  hr { margin: 12px 0; }

  code, pre {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 11px;
  }
  pre {
    white-space: pre-wrap;
    word-break: break-word;
  }
`

async function markdownToHtmlBody(markdown: string): Promise<string> {
  const { remark } = requireModule('remark') as { remark: () => any }
  const remarkGfm = requireModule('remark-gfm') as (options?: unknown) => unknown
  const remarkRehype = requireModule('remark-rehype') as (options?: unknown) => unknown
  const rehypeStringify = requireModule('rehype-stringify') as (options?: unknown) => unknown

  const file = await remark()
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(markdown)

  return String(file)
}

function wrapHtmlDocument(bodyHtml: string, title: string, css: string): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>${css}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`
}

function toUint8Array(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) return value
  if (Buffer.isBuffer(value)) return new Uint8Array(value)
  if (value instanceof ArrayBuffer) return new Uint8Array(value)
  throw new TypeError('Unsupported output type')
}

export async function buildDocxFromMarkdown(
  markdown: string,
  title = 'Go-to-market plan',
): Promise<Uint8Array> {
  const body = await markdownToHtmlBody(markdown)
  const html = wrapHtmlDocument(body, title, EXPORT_CSS_DOCX)

  const htmlToDocxModule = requireModule('html-to-docx') as { default?: unknown }
  const htmlToDocx =
    (htmlToDocxModule.default as (html: string, a?: unknown, b?: unknown) => Promise<unknown>) ??
    (htmlToDocxModule as (html: string, a?: unknown, b?: unknown) => Promise<unknown>)

  const docx = await htmlToDocx(html, undefined, {
    pageNumber: true,
    footer: true,
  })

  return toUint8Array(docx)
}

export async function buildPdfFromMarkdown(
  markdown: string,
  title = 'Go-to-market plan',
): Promise<Uint8Array> {
  const body = await markdownToHtmlBody(markdown)
  const html = wrapHtmlDocument(body, title, EXPORT_CSS_PDF)

  const puppeteerModule = requireModule('puppeteer') as { default?: unknown }
  const puppeteer =
    (puppeteerModule.default as { launch: (options: any) => Promise<any> }) ??
    (puppeteerModule as { launch: (options: any) => Promise<any> })

  const browser = await puppeteer.launch({
    headless: true, // IMPORTANT: keep boolean for current puppeteer types
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    // We generate a PDF (print context), so use print media.
    await page.emulateMediaType('print')

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '20mm', right: '16mm', bottom: '20mm', left: '16mm' },
      // If you still see slightly big text after CSS, uncomment:
      // scale: 0.95,
    })

    return new Uint8Array(pdf)
  } finally {
    await browser.close()
  }
}
