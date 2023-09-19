const axios = require('axios');
const bodyParser = require('body-parser');
const express = require('express');
const multer = require('multer');
const fs = require('fs'); // Add this line to import the 'fs' module
const { extractTextFromPDF } = require('./pdf-parser'); // Replace with your PDF text extraction logic
const app = express();
app.use(bodyParser.json());
env = require('./env');
const cors = require('cors');

const allowedOrigins = ['http://localhost:3001']; // Replace with your frontend's URL
app.use(cors({
  origin: allowedOrigins,
}));

const upload = multer({ dest: '../../../Downloads' });

app.post('/start-exam', upload.single('pdf'), async (req, res) => {
  try {
    console.log('PDF file path:', req.file.path);
    const pdfText = await extractTextFromPDF(req.file.path, 300); // Implement a function to extract text from PDF
    console.log('pdftext ', pdfText)
    const response = await axios.post('http://localhost:3000/generate-next-question', { text: pdfText });

    const initialQuestion = response.data.generatedQuestions;
    res.status(200).json({ initialQuestion });
  } catch (error) {
    console.error('Error starting exam:', error);
    res.status(500).json({ error: 'An error occurred while starting the exam' });
  }
});

app.post('/generate-next-question', async (req, res) => {
  try {
    const text = req.body.text; // Text received in the request

    const prompt = `Generate questions based on the following text:\n\n${text}\n\nQuestion: `;

    const requestBody = {
      model: 'gpt-3.5-turbo', // Use the gpt-3.5-turbo engine
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 100,
    };

    const response = await axios.post('https://api.openai.com/v1/chat/completions', requestBody, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.openai_api_key}`, // Pass the API key as a header
      },
    });

    const generatedQuestions = response.data.choices[0].message.content;

    res.status(200).json({ generatedQuestions });
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ error: 'An error occurred while generating questions' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
