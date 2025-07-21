import React, { useState, useEffect } from 'react';
import socket from '../../lib/socket';
import { Question } from '../../types';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

const Timer = () => {
  const [timer, setTimer] = useState(0);
  const [initialTime, setInitialTime] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    socket.on('broadcast-question', (question: Question, time: number) => {
      setTimer(time);
      setInitialTime(time);
      setIsActive(true);
    });

    socket.on('question-ended', () => {
      setTimer(0);
      setInitialTime(0);
      setIsActive(false);
    });

    return () => {
      socket.off('broadcast-question');
      socket.off('question-ended');
    };
  }, []);

  useEffect(() => {
    if (timer > 0 && isActive) {
      const interval = setInterval(() => {
        setTimer(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            setIsActive(false);
          }
          return Math.max(0, newTime);
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer, isActive]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (initialTime === 0) return 0;
    return ((initialTime - timer) / initialTime) * 100;
  };

  const getTimerColor = () => {
    if (timer === 0) return 'text-gray-500';
    if (timer <= 10) return 'text-red-600';
    if (timer <= 30) return 'text-orange-600';
    return 'text-green-600';
  };

  const getProgressColor = () => {
    if (timer === 0) return 'bg-gray-400';
    if (timer <= 10) return 'bg-red-500';
    if (timer <= 30) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getBadgeVariant = () => {
    if (timer === 0) return 'secondary';
    if (timer <= 10) return 'destructive';
    return 'default';
  };

  const getIcon = () => {
    if (timer === 0 && !isActive) return <CheckCircle className="w-5 h-5" />;
    if (timer <= 10 && timer > 0) return <AlertTriangle className="w-5 h-5" />;
    return <Clock className="w-5 h-5" />;
  };

  const getStatusText = () => {
    if (timer === 0 && !isActive) return 'Waiting';
    if (timer === 0 && isActive) return 'Time\'s Up!';
    return 'Time Remaining';
  };

  return (
    <Card className={`transition-all duration-300 ${
      timer <= 10 && timer > 0 ? 'ring-2 ring-red-400 shadow-lg' : 'shadow-md'
    }`}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getIcon()}
            <span className="text-sm font-medium text-gray-700">
              {getStatusText()}
            </span>
          </div>
          <Badge variant={getBadgeVariant()} className="text-sm">
            {timer > 0 ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        
        <div className="text-center mb-3">
          <div className={`text-4xl font-bold font-mono ${getTimerColor()} transition-colors duration-300`}>
            {formatTime(timer)}
          </div>
        </div>

        {initialTime > 0 && (
          <div className="space-y-2">
            <Progress 
              value={getProgressPercentage()} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0:00</span>
              <span>{formatTime(initialTime)}</span>
            </div>
          </div>
        )}

        {timer <= 10 && timer > 0 && (
          <div className="mt-3 text-center">
            <span className="text-sm text-red-600 font-medium animate-pulse">
              ⚠️ Hurry up! Time is running out!
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Timer;