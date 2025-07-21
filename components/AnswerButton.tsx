import React, { useState } from 'react';
import socket from '../lib/socket';
import { SubmittedAnswer, Question } from '../types';

interface Props {
  question: Question;
  option: string;
  player: string;
  answered: boolean;
  onAnswer: () => void;
}

const AnswerButton = ({ question, option, player, answered, onAnswer }: Props) => {
  const [selected, setSelected] = useState(false);

  const submitAnswer = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const selectedAddress = window.ethereum.selectedAddress;
        // Proceed with answer submission
      } catch (error) {
        console.error('Error with MetaMask:', error);
        return;
      }
    }

    const answer = {
      questionId: question.id,
      player,
      answer: option,
    };
    socket.emit('submit-answer', answer);
    setSelected(true);
    onAnswer();
  };

  return (
    <button
      onClick={submitAnswer}
      className={selected ? 'selected' : ''}
      disabled={answered}
    >
      {option}
    </button>
  );
};

export default AnswerButton;