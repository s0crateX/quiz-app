import { Server as HttpServer } from 'http';
import { Socket } from 'net';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import {
  MySocket,
  MySocketServer,
  Answer,
  Question,
  SubmittedAnswer,
} from '../../types';
import fs from 'fs';
import path from 'path';

const questionsFilePath = path.join(process.cwd(), 'data', 'questions.txt');
const answersFilePath = path.join(process.cwd(), 'data', 'answers.txt');

let currentRoundAnswers: SubmittedAnswer[] = [];

const readQuestions = (): Question[] => {
  try {
    const fileContent = fs.readFileSync(questionsFilePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    return [];
  }
};

const readAnswers = (): Answer[] => {
  try {
    const fileContent = fs.readFileSync(answersFilePath, 'utf-8');
    return fileContent.trim().split('\n').map(line => JSON.parse(line));
  } catch (error) {
    return [];
  }
};

const calculateScores = (answers: Answer[]): { [key: string]: number } => {
  const scores: { [key: string]: number } = {};
  answers.forEach(answer => {
    if (answer.correct) {
      scores[answer.player] = (scores[answer.player] || 0) + 1;
    }
  });
  return scores;
};

export type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: HttpServer & {
      io: MySocketServer;
    };
  };
};

const SocketHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    console.log('Socket is initializing');
    const httpServer: HttpServer = res.socket.server;
    const io = new SocketIOServer(httpServer, {
      path: '/api/socket',
    });
    res.socket.server.io = io;

    io.on('connection', (socket: MySocket) => {
      console.log('a user connected');

      socket.on('disconnect', () => {
        console.log('user disconnected');
      });

      socket.on('start-question', (question: Question, timer: number) => {
        console.log('Received start-question:', question, timer);
        currentRoundAnswers = [];
        io.emit('broadcast-question', question, timer);
        io.emit('round-results', []); // Clear previous round winners

        setTimeout(() => {
          const questions = readQuestions();
          const currentQuestion = questions.find(q => q.id === question.id);
          if (!currentQuestion) return;

          const winners: string[] = [];
          const roundAnswersToSave: Answer[] = [];

          currentRoundAnswers.forEach(submittedAnswer => {
            const isCorrect = currentQuestion.answer === submittedAnswer.answer;
            if (isCorrect) {
              winners.push(submittedAnswer.player);
            }
            roundAnswersToSave.push({ ...submittedAnswer, correct: isCorrect });
          });

          if (roundAnswersToSave.length > 0) {
            const answerData = roundAnswersToSave.map(a => JSON.stringify(a)).join('\n');
            fs.appendFileSync(answersFilePath, answerData + '\n');
          }

          const allAnswers = readAnswers();
          const scores = calculateScores(allAnswers);
          io.emit('update-scores', scores);
          io.emit('round-results', winners);
          io.emit('question-ended');
          io.emit('reveal-correct', currentQuestion.answer);
        }, timer * 1000);
      });

      socket.on('submit-answer', (answer: SubmittedAnswer) => {
        currentRoundAnswers.push(answer);
      });
    });
  }
  res.end();
};

export default SocketHandler;