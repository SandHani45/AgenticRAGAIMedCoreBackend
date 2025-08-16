// Simple PDF text extraction using pdf-parse
import fs from "fs";
import pdf from "pdf-parse";
/**
 * Extracts text from a PDF file.
 * @param {string} filePath - Path to the PDF file.
 * @returns {Promise<string>} - Extracted text from the PDF.
 */


async function pdfToText(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  console.log('--->', data.text);
  return data.text; // Clean text for AI prompt
}

// function pdfParse(buffer: Buffer<ArrayBufferLike>) {
//   throw new Error("Function not implemented.");
// }
export { pdfToText };