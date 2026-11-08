import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'

// O pdf.js faz o trabalho pesado num "worker" (processo separado do navegador).
// Precisamos dizer onde está o arquivo dele. O "?url" faz o Vite empacotar o
// worker junto com o app e devolver o caminho certo, inclusive dentro do Android.
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl




export async function extractTextFromPdf(file) {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const pages = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    const items = content.items.filter(item => typeof item.str === 'string' && item.str.length)

    if (!items.length) {
      pages.push('')
      continue
    }

    const lines = []
    let currentLine = ''
    let previousItem = null
    let previousY = null

    for (const item of items) {
      const x = item.transform?.[4] ?? 0
      const y = item.transform?.[5] ?? 0
      const width = item.width ?? 0
      const sameLine = previousY !== null && Math.abs(y - previousY) < 4

      if (!sameLine && currentLine.trim()) {
        lines.push(currentLine.trim())
        currentLine = ''
      }

      if (currentLine && previousItem && sameLine) {
        const previousText = previousItem.str || ''
        const previousRight = (previousItem.transform?.[4] ?? 0) + (previousItem.width ?? 0)
        const gap = x - previousRight
        const fontSize = Math.abs(item.transform?.[3] ?? item.height ?? 10) || 10
        const needsSpace = !/[\s]$/.test(previousText) && !/^[\s.,;:!?%)\]}]/.test(item.str) && gap > fontSize * 0.12
        if (needsSpace) currentLine += ' '
      }

      currentLine += item.str
      previousItem = item
      previousY = y

      if (item.hasEOL) {
        if (currentLine.trim()) lines.push(currentLine.trim())
        currentLine = ''
        previousItem = null
        previousY = null
      }
    }

    if (currentLine.trim()) lines.push(currentLine.trim())
    pages.push(lines.filter(Boolean).join('\n'))
  }

  return pages.join('\n\n').trim()
}