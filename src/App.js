import React, { useState, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import axios from 'axios';
import Modal from 'react-modal';
import './App.css';
import './index'

Modal.setAppElement('#root'); // Set the root element for the modal

const App = () => {
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [savedTranscript, setSavedTranscript] = useState('');
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const selectedPDFFileRef = useRef(null); // Ref to store selected PDF file
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startListening = () => SpeechRecognition.startListening({ continuous: true, language: 'en-IN' });
  const { transcript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  if (!browserSupportsSpeechRecognition) {
    return <div>Speech recognition is not supported in your browser.</div>;
  }
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };  

  const handleStartExam = () => {
    setIsModalOpen(true); // Open the PDF upload modal
  };

  const handleFileChange = (event) => {
    selectedPDFFileRef.current = event.target.files[0];
  };

  const handleUploadPDF = async () => {
    try {
      setIsModalOpen(false); // Close the modal
      const formData = new FormData();
      formData.append('pdf', selectedPDFFileRef.current);

      const response = await axios.post('http://localhost:3000/start-exam', formData);

      const initialQuestion = response.data.initialQuestion;
      const questions = initialQuestion.split('\n');
      const firstQuestion = questions[0];
      setCurrentQuestion(firstQuestion); 
      setIsExamStarted(true);
      const speechSynthesis = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(firstQuestion);
      speechSynthesis.speak(utterance);
      startListening(); // Start audio recording
    } catch (error) {
      console.error('Error uploading PDF:', error);
    }
  };

  const handleStopExam = () => {
    stopRecording(); // Stop audio recording
    setIsExamStarted(false);
    SpeechRecognition.stopListening(); // Stop speech recognition
    setSavedTranscript(transcript); // Save the transcript
  };

  const handleNextQuestion = async () => {
    stopRecording(); // Stop audio recording
    setIsExamStarted(false);
    SpeechRecognition.stopListening(); // Stop speech recognition
    setSavedTranscript(transcript); // Save the transcript
  
    try {
      const response = await axios.post('http://localhost:3000/generate-next-question', {
        text: transcript, // Use the captured transcript here
      });
  
      const nextQuestion = response.data.generatedQuestions;
      const questions = nextQuestion.split('\n');
      const lastQuestion = questions[questions.length - 1]; // Get the last question

      // Speak the last question using text-to-speech
      const speechSynthesis = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(lastQuestion);
      speechSynthesis.speak(utterance);

      setCurrentQuestion(lastQuestion); // Update the current question
      setIsExamStarted(true);
      startListening(); // Start audio recording
      setSavedTranscript('');
    } catch (error) {
      console.error('Error generating next question:', error);
    }
  };  

  return (
    <div className="App">
      <h1>Oral Exam Web App</h1>
      {!isExamStarted ? (
        <button onClick={handleStartExam}>Start Exam</button>
      ) : (
        <div>
          <h2>Question:</h2>
          <p>{currentQuestion}</p>
          <button onClick={handleNextQuestion}>Next Question</button>
          <button onClick={handleStopExam}>Stop Exam</button>
          <h2>Your Answer:</h2>
          <div className="main-content">
            <div className="response-box">
              <p>{transcript}</p>
            </div>
          </div>
          {/* ... */}
        </div>
      )}

      {/* PDF Upload Modal */}
      <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)}>
        <h2>Upload PDF</h2>
        <input type="file" accept=".pdf" onChange={handleFileChange} />
        <button onClick={handleUploadPDF}>Upload PDF</button>
        <button onClick={() => setIsModalOpen(false)}>Close</button>
      </Modal>
    </div>
  );
};

export default App;
