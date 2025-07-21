'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Timer from '../../../components/Timer';
import AnswerButton from '../../../components/AnswerButton';
import socket from '../../../../lib/socket';
import { Question } from '../../../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import {
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Trophy,
  Target,
  UserCheck
} from 'lucide-react';
import Layout from '../../../components/Layout';

const PlayerPage = () => {
  const params = useParams();
  const name = params?.name as string;
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [showReadyButton, setShowReadyButton] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (name) {
      socket.on('broadcast-question', (q: Question, timer: number) => {
        console.log('Received broadcast-question on player page:', q);
        setQuestion(q);
        setAnswer('');
        setAnswered(false);
        setSelectedOption('');
        setTimeLeft(timer);
        setTotalTime(timer);
        setShowReadyButton(false);
        setIsReady(false);
      });

      socket.on('reveal-correct', (correctAnswer: string) => {
        setAnswer(correctAnswer);
      });

      socket.on('timer-ended', () => {
        console.log('Timer ended, showing ready button');
        setShowReadyButton(true);
      });

      socket.on('all-players-ready', () => {
        console.log('All players ready, resetting screen');
        setQuestion(null);
        setAnswer('');
        setTimeLeft(0);
        setTotalTime(0);
        setSelectedOption('');
        setShowReadyButton(false);
        setIsReady(false);
      });

      socket.on('question-ended', () => {
        setQuestion(null);
        setAnswer('');
        setTimeLeft(0);
        setTotalTime(0);
        setSelectedOption('');
        setShowReadyButton(false);
        setIsReady(false);
      });
    }

    return () => {
      socket.off('broadcast-question');
      socket.off('reveal-correct');
      socket.off('timer-ended');
      socket.off('all-players-ready');
      socket.off('question-ended');
    };
  }, [name]);

  // Update timer countdown
  useEffect(() => {
    if (timeLeft > 0 && question) {
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = Math.max(0, prev - 1);
          // Show ready button when timer reaches 0
          if (newTime === 0 && !showReadyButton) {
            setShowReadyButton(true);
          }
          return newTime;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timeLeft, question, showReadyButton]);

  const handleAnswerSelect = (option: string) => {
    setSelectedOption(option);
    setAnswered(true);
  };

  const handleReady = () => {
    setIsReady(true);
    socket.emit('player-ready', decodedName);
  };

  const progressPercentage = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  const isTimeUp = timeLeft === 0 && question && !answer;

  // Decode the name parameter
  const decodedName = decodeURIComponent(name || '');

  return (
    <Layout title={`Welcome, ${decodedName}!`}>
      <div className="space-y-6">
        {/* Player Info Card */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center justify-center space-x-3">
              <User className="w-6 h-6" />
              <span>{decodedName}</span>
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </CardTitle>
          </CardHeader>
        </Card>

        {question ? (
          <div className="space-y-6">
            {/* Timer and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className={`${isTimeUp ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-3">
                    <Clock className={`w-6 h-6 ${isTimeUp ? 'text-red-600' : 'text-blue-600'}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Time Remaining</span>
                        <span className={`text-lg font-bold ${isTimeUp ? 'text-red-600' : 'text-blue-600'}`}>
                          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <Progress 
                        value={progressPercentage} 
                        className={`h-2 ${isTimeUp ? 'bg-red-200' : 'bg-blue-200'}`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={`${answered ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-3">
                    {answered ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <Target className="w-6 h-6 text-gray-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-700">Status</p>
                      <p className={`text-lg font-bold ${answered ? 'text-green-600' : 'text-gray-600'}`}>
                        {answered ? 'Answer Submitted' : 'Waiting for Answer'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Question Card */}
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Badge variant="secondary" className="text-lg px-4 py-1">
                    Question #{question.id}
                  </Badge>
                </div>
                <CardTitle className="text-xl md:text-2xl font-bold text-gray-800 leading-tight">
                  {question.question}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {isTimeUp && !answered && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      Time&apos;s up! You can no longer submit an answer for this question.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 gap-3">
                  {question.options.map((option, index) => {
                    const isSelected = selectedOption === option;
                    const isCorrect = answer && option === answer;
                    const isWrong = answer && selectedOption === option && option !== answer;
                    const optionLetter = String.fromCharCode(65 + index);
                    
                    return (
                      <div key={index} className="relative">
                        <AnswerButton
                          question={question}
                          option={option}
                          player={decodedName}
                          answered={answered || !!isTimeUp}
                          onAnswer={() => handleAnswerSelect(option)}
                          className={`
                            w-full p-4 text-left transition-all duration-300 transform hover:scale-105
                            ${isSelected && !answer ? 'bg-blue-100 border-blue-500 border-2' : ''}
                            ${isCorrect ? 'bg-green-100 border-green-500 border-2' : ''}
                            ${isWrong ? 'bg-red-100 border-red-500 border-2' : ''}
                            ${!isSelected && !answer ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' : ''}
                            ${answered || isTimeUp ? 'cursor-not-allowed' : 'cursor-pointer'}
                          `}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`
                              w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
                              ${isCorrect ? 'bg-green-500 text-white' : ''}
                              ${isWrong ? 'bg-red-500 text-white' : ''}
                              ${isSelected && !answer ? 'bg-blue-500 text-white' : ''}
                              ${!isSelected && !answer ? 'bg-gray-300 text-gray-700' : ''}
                            `}>
                              {isCorrect ? <CheckCircle className="w-5 h-5" /> : optionLetter}
                            </div>
                            <span className={`text-lg font-medium ${
                              isCorrect ? 'text-green-800' : 
                              isWrong ? 'text-red-800' : 
                              'text-gray-800'
                            }`}>
                              {option}
                            </span>
                          </div>
                        </AnswerButton>
                      </div>
                    );
                  })}
                </div>

                {answer && (
                  <Card className="bg-green-50 border-green-200 border-2">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-center space-x-2 text-green-800">
                        <Trophy className="w-6 h-6" />
                        <span className="text-xl font-bold">
                          Correct Answer: {answer}
                        </span>
                      </div>
                      {selectedOption === answer && (
                        <div className="text-center mt-2">
                          <Badge className="bg-green-500 text-white">
                            🎉 Congratulations! You got it right!
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {showReadyButton && (
                  <Card className="bg-blue-50 border-blue-200 border-2">
                    <CardContent className="pt-4">
                      <div className="text-center space-y-4">
                        <div className="flex items-center justify-center space-x-2 text-blue-800">
                          <UserCheck className="w-6 h-6" />
                          <span className="text-lg font-bold">
                            Ready for the next question?
                          </span>
                        </div>
                        <Button
                          onClick={handleReady}
                          disabled={isReady}
                          className={`w-full ${isReady ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                          {isReady ? (
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-5 h-5" />
                              <span>Ready! Waiting for others...</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <UserCheck className="w-5 h-5" />
                              <span>I&apos;m Ready!</span>
                            </div>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="text-center shadow-xl border-0">
            <CardContent className="pt-8 pb-8">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Ready to Play!
                </h2>
                <p className="text-gray-600">
                  Waiting for the quiz master to start the next question...
                </p>
                <div className="flex justify-center">
                  <div className="animate-pulse flex space-x-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default PlayerPage;