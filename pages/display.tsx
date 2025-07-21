import React, { useState, useEffect } from 'react';
import Timer from '../components/Timer';
import socket from '../lib/socket';
import { Question } from '../types';

const DisplayPage = () => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    socket.on('broadcast-question', (q) => {
      console.log('Received broadcast-question:', q);
      setQuestion(q);
      setAnswer('');
    });

    socket.on('reveal-correct', (correctAnswer) => {
      setAnswer(correctAnswer);
    });

    socket.on('question-ended', () => {
      setQuestion(null);
      setAnswer('');
    });
  }, []);

  return (
    <div>
      <h1>Quiz Display</h1>
      <Timer />
      {question ? (
        <div>
          <h2>{question.question}</h2>
          <ul>
            {question.options.map((option, index) => (
              <li key={index}>{option}</li>
            ))}
          </ul>
          {answer && <p>The correct answer is: {answer}</p>}
        </div>
      ) : (
        <p>Waiting for question...</p>
      )}
    </div>
  );
};

export default DisplayPage;