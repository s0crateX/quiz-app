import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const answersFilePath = path.join(process.cwd(), 'data', 'answers.txt');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const answerData = JSON.stringify(req.body);
    fs.appendFileSync(answersFilePath, answerData + '\n');
    res.status(200).json({ message: 'Answer saved' });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}