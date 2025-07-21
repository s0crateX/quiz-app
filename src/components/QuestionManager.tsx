'use client';

import React, { useState, useEffect } from 'react';
import { Question } from '../../types';
import socket from '../../lib/socket';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import {
  Plus,
  Trash2,
  Play,
  Clock,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Eye,
  StopCircle
} from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

const QuestionManager = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [answer, setAnswer] = useState('');
  const [timer, setTimer] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);

  useEffect(() => {
    fetch('/api/questions')
      .then(res => res.json())
      .then(data => setQuestions(data))
      .catch(err => setError('Failed to load questions'));

    // Listen for question broadcasts to track current question
    socket.on('broadcast-question', (question: Question) => {
      setCurrentQuestion(question);
    });

    socket.on('question-ended', () => {
      setCurrentQuestion(null);
    });

    return () => {
      socket.off('broadcast-question');
      socket.off('question-ended');
    };
  }, []);

  const addQuestion = async () => {
    if (!newQuestion.trim() || options.some(opt => !opt.trim()) || !answer.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: newQuestion.trim(), 
          options: options.map(opt => opt.trim()), 
          answer: answer.trim() 
        }),
      });
      
      if (!res.ok) throw new Error('Failed to add question');
      
      const addedQuestion = await res.json();
      setQuestions([...questions, addedQuestion]);
      
      // Reset form
      setNewQuestion('');
      setOptions(['', '', '', '']);
      setAnswer('');
    } catch (err) {
      setError('Failed to add question');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteQuestion = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    
    try {
      await fetch('/api/questions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setQuestions(questions.filter(q => q.id !== id));
    } catch (err) {
      setError('Failed to delete question');
    }
  };

  const startQuestion = (question: Question) => {
    console.log('Emitting start-question:', question, timer);
    socket.emit('start-question', question, timer);
  };

  const revealAnswer = () => {
    if (currentQuestion) {
      console.log('Revealing correct answer:', currentQuestion.answer);
      socket.emit('reveal-answer', currentQuestion.answer);
    }
  };

  const endQuestion = () => {
    console.log('Ending current question');
    socket.emit('end-question');
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Add New Question */}
      <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <Plus className="w-5 h-5" />
            <span>Add New Question</span>
          </CardTitle>
          <CardDescription>
            Create a new quiz question with multiple choice options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question" className="text-sm font-medium">
              Question
            </Label>
            <Textarea
              id="question"
              placeholder="Enter your question here..."
              value={newQuestion}
              onChange={e => setNewQuestion(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {options.map((option, index) => (
              <div key={index} className="space-y-2">
                <Label htmlFor={`option-${index}`} className="text-sm font-medium">
                  Option {String.fromCharCode(65 + index)}
                </Label>
                <Input
                  id={`option-${index}`}
                  type="text"
                  placeholder={`Enter option ${String.fromCharCode(65 + index)}`}
                  value={option}
                  onChange={e => handleOptionChange(index, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer" className="text-sm font-medium">
              Correct Answer
            </Label>
            <Input
              id="answer"
              type="text"
              placeholder="Enter the correct answer exactly as written in options"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
            />
          </div>

          <Button 
            onClick={addQuestion} 
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Adding...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Question</span>
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Timer Settings */}
      <Card className="bg-orange-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-800">
            <Clock className="w-5 h-5" />
            <span>Timer Settings</span>
          </CardTitle>
          <CardDescription>
            Set the time limit for each question (in seconds)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Label htmlFor="timer" className="text-sm font-medium whitespace-nowrap">
              Time Limit:
            </Label>
            <Input
              id="timer"
              type="number"
              min="10"
              max="300"
              value={timer}
              onChange={e => setTimer(parseInt(e.target.value) || 30)}
              className="w-24"
            />
            <span className="text-sm text-gray-600">seconds</span>
          </div>
        </CardContent>
      </Card>

      {/* Current Question Control */}
      {currentQuestion && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <Play className="w-5 h-5" />
              <span>Current Question Control</span>
            </CardTitle>
            <CardDescription>
              Control the currently active question
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-medium text-gray-800 mb-2">
                Question #{currentQuestion.id}: {currentQuestion.question}
              </h4>
              <p className="text-sm text-gray-600">
                Correct Answer: <span className="font-semibold text-green-600">{currentQuestion.answer}</span>
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={revealAnswer}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Eye className="w-4 h-4 mr-2" />
                Show Correct Answer
              </Button>
              <Button
                onClick={endQuestion}
                variant="destructive"
              >
                <StopCircle className="w-4 h-4 mr-2" />
                End Question
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5" />
            <span>Quiz Questions</span>
            <Badge variant="secondary" className="ml-auto">
              {questions.length} questions
            </Badge>
          </CardTitle>
          <CardDescription>
            Manage your quiz questions and start quiz sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No questions added yet. Create your first question above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, index) => (
                <Card key={q.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between space-x-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            Q{index + 1}
                          </Badge>
                          <h4 className="font-medium text-gray-800 line-clamp-2">
                            {q.question}
                          </h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                          {q.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center space-x-2">
                              <span className="font-mono text-xs bg-gray-100 px-1 rounded">
                                {String.fromCharCode(65 + optIndex)}
                              </span>
                              <span className={option === q.answer ? 'font-semibold text-green-600' : ''}>
                                {option}
                                {option === q.answer && <CheckCircle className="w-3 h-3 inline ml-1" />}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <Button
                          onClick={() => startQuestion(q)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start
                        </Button>
                        <Button
                          onClick={() => deleteQuestion(q.id)}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionManager;