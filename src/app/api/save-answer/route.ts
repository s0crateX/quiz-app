import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const answersFile = path.join(process.cwd(), 'data', 'answers.txt');

export async function POST(request: NextRequest) {
  try {
    const { questionId, player, answer, correct } = await request.json();
    
    if (!questionId || !player || !answer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newAnswer = {
      questionId,
      player,
      answer,
      correct: correct || false,
      timestamp: new Date().toISOString()
    };

    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.appendFileSync(answersFile, JSON.stringify(newAnswer) + '\n');
    return NextResponse.json(newAnswer);
  } catch (error) {
    console.error('Error saving answer:', error);
    return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 });
  }
}