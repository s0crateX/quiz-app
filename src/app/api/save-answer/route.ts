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

    // Get the question to determine points
    const questionsFile = path.join(process.cwd(), 'data', 'questions.txt');
    let points = 10; // Default points
    let difficulty = 'medium'; // Default difficulty
    
    if (fs.existsSync(questionsFile)) {
      const data = fs.readFileSync(questionsFile, 'utf8');
      const questions = data.trim() ? data.trim().split('\n').map(line => JSON.parse(line)) : [];
      const question = questions.find(q => q.id === questionId);
      
      if (question) {
        points = question.points || 10;
        difficulty = question.difficulty || 'medium';
      }
    }
    
    const newAnswer = {
      questionId,
      player,
      answer,
      correct: correct || false,
      points: correct ? points : 0,
      difficulty,
      timestamp: new Date().toISOString()
    };
    
    console.log('Saving answer with points:', newAnswer);

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