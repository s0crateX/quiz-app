import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';
import { ServerToClientEvents, ClientToServerEvents } from '../types';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO<ClientToServerEvents, ServerToClientEvents>;
    };
  };
};

let io: ServerIO<ClientToServerEvents, ServerToClientEvents>;

export const initSocket = (server: NetServer) => {
  if (!io) {
    console.log('Initializing Socket.io server...');
    io = new ServerIO(server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Handle question broadcasting
      socket.on('start-question', (question, timer) => {
        console.log('Broadcasting question:', question, 'Timer:', timer);
        io.emit('broadcast-question', question, timer);
      });

      // Handle answer submission
      socket.on('submit-answer', (data) => {
        console.log('Answer submitted:', data);
        io.emit('answer-submitted', data);
      });

      // Handle revealing correct answer
      socket.on('reveal-answer', (correctAnswer) => {
        console.log('Revealing correct answer:', correctAnswer);
        io.emit('reveal-correct', correctAnswer);
      });

      // Handle ending question
      socket.on('end-question', () => {
        console.log('Ending question');
        io.emit('question-ended');
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }
  return io;
};

export const getSocket = () => io;