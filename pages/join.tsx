import React, { useState } from 'react';
import { useRouter } from 'next/router';

const JoinPage = () => {
  const [name, setName] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = Date.now().toString();
    await fetch('/api/save-player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name }),
    });
    router.push(`/player/${name}`);
  };

  return (
    <div>
      <h1>Join Quiz</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <button type="submit">Join</button>
      </form>
    </div>
  );
};

export default JoinPage;