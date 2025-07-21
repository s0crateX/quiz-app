import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { Question } from '../../types';

const questionsFilePath = path.join(process.cwd(), 'data', 'questions.txt');

const readQuestions = (): Question[] => {
  try {
    const fileContent = fs.readFileSync(questionsFilePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    return [];
  }
};

const writeQuestions = (questions: Question[]) => {
  fs.writeFileSync(questionsFilePath, JSON.stringify(questions, null, 2));
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const questions = readQuestions();
    res.status(200).json(questions);
  } else if (req.method === 'POST') {
    const newQuestion: Question = req.body;
    const questions = readQuestions();
    newQuestion.id = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    questions.push(newQuestion);
    writeQuestions(questions);
    res.status(201).json(newQuestion);
  } else if (req.method === 'DELETE') {
    const { id } = req.body;
    const questions = readQuestions();
    const updatedQuestions = questions.filter(q => q.id !== id);
    writeQuestions(updatedQuestions);
    res.status(200).json({ message: 'Question deleted' });
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}