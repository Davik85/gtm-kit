declare module 'html-to-docx' {
  type DocxOptions = Record<string, unknown>
  const HTMLtoDOCX: (
    html: string,
    fileName?: string,
    options?: DocxOptions,
  ) => Promise<ArrayBuffer | Uint8Array>
  export default HTMLtoDOCX
}
