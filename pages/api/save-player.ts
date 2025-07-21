import type { NextApiRequest } from 'next';
import fs from 'fs';
import path from 'path';
import { NextApiResponseServerIO } from './socket';
import { Player } from '../../types';

const playersFilePath = path.join(process.cwd(), 'data', 'players.txt');

export default function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (req.method === 'POST') {
    const { id, name } = req.body;
    const newPlayer: Player = { id, name };
    const playerData = JSON.stringify(newPlayer);
    fs.appendFileSync(playersFilePath, playerData + '\n');

    res.socket.server.io.emit('new-player', newPlayer);

    res.status(200).json({ message: 'Player saved' });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}