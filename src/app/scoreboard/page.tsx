'use client';

import React, { useState, useEffect } from 'react';
import { Answer, Player } from '../../../types';
import socket from '../../../lib/socket';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Separator } from '../../components/ui/separator';
import { 
  Trophy, 
  Medal, 
  Crown, 
  Users, 
  Target,
  Sparkles,
  Award,
  Star
} from 'lucide-react';
import Layout from '../../components/Layout';

const ScoreboardPage = () => {
  const [scores, setScores] = useState<
    { player: Player; score: number }[]
  >([]);
  const [roundWinners, setRoundWinners] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [playersRes, answersRes] = await Promise.all([
          fetch('/api/players'),
          fetch('/api/answers'),
        ]);
        const players: Player[] = await playersRes.json();
        const answers: Answer[] = await answersRes.json();

        const scoresMap: { [key: string]: number } = {};
        answers.forEach(answer => {
          if (answer.correct) {
            // Use points value if available, otherwise default to 1 point for backward compatibility
            const pointsToAdd = answer.points !== undefined ? answer.points : 1;
            scoresMap[answer.player] = (scoresMap[answer.player] || 0) + pointsToAdd;
          }
        });

        const rankedScores = players
          .map(player => ({
            player,
            score: scoresMap[player.name] || 0,
          }))
          .sort((a, b) => b.score - a.score);

        setScores(rankedScores);
      } catch (error) {
        console.error('Error fetching scoreboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    socket.on('update-scores', (newScores: { [key: string]: number }) => {
      console.log('Received score update:', newScores);
      setScores(prevScores => {
        const updatedScores = prevScores.map(score => ({
          ...score,
          score: newScores[score.player.name] || 0,
        }));
        return updatedScores.sort((a, b) => b.score - a.score);
      });
    });

    socket.on('round-results', (winners: string[]) => {
      console.log('Received round results:', winners);
      setRoundWinners(winners);
      // Clear winners after 5 seconds to show fresh results for next round
      setTimeout(() => {
        setRoundWinners([]);
      }, 5000);
    });

    socket.on('new-player', (newPlayer: Player) => {
      setScores(prevScores => [...prevScores, { player: newPlayer, score: 0 }]);
    });

    return () => {
      socket.off('update-scores');
      socket.off('round-results');
      socket.off('new-player');
    };
  }, []);

  const topScore = scores.length > 0 ? scores[0].score : 0;
  const totalPlayers = scores.length;
  const playersWithScores = scores.filter(s => s.score > 0).length;

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <Target className="w-6 h-6 text-gray-500" />;
    }
  };

  const getRankBadgeColor = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-yellow-500 text-white';
      case 1:
        return 'bg-gray-400 text-white';
      case 2:
        return 'bg-amber-600 text-white';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <Layout title="Scoreboard">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-8 pb-8">
              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading scoreboard...</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Leaderboard">
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-0">
            <CardContent className="pt-4">
              <div className="flex items-center space-x-3">
                <Trophy className="w-10 h-10" />
                <div>
                  <p className="text-3xl font-bold">{topScore}</p>
                  <p className="text-sm opacity-90">Highest Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0">
            <CardContent className="pt-4">
              <div className="flex items-center space-x-3">
                <Users className="w-10 h-10" />
                <div>
                  <p className="text-3xl font-bold">{totalPlayers}</p>
                  <p className="text-sm opacity-90">Total Players</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-teal-600 text-white border-0">
            <CardContent className="pt-4">
              <div className="flex items-center space-x-3">
                <Star className="w-10 h-10" />
                <div>
                  <p className="text-3xl font-bold">{playersWithScores}</p>
                  <p className="text-sm opacity-90">Active Scorers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Leaderboard */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold flex items-center justify-center space-x-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <span>Leaderboard</span>
              <Sparkles className="w-8 h-8 text-purple-500" />
            </CardTitle>
            <CardDescription className="text-lg">
              Real-time quiz rankings and scores
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {scores.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No Players Yet
                </h3>
                <p className="text-gray-500">
                  Waiting for players to join the quiz...
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {scores.map(({ player, score }, index) => {
                  const isTopThree = index < 3;
                  const progressPercentage = topScore > 0 ? (score / topScore) * 100 : 0;
                  
                  return (
                    <Card 
                      key={player.id} 
                      className={`transition-all duration-300 hover:shadow-lg ${
                        index === 0 ? 'ring-2 ring-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50' :
                        index === 1 ? 'ring-2 ring-gray-300 bg-gradient-to-r from-gray-50 to-slate-50' :
                        index === 2 ? 'ring-2 ring-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50' :
                        'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Badge 
                                className={`text-lg px-3 py-1 ${getRankBadgeColor(index)}`}
                              >
                                #{index + 1}
                              </Badge>
                              {getRankIcon(index)}
                            </div>
                            
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-gray-800">
                                {player.name}
                              </h4>
                              <p className="text-sm text-gray-500">
                                Player ID: {player.id}
                              </p>
                              {isTopThree && (
                                <div className="mt-2">
                                  <Progress 
                                    value={progressPercentage} 
                                    className="h-2"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              <Trophy className="w-5 h-5 text-yellow-500" />
                              <span className="text-3xl font-bold text-gray-800">
                                {score}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {score === 1 ? 'point' : 'points'}
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

        {/* Round Winners section hidden as requested */}
      </div>
    </Layout>
  );
};

export default ScoreboardPage;