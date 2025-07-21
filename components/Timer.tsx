import React, { useState, useEffect } from 'react';
import socket from '../lib/socket';

const Timer = () => {
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    socket.on('broadcast-question', (question, time) => {
      setTimer(time);
    });

    socket.on('question-ended', () => {
      setTimer(0);
    });
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  return (
    <div>
      <h2>Timer</h2>
      <p>{timer}</p>
    </div>
  );
};

export default Timer;