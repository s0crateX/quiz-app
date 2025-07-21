'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Users, ArrowRight, Sparkles } from 'lucide-react';
import Layout from '../../components/Layout';

const JoinPage = () => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsLoading(true);
    try {
      const id = Date.now().toString();
      await fetch('/api/save-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: name.trim() }),
      });
      router.push(`/player/${encodeURIComponent(name.trim())}`);
    } catch (error) {
      console.error('Error joining quiz:', error);
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Join the Quiz">
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-red-500 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Welcome to the Quiz!
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter your name to join the interactive quiz experience
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Your Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 text-lg border-2 border-gray-200 focus:border-blue-500 transition-colors"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105"
                disabled={!name.trim() || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Joining...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5" />
                    <span>Join Quiz</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </Button>
            </form>
            
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Ready to test your knowledge? Let&apos;s get started! 🚀
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Floating elements for visual appeal */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-red-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-yellow-200 rounded-full opacity-20 animate-pulse delay-2000"></div>
        <div className="absolute bottom-40 right-10 w-18 h-18 bg-green-200 rounded-full opacity-20 animate-pulse delay-500"></div>
      </div>
    </Layout>
  );
};

export default JoinPage;