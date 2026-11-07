//A função extractTextFromPdf recebe o arquivo, percorre as páginas e 
//junta o texto.


import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import pdfWorkerUrl from 'pdfjs/legacy/build/pdf.worker.min.mjs?url'

// O pdf.js faz o trabalho pesado num "worker" (processo separado do navegador).
// Precisamos dizer onde está o arquivo dele. O "?url" faz o Vite empacotar o
// worker junto com o app e devolver o caminho certo, inclusive dentro do Android.
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl




// Lê um arquivo PDF (objeto File) e devolve o texto de todas as páginas.
export async function extractTextFromPDF(file) {
    const data = new Uint8Array(await file.arrayBuffer())
    constr pdf = await pdfjsLib.getDocument({ data }).promise

    const page = []
    for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n)
        const content = await page.getTextContent()

        // Cada item é um pedaço de texto. hasEOL indica fim de linha.
        let pageText = ''
        for (const item of content.items) {
            pageText += item.str
            pageText += item.hasEOL ? '\n' : ' '
        }

        pages.push(pageText.replace(/[\t]+\n/g, '\n').trim())
    }

    retur pages.filter(boolean).join('\n\n')

}