import { NextRequest, NextResponse } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { ServerToClientEvents, ClientToServerEvents } from '../../../../types';

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | null = null;

function initializeSocket() {
  if (!io) {
    // Create HTTP server for Socket.io
    const httpServer = createServer();
    
    io = new SocketIOServer(httpServer, {
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
        io!.emit('broadcast-question', question, timer);
      });

      // Handle answer submission
      socket.on('submit-answer', (data) => {
        console.log('Answer submitted:', data);
        io!.emit('answer-submitted', data);
      });

      // Handle revealing correct answer
      socket.on('reveal-answer', (correctAnswer) => {
        console.log('Revealing correct answer:', correctAnswer);
        io!.emit('reveal-correct', correctAnswer);
      });

      // Handle ending question
      socket.on('end-question', () => {
        console.log('Ending question');
        io!.emit('question-ended');
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }
  return io;
}

export async function GET(request: NextRequest) {
  const socket = initializeSocket();
  return NextResponse.json({
    message: 'Socket.io server initialized',
    status: 'ready',
    connected: socket.engine.clientsCount
  });
}

export async function POST(request: NextRequest) {
  const socket = initializeSocket();
  return NextResponse.json({
    message: 'Socket.io server initialized',
    status: 'ready',
    connected: socket.engine.clientsCount
  });
}