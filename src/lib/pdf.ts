import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import type {
	Style,
	TableLayout,
	TDocumentDefinitions,
} from 'pdfmake/interfaces'

pdfMake.vfs = {
	...pdfFonts.vfs
}
export const createPdf = async (doc: TDocumentDefinitions) => {
	const pdfStream = await pdfMake.createPdf(doc)
	return await streamToBuffer(pdfStream)
}
function streamToBuffer(stream: any): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = []

		stream.on('data', (chunk: Buffer) => {
			chunks.push(chunk)
		})

		stream.on('end', () => {
			resolve(Buffer.concat(chunks))
		})

		stream.on('error', (error: Error) => {
			reject(error)
		})

		// Finalize the PDF document
		stream.end()
	})
}