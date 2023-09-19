const PDFParser = require('pdf-parse');

async function extractTextFromPDF(pdfFilePath, chunkSize) {
  try {
    const pdfData = await PDFParser(pdfFilePath);
    const extractedText = pdfData.text;

    // Preprocess and chunk the extracted text
    const chunks = [];
    const words = extractedText.split(/\s+/); // Split text into words
    let currentChunk = '';

    for (const word of words) {
      if ((currentChunk + word).length < chunkSize) {
        currentChunk += word + ' ';
      } else {
        chunks.push(currentChunk.trim());
        currentChunk = word + ' ';
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
    }

    console.log('Extracted chunks:', chunks); // Check extracted chunks
    
    // Concatenate chunks into a single string
    const concatenatedText = chunks.join('');

    console.log('Concatenated text:', concatenatedText); // Check concatenated text
    return concatenatedText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}

module.exports = { extractTextFromPDF };