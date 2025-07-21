import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const questionsFile = path.join(process.cwd(), 'data', 'questions.txt');

export async function GET() {
  try {
    if (!fs.existsSync(questionsFile)) {
      return NextResponse.json([]);
    }
    
    const data = fs.readFileSync(questionsFile, 'utf8');
    const questions = data.trim() ? data.trim().split('\n').map(line => JSON.parse(line)) : [];
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error reading questions:', error);
    return NextResponse.json({ error: 'Failed to read questions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { question, options, answer } = await request.json();
    
    if (!question || !options || !answer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newQuestion = {
      id: Date.now(),
      question,
      options,
      answer,
    };

    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.appendFileSync(questionsFile, JSON.stringify(newQuestion) + '\n');
    return NextResponse.json(newQuestion);
  } catch (error) {
    console.error('Error adding question:', error);
    return NextResponse.json({ error: 'Failed to add question' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    if (!fs.existsSync(questionsFile)) {
      return NextResponse.json({ error: 'No questions found' }, { status: 404 });
    }

    const data = fs.readFileSync(questionsFile, 'utf8');
    const questions = data.trim() ? data.trim().split('\n').map(line => JSON.parse(line)) : [];
    const filteredQuestions = questions.filter(q => q.id !== id);

    fs.writeFileSync(questionsFile, filteredQuestions.map(q => JSON.stringify(q)).join('\n') + '\n');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}