'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Player, Answer } from '../../types';
import socket from '../../lib/socket';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Users, 
  Trophy, 
  Trash2, 
  RefreshCw, 
  AlertTriangle,
  UserCheck,
  Crown
} from 'lucide-react';

const PlayerManager = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const [playersRes, answersRes] = await Promise.all([
        fetch('/api/players'),
        fetch('/api/answers'),
      ]);
      
      if (!playersRes.ok || !answersRes.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const playersData: Player[] = await playersRes.json();
      const answersData: Answer[] = await answersRes.json();

      const scoresMap: { [key: string]: number } = {};
      answersData.forEach(answer => {
        if (answer.correct) {
          scoresMap[answer.player] = (scoresMap[answer.player] || 0) + 1;
        }
      });

      setPlayers(playersData);
      setScores(scoresMap);
    } catch (err) {
      setError('Failed to load player data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    socket.on('update-scores', (newScores) => {
      setScores(newScores);
    });

    socket.on('new-player', (newPlayer) => {
      setPlayers(prevPlayers => [...prevPlayers, newPlayer]);
    });

    return () => {
      socket.off('update-scores');
      socket.off('new-player');
    };
  }, [fetchData]);

  const deleteAllPlayers = async () => {
    if (!window.confirm('Are you sure you want to delete all players and their data? This action cannot be undone.')) {
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/players', { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete players');
      
      await fetchData(); // Refresh data after deletion
    } catch (err) {
      setError('Failed to delete players');
    } finally {
      setIsLoading(false);
    }
  };

  // Sort players by score (highest first)
  const sortedPlayers = [...players].sort((a, b) => {
    const scoreA = scores[a.name] || 0;
    const scoreB = scores[b.name] || 0;
    return scoreB - scoreA;
  });

  const topScore = Math.max(...Object.values(scores), 0);

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-800">{players.length}</p>
                <p className="text-sm text-blue-600">Active Players</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <Trophy className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-800">{topScore}</p>
                <p className="text-sm text-green-600">Highest Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-800">
                  {Object.keys(scores).length}
                </p>
                <p className="text-sm text-purple-600">Players with Scores</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Player Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Player Management</span>
              </CardTitle>
              <CardDescription>
                Monitor active players and their performance
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={fetchData}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={deleteAllPlayers}
                variant="destructive"
                size="sm"
                disabled={isLoading || players.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No players have joined yet.</p>
              <p className="text-sm">Share the join link to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedPlayers.map((player, index) => {
                const playerScore = scores[player.name] || 0;
                const isTopPlayer = playerScore === topScore && topScore > 0;
                
                return (
                  <Card 
                    key={player.id} 
                    className={`border transition-all hover:shadow-md ${
                      isTopPlayer ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                    }`}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={index < 3 ? "default" : "secondary"}
                              className={`
                                ${index === 0 ? 'bg-yellow-500 text-white' : ''}
                                ${index === 1 ? 'bg-gray-400 text-white' : ''}
                                ${index === 2 ? 'bg-amber-600 text-white' : ''}
                              `}
                            >
                              #{index + 1}
                            </Badge>
                            {isTopPlayer && <Crown className="w-4 h-4 text-yellow-500" />}
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-gray-800">
                              {player.name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              ID: {player.id}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            <span className="text-lg font-bold text-gray-800">
                              {playerScore}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {playerScore === 1 ? 'point' : 'points'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerManager;