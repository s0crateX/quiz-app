import React, { useState, useEffect, useCallback } from 'react';
import { Player, Answer } from '../types';
import socket from '../lib/socket';

const PlayerManager = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [scores, setScores] = useState<{ [key: string]: number }>({});

  const fetchData = useCallback(async () => {
    const [playersRes, answersRes] = await Promise.all([
      fetch('/api/players'),
      fetch('/api/answers'),
    ]);
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
    if (window.confirm('Are you sure you want to delete all players and their data?')) {
      await fetch('/api/players', { method: 'DELETE' });
      fetchData(); // Refresh data after deletion
    }
  };

  return (
    <div>
      <h2>Player Management</h2>
      <button onClick={deleteAllPlayers} style={{ marginBottom: '1rem' }}>
        Delete All Players
      </button>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {players.map(player => (
            <tr key={player.id}>
              <td>{player.name}</td>
              <td>{scores[player.name] || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PlayerManager;