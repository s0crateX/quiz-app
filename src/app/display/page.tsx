'use client';

import React, { useState, useEffect } from 'react';
import Timer from '../../components/Timer';
import socket from '../../../lib/socket';
import { Question } from '../../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { 
  HelpCircle, 
  Clock, 
  CheckCircle, 
  Users,
  Sparkles,
  Trophy
} from 'lucide-react';
import Layout from '../../components/Layout';

const DisplayPage = () => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [roundWinners, setRoundWinners] = useState<string[]>([]);

  useEffect(() => {
    socket.on('broadcast-question', (q: Question, timer: number) => {
      console.log('Received broadcast-question:', q);
      setQuestion(q);
      setAnswer('');
      setTimeLeft(timer);
      setTotalTime(timer);
    });

    socket.on('reveal-correct', (correctAnswer: string) => {
      setAnswer(correctAnswer);
    });

    socket.on('round-results', (winners: string[]) => {
      console.log('Display received round results:', winners);
      setRoundWinners(winners);
      // Clear winners after 8 seconds
      setTimeout(() => {
        setRoundWinners([]);
      }, 8000);
    });

    socket.on('all-players-ready', () => {
      console.log('All players ready, resetting display screen');
      setQuestion(null);
      setAnswer('');
      setTimeLeft(0);
      setTotalTime(0);
    });

    socket.on('question-ended', () => {
      setQuestion(null);
      setAnswer('');
      setTimeLeft(0);
      setTotalTime(0);
    });

    return () => {
      socket.off('broadcast-question');
      socket.off('reveal-correct');
      socket.off('round-results');
      socket.off('all-players-ready');
      socket.off('question-ended');
    };
  }, []);

  // Update timer countdown
  useEffect(() => {
    if (timeLeft > 0 && question && !answer) {
      const interval = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timeLeft, question, answer]);

  const progressPercentage = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  return (
    <Layout showLogo={false} className="bg-gradient-to-br from-blue-900 via-purple-900 to-red-900">
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        {/* Header */}
        <div className="w-full max-w-6xl mb-8">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl md:text-4xl font-bold flex items-center justify-center space-x-3">
                <Sparkles className="w-8 h-8 text-yellow-400" />
                <span>AMA Quiz Challenge</span>
                <Trophy className="w-8 h-8 text-yellow-400" />
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {question ? (
          <div className="w-full max-w-6xl space-y-6">
            {/* Timer Section */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <Clock className="w-6 h-6 text-white" />
                  <span className="text-2xl font-bold text-white">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <Progress 
                  value={progressPercentage} 
                  className="h-3 bg-white/20"
                />
                <div className="text-center mt-2">
                  <span className="text-sm text-white/80">
                    {timeLeft > 0 ? 'Time Remaining' : 'Time\'s Up!'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Question Section */}
            <Card className="bg-white/95 backdrop-blur-md border-0 shadow-2xl">
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <HelpCircle className="w-6 h-6 text-blue-600" />
                  <Badge variant="secondary" className="text-lg px-4 py-1">
                    Question #{question.id}
                  </Badge>
                </div>
                <CardTitle className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 leading-tight">
                  {question.question}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {question.options.map((option, index) => {
                    const isCorrect = answer && option === answer;
                    const optionLetter = String.fromCharCode(65 + index);
                    
                    return (
                      <Card 
                        key={index} 
                        className={`transition-all duration-500 transform hover:scale-105 ${
                          isCorrect 
                            ? 'bg-green-100 border-green-500 border-2 shadow-lg' 
                            : answer 
                              ? 'bg-gray-100 border-gray-300' 
                              : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                        }`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-4">
                            <div className={`
                              w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold
                              ${isCorrect 
                                ? 'bg-green-500 text-white' 
                                : answer 
                                  ? 'bg-gray-400 text-white' 
                                  : 'bg-blue-500 text-white'
                              }
                            `}>
                              {isCorrect ? <CheckCircle className="w-6 h-6" /> : optionLetter}
                            </div>
                            <span className={`text-lg md:text-xl font-medium ${
                              isCorrect ? 'text-green-800' : 'text-gray-800'
                            }`}>
                              {option}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {answer && (
                  <div className="space-y-4">
                    <Card className="bg-green-50 border-green-200 border-2">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-center space-x-2 text-green-800">
                          <CheckCircle className="w-6 h-6" />
                          <span className="text-xl font-bold">
                            Correct Answer: {answer}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {roundWinners.length > 0 && (
                      <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-xl animate-pulse">
                        <CardContent className="pt-4">
                          <div className="text-center space-y-2">
                            <div className="flex items-center justify-center space-x-2">
                              <Trophy className="w-8 h-8" />
                              <span className="text-2xl font-bold">🎉 Round Winners! 🎉</span>
                              <Trophy className="w-8 h-8" />
                            </div>
                            <div className="flex flex-wrap justify-center gap-2 mt-4">
                              {roundWinners.map((winner, index) => (
                                <div
                                  key={index}
                                  className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-lg font-bold"
                                >
                                  🏆 {winner}
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              <CardContent className="pt-8 pb-8">
                <div className="space-y-4">
                  <Users className="w-16 h-16 mx-auto text-white/80" />
                  <h2 className="text-2xl md:text-3xl font-bold">
                    Waiting for the next question...
                  </h2>
                  <p className="text-lg text-white/80">
                    Get ready to test your knowledge!
                  </p>
                  <div className="flex justify-center">
                    <div className="animate-pulse flex space-x-2">
                      <div className="w-3 h-3 bg-white/60 rounded-full"></div>
                      <div className="w-3 h-3 bg-white/60 rounded-full"></div>
                      <div className="w-3 h-3 bg-white/60 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-white/60 text-sm">
            AMA Computer College - Interactive Quiz System
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default DisplayPage;