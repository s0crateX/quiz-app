import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <h1>Quiz Game</h1>
      <nav>
        <ul>
          <li>
            <Link href="/join">Join as Player</Link>
          </li>
          <li>
            <Link href="/master">Quiz Master</Link>
          </li>
          <li>
            <Link href="/display">Display</Link>
          </li>
          <li>
            <Link href="/scoreboard">Scoreboard</Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
