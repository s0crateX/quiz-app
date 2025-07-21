import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Timer from '../../components/Timer';
import AnswerButton from '../../components/AnswerButton';
import socket from '../../lib/socket';
import { Question } from '../../types';

const PlayerPage = () => {
  const router = useRouter();
  const { name } = router.query;
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    if (name) {
      socket.on('broadcast-question', (q) => {
        console.log('Received broadcast-question on player page:', q);
        setQuestion(q);
        setAnswer('');
        setAnswered(false);
      });

      socket.on('reveal-correct', (correctAnswer) => {
        setAnswer(correctAnswer);
      });

      socket.on('question-ended', () => {
        setQuestion(null);
        setAnswer('');
      });
    }

    return () => {
      socket.off('broadcast-question');
      socket.off('reveal-correct');
      socket.off('question-ended');
    };
  }, [name]);

  return (
    <div>
      <h1>Welcome, {name}!</h1>
      <Timer />
      {question ? (
        <div>
          <h2>{question.question}</h2>
          <ul>
            {question.options.map((option, index) => (
              <li key={index}>
                <AnswerButton
                  question={question}
                  option={option}
                  player={name as string}
                  answered={answered}
                  onAnswer={() => setAnswered(true)}
                />
              </li>
            ))}
          </ul>
          {answer && <p>The correct answer is: {answer}</p>}
        </div>
      ) : (
        <p>Waiting for the quiz to start...</p>
      )}
    </div>
  );
};

export default PlayerPage;