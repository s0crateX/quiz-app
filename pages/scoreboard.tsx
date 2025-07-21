import React, { useState, useEffect } from 'react';
import { Answer, Player } from '../types';
import socket from '../lib/socket';

const ScoreboardPage = () => {
  const [scores, setScores] = useState<
    { player: Player; score: number }[]
  >([]);
  const [roundWinners, setRoundWinners] = useState<string[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const [playersRes, answersRes] = await Promise.all([
        fetch('/api/players'),
        fetch('/api/answers'),
      ]);
      const players: Player[] = await playersRes.json();
      const answers: Answer[] = await answersRes.json();

      const scoresMap: { [key: string]: number } = {};
      answers.forEach(answer => {
        if (answer.correct) {
          scoresMap[answer.player] = (scoresMap[answer.player] || 0) + 1;
        }
      });

      const rankedScores = players
        .map(player => ({
          player,
          score: scoresMap[player.name] || 0,
        }))
        .sort((a, b) => b.score - a.score);

      setScores(rankedScores);
    };

    fetchInitialData();

    socket.on('update-scores', newScores => {
      setScores(prevScores => {
        const updatedScores = prevScores.map(score => ({
          ...score,
          score: newScores[score.player.name] || 0,
        }));
        return updatedScores.sort((a, b) => b.score - a.score);
      });
    });

    socket.on('round-results', winners => {
      setRoundWinners(winners);
    });

    socket.on('new-player', (newPlayer) => {
      setScores(prevScores => [...prevScores, { player: newPlayer, score: 0 }]);
    });

    return () => {
      socket.off('update-scores');
      socket.off('round-results');
      socket.off('new-player');
    };
  }, []);

  return (
    <div>
      <h1>Scoreboard</h1>
      <ol>
        {scores.map(({ player, score }) => (
          <li key={player.id}>
            {player.name}: {score}
          </li>
        ))}
      </ol>
      <h2>Round Winners</h2>
      <ul>
        {roundWinners.map(winner => (
          <li key={winner}>{winner}</li>
        ))}
      </ul>
    </div>
  );
};

export default ScoreboardPage;