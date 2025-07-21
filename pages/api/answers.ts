import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { Answer } from '../../types';

const answersFilePath = path.join(process.cwd(), 'data', 'answers.txt');

const readAnswers = (): Answer[] => {
  try {
    const fileContent = fs.readFileSync(answersFilePath, 'utf-8');
    return fileContent.trim().split('\n').map(line => JSON.parse(line));
  } catch (error) {
    return [];
  }
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const answers = readAnswers();
    res.status(200).json(answers);
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}