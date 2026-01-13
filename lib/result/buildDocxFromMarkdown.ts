import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'

const splitBoldRuns = (text: string) => {
  const parts = text.split('**')
  return parts
    .map((part, index) => {
      if (!part) return null
      return new TextRun({ text: part, bold: index % 2 === 1 })
    })
    .filter((run): run is TextRun => Boolean(run))
}

const buildParagraph = (line: string) => {
  const trimmed = line.trim()
  if (!trimmed) {
    return new Paragraph({})
  }

  if (trimmed.startsWith('## ')) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: splitBoldRuns(trimmed.replace(/^##\s+/, '')),
    })
  }

  if (trimmed.startsWith('### ')) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_3,
      children: splitBoldRuns(trimmed.replace(/^###\s+/, '')),
    })
  }

  if (trimmed.startsWith('- ')) {
    return new Paragraph({
      bullet: { level: 0 },
      children: splitBoldRuns(trimmed.replace(/^[-]\s+/, '')),
    })
  }

  return new Paragraph({ children: splitBoldRuns(trimmed) })
}

export async function buildDocxFromMarkdown(markdown: string): Promise<Uint8Array> {
  const normalized = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n')
  const paragraphs: Paragraph[] = []

  for (const line of lines) {
    const paragraph = buildParagraph(line)
    if (paragraph) {
      paragraphs.push(paragraph)
    }
  }

  const document = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22,
          },
        },
      },
    },
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  })

  const buffer = await Packer.toBuffer(document)
  return buffer
}
