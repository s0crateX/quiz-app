import React from 'react';
import QuestionManager from '../components/QuestionManager';
import PlayerManager from '../components/PlayerManager';

const MasterPage = () => {
  return (
    <div>
      <h1>Quiz Master</h1>
      <QuestionManager />
      <PlayerManager />
    </div>
  );
};

export default MasterPage;