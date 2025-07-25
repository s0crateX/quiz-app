import { Server as SocketIOServer, Socket } from 'socket.io';

export interface Question {
  id: number;
  question: string;
  options: string[];
  answer: string;
  difficulty?: string;
  points?: number;
}

export interface Player {
  id: string;
  name: string;
}

export interface Answer {
  questionId: number;
  player: string;
  answer: string;
  correct: boolean;
  points?: number;
  difficulty?: string;
  timestamp?: string;
}

export interface SubmittedAnswer {
  questionId: number;
  player: string;
  answer: string;
}

export interface ServerToClientEvents {
  'broadcast-question': (question: Question, timer: number) => void;
  'question-ended': () => void;
  'reveal-correct': (answer: string) => void;
  'update-scores': (scores: { [key:string]: number }) => void;
  'round-results': (winners: string[]) => void;
  'new-player': (player: Player) => void;
  'answer-submitted': (data: SubmittedAnswer) => void;
  'timer-ended': () => void;
  'all-players-ready': () => void;
}

export interface ClientToServerEvents {
  'start-question': (question: Question, timer: number) => void;
  'submit-answer': (answer: SubmittedAnswer) => void;
  'reveal-answer': (correctAnswer: string) => void;
  'end-question': () => void;
  'player-ready': (playerName: string) => void;
}

export type MySocket = Socket<ClientToServerEvents, ServerToClientEvents>;
export type MySocketServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;