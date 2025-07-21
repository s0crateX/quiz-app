import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const playersFile = path.join(process.cwd(), 'data', 'players.txt');

export async function POST(request: NextRequest) {
  try {
    const { id, name } = await request.json();
    
    if (!id || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newPlayer = { id, name };

    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.appendFileSync(playersFile, JSON.stringify(newPlayer) + '\n');
    return NextResponse.json(newPlayer);
  } catch (error) {
    console.error('Error saving player:', error);
    return NextResponse.json({ error: 'Failed to save player' }, { status: 500 });
  }
}