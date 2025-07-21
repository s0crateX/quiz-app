import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const playersFile = path.join(process.cwd(), 'data', 'players.txt');

export async function GET() {
  try {
    if (!fs.existsSync(playersFile)) {
      return NextResponse.json([]);
    }
    
    const data = fs.readFileSync(playersFile, 'utf8');
    const players = data.trim() ? data.trim().split('\n').map(line => JSON.parse(line)) : [];
    return NextResponse.json(players);
  } catch (error) {
    console.error('Error reading players:', error);
    return NextResponse.json({ error: 'Failed to read players' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    // Clear all players
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(playersFile, '');
    
    // Also clear answers when clearing players
    const answersFile = path.join(process.cwd(), 'data', 'answers.txt');
    fs.writeFileSync(answersFile, '');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing players:', error);
    return NextResponse.json({ error: 'Failed to clear players' }, { status: 500 });
  }
}