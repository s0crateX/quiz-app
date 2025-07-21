import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const answersFile = path.join(process.cwd(), 'data', 'answers.txt');

export async function GET() {
  try {
    if (!fs.existsSync(answersFile)) {
      return NextResponse.json([]);
    }
    
    const data = fs.readFileSync(answersFile, 'utf8');
    const answers = data.trim() ? data.trim().split('\n').map(line => JSON.parse(line)) : [];
    return NextResponse.json(answers);
  } catch (error) {
    console.error('Error reading answers:', error);
    return NextResponse.json({ error: 'Failed to read answers' }, { status: 500 });
  }
}