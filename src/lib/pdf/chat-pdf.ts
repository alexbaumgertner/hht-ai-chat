import PDFDocument from 'pdfkit'

import { MEDICAL_DISCLAIMER } from '@/lib/ai/disclaimer'

export async function buildChatPdfBuffer(options: {
  title: string
  messages: Array<{ role: string; content: string; createdAt?: string | null }>
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(16).text(options.title || 'HHT Chat Export', { underline: true })
    doc.moveDown()
    doc.fontSize(10).fillColor('#444').text(`Exported: ${new Date().toISOString()}`)
    doc.moveDown()

    for (const message of options.messages) {
      const label =
        message.role === 'user' ? 'You' : message.role === 'assistant' ? 'Assistant' : 'System'
      const when = message.createdAt ? new Date(message.createdAt).toLocaleString() : ''
      doc.fillColor('#111').fontSize(11).text(`${label}${when ? ` — ${when}` : ''}`)
      doc.fillColor('#222').fontSize(10).text(message.content, { width: 500 })
      doc.moveDown()
    }

    doc.moveDown()
    doc.fontSize(8).fillColor('#666').text(MEDICAL_DISCLAIMER, { width: 500, align: 'left' })

    doc.end()
  })
}
