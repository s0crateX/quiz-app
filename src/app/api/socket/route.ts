import { NextRequest, NextResponse } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { ServerToClientEvents, ClientToServerEvents } from '../../../../types';

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | null = null;
const readyPlayers: Set<string> = new Set();
const connectedPlayers: Set<string> = new Set();

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
        // Reset ready players when new question starts
        readyPlayers.clear();
        io!.emit('broadcast-question', question, timer);
        
        // Remove automatic timer-ended emission
        // The timer will be handled by individual clients
      });

      // Handle answer submission
      socket.on('submit-answer', (data) => {
        console.log('Answer submitted:', data);
        // Track connected players
        connectedPlayers.add(data.player);
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
        readyPlayers.clear();
        connectedPlayers.clear();
        io!.emit('question-ended');
      });

      // Handle player ready
      socket.on('player-ready', (playerName) => {
        console.log('Player ready:', playerName);
        readyPlayers.add(playerName);
        connectedPlayers.add(playerName);
        
        console.log(`Ready players: ${readyPlayers.size}/${connectedPlayers.size}`);
        console.log('Ready players:', Array.from(readyPlayers));
        console.log('Connected players:', Array.from(connectedPlayers));
        
        // Check if all connected players are ready
        if (readyPlayers.size >= connectedPlayers.size && connectedPlayers.size > 0) {
          console.log('All players are ready! Resetting screens...');
          io!.emit('all-players-ready');
          readyPlayers.clear();
        }
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