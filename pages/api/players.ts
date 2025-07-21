import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { Player } from '../../types';

const playersFilePath = path.join(process.cwd(), 'data', 'players.txt');

const readPlayers = (): Player[] => {
  try {
    const fileContent = fs.readFileSync(playersFilePath, 'utf-8');
    return fileContent.trim().split('\n').map(line => JSON.parse(line));
  } catch (error) {
    return [];
  }
};

const answersFilePath = path.join(process.cwd(), 'data', 'answers.txt');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const players = readPlayers();
    res.status(200).json(players);
  } else if (req.method === 'DELETE') {
    try {
      fs.writeFileSync(playersFilePath, '');
      fs.writeFileSync(answersFilePath, '');
      res.status(200).json({ message: 'All players and answers deleted' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete data' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}