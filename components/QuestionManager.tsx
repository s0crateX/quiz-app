import React, { useState, useEffect } from 'react';
import { Question } from '../types';
import socket from '../lib/socket';

const QuestionManager = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [answer, setAnswer] = useState('');
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    fetch('/api/questions')
      .then(res => res.json())
      .then(data => setQuestions(data));
  }, []);

  const addQuestion = async () => {
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: newQuestion, options, answer }),
    });
    const addedQuestion = await res.json();
    setQuestions([...questions, addedQuestion]);
  };

  const deleteQuestion = async (id: number) => {
    await fetch('/api/questions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setQuestions(questions.filter(q => q.id !== id));
  };

  const startQuestion = (question: Question) => {
    console.log('Emitting start-question:', question, timer);
    socket.emit('start-question', question, timer);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <div>
      <h2>Question Manager</h2>
      <div>
        <h3>Add Question</h3>
        <input
          type="text"
          placeholder="Question"
          value={newQuestion}
          onChange={e => setNewQuestion(e.target.value)}
        />
        {options.map((option, index) => (
          <input
            key={index}
            type="text"
            placeholder={`Option ${index + 1}`}
            value={option}
            onChange={e => handleOptionChange(index, e.target.value)}
          />
        ))}
        <input
          type="text"
          placeholder="Answer"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
        />
        <button onClick={addQuestion}>Add Question</button>
      </div>
      <div>
        <h3>Set Timer (seconds)</h3>
        <input
          type="number"
          value={timer}
          onChange={e => setTimer(parseInt(e.target.value))}
        />
      </div>
      <div>
        <h3>Questions</h3>
        <ul>
          {questions.map(q => (
            <li key={q.id}>
              {q.question}
              <button onClick={() => deleteQuestion(q.id)}>Delete</button>
              <button onClick={() => startQuestion(q)}>Start Quiz</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default QuestionManager;