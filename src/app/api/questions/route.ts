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
    const { question, options, answer, difficulty, points } = await request.json();
    
    if (!question || !options || !answer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newQuestion = {
      id: Date.now(),
      question,
      options,
      answer,
      difficulty: difficulty || 'medium',
      points: points || 10,
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

export async function PUT(request: NextRequest) {
  try {
    const { id, question, options, answer, difficulty, points } = await request.json();
    
    if (!id || !question || !options || !answer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!fs.existsSync(questionsFile)) {
      return NextResponse.json({ error: 'No questions found' }, { status: 404 });
    }

    const data = fs.readFileSync(questionsFile, 'utf8');
    const questions = data.trim() ? data.trim().split('\n').map(line => JSON.parse(line)) : [];
    
    const questionIndex = questions.findIndex(q => q.id === id);
    if (questionIndex === -1) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Preserve existing difficulty and points if not provided
    const existingQuestion = questions[questionIndex];
    const updatedQuestion = {
      id,
      question,
      options,
      answer,
      difficulty: difficulty || existingQuestion.difficulty || 'medium',
      points: points || existingQuestion.points || 10,
    };

    questions[questionIndex] = updatedQuestion;
    fs.writeFileSync(questionsFile, questions.map(q => JSON.stringify(q)).join('\n') + '\n');
    
    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
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