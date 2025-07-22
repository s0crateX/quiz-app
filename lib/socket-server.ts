import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';
import { ServerToClientEvents, ClientToServerEvents, SubmittedAnswer, Question } from '../types';
import fs from 'fs';
import path from 'path';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO<ClientToServerEvents, ServerToClientEvents>;
    };
  };
};

let io: ServerIO<ClientToServerEvents, ServerToClientEvents>;
const readyPlayers: Set<string> = new Set();
const connectedPlayers: Set<string> = new Set();
const currentQuestionAnswers: Map<string, SubmittedAnswer> = new Map();
let currentQuestion: Question | null = null;

// Helper function to process and save answers with scoring
const processAndSaveAnswers = async (question: Question, correctAnswer: string) => {
  const answersFile = path.join(process.cwd(), 'data', 'answers.txt');
  const winners: string[] = [];
  const scores: { [key: string]: number } = {};
  
  try {
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Get points based on difficulty
    const pointsValue = question.points || 10; // Default to 10 if not specified

    // Process each submitted answer
    for (const [playerName, submittedAnswer] of currentQuestionAnswers) {
      const isCorrect = submittedAnswer.answer === correctAnswer;
      
      if (isCorrect) {
        winners.push(playerName);
      }

      const answerRecord = {
        questionId: question.id,
        player: playerName,
        answer: submittedAnswer.answer,
        correct: isCorrect,
        points: isCorrect ? pointsValue : 0,
        difficulty: question.difficulty || 'medium',
        timestamp: new Date().toISOString()
      };

      console.log('Saving answer record with points:', answerRecord);

      // Append to answers file
      fs.appendFileSync(answersFile, JSON.stringify(answerRecord) + '\n');
    }

    // Calculate updated scores for all players
    if (fs.existsSync(answersFile)) {
      const data = fs.readFileSync(answersFile, 'utf8');
      const allAnswers = data.trim() ? data.trim().split('\n').map(line => JSON.parse(line)) : [];
      
      // Calculate scores based on points instead of just correct count
      allAnswers.forEach(answer => {
        if (answer.correct) {
          // Use points value if available, otherwise default to 1 point for backward compatibility
          const pointsToAdd = answer.points !== undefined ? answer.points : 1;
          scores[answer.player] = (scores[answer.player] || 0) + pointsToAdd;
        }
      });
    }

    console.log('Round winners:', winners);
    console.log('Updated scores:', scores);

    // Broadcast results
    if (winners.length > 0) {
      io.emit('round-results', winners);
    }
    io.emit('update-scores', scores);

  } catch (error) {
    console.error('Error processing answers:', error);
  }
};

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
        // Reset ready players when new question starts
        readyPlayers.clear();
        // Clear previous question answers and set current question
        currentQuestionAnswers.clear();
        currentQuestion = question;
        io.emit('broadcast-question', question, timer);
        
        // Remove automatic timer-ended emission
        // The timer will be handled by individual clients
      });

      // Handle answer submission
      socket.on('submit-answer', (data) => {
        console.log('Answer submitted:', data);
        // Track connected players and store their answers
        connectedPlayers.add(data.player);
        currentQuestionAnswers.set(data.player, data);
        io.emit('answer-submitted', data);
      });

      // Handle revealing correct answer
      socket.on('reveal-answer', (correctAnswer) => {
        console.log('Revealing correct answer:', correctAnswer);
        io.emit('reveal-correct', correctAnswer);
        
        // Process and save all answers with scoring
        if (currentQuestion) {
          processAndSaveAnswers(currentQuestion, correctAnswer);
        }
      });

      // Handle ending question
      socket.on('end-question', () => {
        console.log('Ending question');
        readyPlayers.clear();
        connectedPlayers.clear();
        currentQuestionAnswers.clear();
        currentQuestion = null;
        io.emit('question-ended');
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
          io.emit('all-players-ready');
          readyPlayers.clear();
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }
  return io;
};

export const getSocket = () => io;