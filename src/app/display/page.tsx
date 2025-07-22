'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '../../components/ui/dialog';

const DisplayPage = () => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [roundWinners, setRoundWinners] = useState<string[]>([]);
  const [showWinnersDialog, setShowWinnersDialog] = useState(false);
  const [showSoundNotification, setShowSoundNotification] = useState(true);
  
  // Audio reference for timer sound
  const timerAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Auto-hide sound notification after 10 seconds
  useEffect(() => {
    if (showSoundNotification) {
      const timer = setTimeout(() => {
        setShowSoundNotification(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [showSoundNotification]);

  useEffect(() => {
    socket.on('broadcast-question', (q: Question, timer: number) => {
      console.log('Received broadcast-question:', q);
      // Reset audio if it's playing
      try {
        if (timerAudioRef.current) {
          timerAudioRef.current.pause();
          timerAudioRef.current.currentTime = 0;
        }
      } catch (err) {
        console.warn('Error resetting audio:', err);
      }
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
      setShowWinnersDialog(true);
      // Close dialog after 8 seconds
      setTimeout(() => {
        setShowWinnersDialog(false);
        setRoundWinners([]);
      }, 8000);
    });

    socket.on('all-players-ready', () => {
      console.log('All players ready, resetting display screen');
      // Reset audio if it's playing
      try {
        if (timerAudioRef.current) {
          timerAudioRef.current.pause();
          timerAudioRef.current.currentTime = 0;
        }
      } catch (err) {
        console.warn('Error resetting audio:', err);
      }
      setQuestion(null);
      setAnswer('');
      setTimeLeft(0);
      setTotalTime(0);
    });

    socket.on('question-ended', () => {
      // Reset audio if it's playing
      try {
        if (timerAudioRef.current) {
          timerAudioRef.current.pause();
          timerAudioRef.current.currentTime = 0;
        }
      } catch (err) {
        console.warn('Error resetting audio:', err);
      }
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

  // Initialize audio on component mount - with lazy loading to avoid autoplay policy issues
  useEffect(() => {
    // We'll create the audio element only when needed to avoid autoplay policy issues
    // This is a common workaround for the "play() failed because the user didn't interact with the document first" error
    const initAudio = () => {
      if (!timerAudioRef.current) {
        // Create new audio element
        const audio = new Audio();
        
        // Add event listeners for debugging
        audio.addEventListener('canplaythrough', () => {
          console.log('Audio loaded and can play through without buffering');
        });
        
        audio.addEventListener('error', (e) => {
          console.error('Audio loading error:', e);
        });
        
        // Set properties
        audio.src = '/assets/sounds/timer.mp3';
        audio.volume = 0.8;
        audio.preload = 'auto';
        
        // Store the audio element
        timerAudioRef.current = audio;
        
        // Force load the audio file
        audio.load();
      }
    };

    // Add event listeners to initialize audio after user interaction
    const handleUserInteraction = () => {
      initAudio();
      // Remove the event listeners once audio is initialized
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    // Add event listeners for user interaction
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    return () => {
      // Clean up event listeners
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      
      // Clean up audio safely
      try {
        if (timerAudioRef.current) {
          timerAudioRef.current.pause();
          timerAudioRef.current = null;
        }
      } catch (err) {
        console.warn('Error cleaning up audio:', err);
      }
    };
  }, []);

  // Update timer countdown
  useEffect(() => {
    if (timeLeft > 0 && question && !answer) {
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = Math.max(0, prev - 1);
          // Play timer sound at 4 seconds to ensure it's heard when the timer shows 4 seconds
          if (newTime === 4) {
            try {
              // Only attempt to play if audio element exists
              if (timerAudioRef.current) {
                // Reset audio to beginning and play immediately
                timerAudioRef.current.currentTime = 0;
                // Use Promise with better error handling
                timerAudioRef.current.play()
                  .catch(err => {
                    console.warn('Browser prevented audio playback:', err.message);
                    // Don't show error in console for autoplay policy issues as it's expected
                    // until user interacts with the page
                  });
              }
            } catch (err) {
              console.error('Error with timer sound:', err);
            }
          }
          return newTime;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timeLeft, question, answer]);

  const progressPercentage = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  // Time is considered critical at 4 seconds or less, matching the audio cue timing
  // This ensures visual and audio alerts are perfectly synchronized
  const isTimeCritical = timeLeft <= 4 && timeLeft > 0 && question;
  const isTimeUp = timeLeft === 0 && question;

  // Function to manually initialize audio
  const handleEnableSound = () => {
    try {
      // Hide notification
      setShowSoundNotification(false);
      
      // Initialize audio
      if (!timerAudioRef.current) {
        // Create new audio element
        const audio = new Audio();
        audio.src = '/assets/sounds/timer.mp3';
        audio.volume = 0.8;
        audio.preload = 'auto';
        
        // Store the audio element
        timerAudioRef.current = audio;
        
        // Force load the audio file
        audio.load();
        
        // Play and immediately pause to engage with audio API
        audio.play().then(() => {
          audio.pause();
          audio.currentTime = 0;
          console.log('Sound enabled successfully');
          
          // Show temporary success message
          const successMsg = document.createElement('div');
          successMsg.className = 'fixed top-4 right-4 bg-green-100 text-green-800 px-4 py-2 rounded-full shadow-lg z-50 animate-fade-in';
          successMsg.textContent = '✓ Sound Enabled';
          document.body.appendChild(successMsg);
          
          // Remove success message after 2 seconds
          setTimeout(() => {
            if (document.body.contains(successMsg)) {
              document.body.removeChild(successMsg);
            }
          }, 2000);
          
        }).catch(err => {
          console.warn('Could not enable sound automatically:', err);
        });
      } else {
        // If audio already exists, try to play and pause it
        timerAudioRef.current.play().then(() => {
          timerAudioRef.current!.pause();
          timerAudioRef.current!.currentTime = 0;
          console.log('Sound enabled successfully');
          
          // Show temporary success message
          const successMsg = document.createElement('div');
          successMsg.className = 'fixed top-4 right-4 bg-green-100 text-green-800 px-4 py-2 rounded-full shadow-lg z-50 animate-fade-in';
          successMsg.textContent = '✓ Sound Enabled';
          document.body.appendChild(successMsg);
          
          // Remove success message after 2 seconds
          setTimeout(() => {
            if (document.body.contains(successMsg)) {
              document.body.removeChild(successMsg);
            }
          }, 2000);
          
        }).catch(err => {
          console.warn('Could not enable sound:', err);
        });
      }
    } catch (err) {
      console.error('Error enabling sound:', err);
    }
  };

  return (
    <Layout showLogo={false} className="bg-gradient-to-br from-blue-900 via-purple-900 to-red-900">
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        {/* Sound enable button - fixed position */}
        <button 
          onClick={handleEnableSound}
          className="fixed top-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-full shadow-lg flex items-center space-x-1 text-sm z-50 transition-all duration-200 hover:scale-105"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
          </svg>
          <span>Enable Sound</span>
        </button>
        
        {/* Sound notification */}
        {showSoundNotification && (
          <div className="fixed top-16 right-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 rounded shadow-md max-w-xs animate-fade-in z-50">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">Click "Enable Sound" button to activate timer sounds</p>
                <button 
                  onClick={() => setShowSoundNotification(false)} 
                  className="text-xs text-yellow-800 font-medium hover:text-yellow-900 mt-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
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
            <Card className={`transition-all duration-300 ${isTimeUp ? 'bg-red-50/90 border-red-200' : isTimeCritical ? 'bg-yellow-50/90 border-yellow-200 animate-pulse' : 'bg-blue-50/90 border-blue-200'}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <Clock className={`w-6 h-6 ${isTimeUp ? 'text-red-600' : isTimeCritical ? 'text-yellow-600 animate-pulse transition-all duration-300' : 'text-blue-600'}`} />
                  <span className={`text-3xl font-bold ${isTimeUp ? 'text-red-600' : isTimeCritical ? 'text-yellow-600 animate-pulse transition-all duration-300' : 'text-blue-600'}`}>
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <Progress 
                  value={progressPercentage} 
                  className={`h-3 ${isTimeUp ? 'bg-red-200' : isTimeCritical ? 'bg-yellow-200 transition-colors duration-300' : 'bg-blue-200'}`}
                  indicatorClassName={isTimeUp ? 'bg-red-600' : isTimeCritical ? 'bg-yellow-600' : undefined}
                />
                <div className="text-center mt-2">
                  <span className={`text-sm font-medium ${isTimeUp ? 'text-red-600' : isTimeCritical ? 'text-yellow-600 animate-pulse transition-all duration-300' : 'text-gray-700'}`}>
                    {timeLeft > 0 ? (isTimeCritical ? 'Critical Time!' : 'Time Remaining') : 'Time\'s Up!'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Question Section */}
            <Card className="bg-white/95 backdrop-blur-md border-0 shadow-2xl">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 leading-tight">
                  {question.question}
                </CardTitle>
                <div className="flex items-center justify-center space-x-3 mt-2">
                  <Badge variant="outline" className={`px-3 py-1 ${question.difficulty?.toLowerCase() === 'easy' ? 'bg-green-100 text-green-800 border-green-200' : question.difficulty?.toLowerCase() === 'medium' ? 'bg-blue-100 text-blue-800 border-blue-200' : question.difficulty?.toLowerCase() === 'hard' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-purple-100 text-purple-800 border-purple-200'}`}>
                    {question.difficulty?.toLowerCase() === 'easy' ? 'Easy' : question.difficulty?.toLowerCase() === 'medium' ? 'Medium' : question.difficulty?.toLowerCase() === 'hard' ? 'Hard' : 'Medium'}
                  </Badge>
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 px-3 py-1">
                    {question.points || 10} Points
                  </Badge>
                </div>
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
                            <span className={`text-xl md:text-2xl lg:text-3xl font-medium ${
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

      {/* Round Winners Dialog */}
      <Dialog open={showWinnersDialog} onOpenChange={setShowWinnersDialog}>
        <DialogContent className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-3">
              <Trophy className="w-6 h-6" />
              🎉 Player Answered Correctly! 🎉
              <Trophy className="w-6 h-6" />
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap justify-center gap-3 mt-4 p-4">
            {roundWinners.map((winner, index) => (
              <div
                key={index}
                className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full text-xl font-bold animate-bounce"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                🏆 {winner}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default DisplayPage;