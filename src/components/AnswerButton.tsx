import React, { useState } from 'react';
import socket from '../../lib/socket';
import { SubmittedAnswer, Question } from '../../types';
import { Button } from './ui/button';

interface Props {
  question: Question;
  option: string;
  player: string;
  answered: boolean;
  onAnswer: () => void;
  className?: string;
  children?: React.ReactNode;
}

const AnswerButton = ({ 
  question, 
  option, 
  player, 
  answered, 
  onAnswer, 
  className = "",
  children 
}: Props) => {
  const [selected, setSelected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitAnswer = async () => {
    if (answered || isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Optional MetaMask integration (keeping original functionality)
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const selectedAddress = window.ethereum.selectedAddress;
        // Proceed with answer submission
      } catch (error) {
        console.error('Error with MetaMask:', error);
        setIsSubmitting(false);
        return;
      }
    }

    const answer: SubmittedAnswer = {
      questionId: question.id,
      player,
      answer: option,
    };
    
    try {
      socket.emit('submit-answer', answer);
      setSelected(true);
      onAnswer();
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (children) {
    // Custom render with children
    return (
      <div
        onClick={submitAnswer}
        className={`${className} ${answered ? 'pointer-events-none' : 'cursor-pointer'}`}
      >
        {children}
      </div>
    );
  }

  // Default button render
  return (
    <Button
      onClick={submitAnswer}
      className={`${className} ${selected ? 'bg-blue-600' : ''}`}
      disabled={answered || isSubmitting}
      variant={selected ? "default" : "outline"}
      size="lg"
    >
      {isSubmitting ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Submitting...</span>
        </div>
      ) : (
        option
      )}
    </Button>
  );
};

export default AnswerButton;