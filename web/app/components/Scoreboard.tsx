'use client';

import styles from './Scoreboard.module.css';

interface GameState {
  score: { A: number; B: number };
  timeRemaining: number;
  quarter: number;
  status: string;
  possession: 'A' | 'B';
  players: Array<{
    name: string;
    team: 'A' | 'B';
    stats: {
      points: number;
      assists: number;
      rebounds: number;
    };
  }>;
}

interface ScoreboardProps {
  gameState: GameState;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function Scoreboard({ gameState }: ScoreboardProps) {
  const { score, timeRemaining, quarter, status, possession, players } = gameState;
  
  const teamAPlayers = players.filter(p => p.team === 'A');
  const teamBPlayers = players.filter(p => p.team === 'B');

  return (
    <div className={styles.scoreboard}>
      <div className={styles.header}>
        <div className={styles.teamBlock}>
          <h2 className={styles.teamNameA}>A队</h2>
          <div className={styles.score}>{score.A}</div>
        </div>
        
        <div className={styles.centerInfo}>
          <div className={styles.time}>{formatTime(Math.max(0, timeRemaining))}</div>
          <div className={styles.quarter}>Q{quarter}</div>
          <div className={styles.status}>
            {status === 'playing' ? (
              <span className={styles.live}>● 进行中</span>
            ) : status === 'finished' ? (
              <span className={styles.finished}>已结束</span>
            ) : (
              <span>等待中</span>
            )}
          </div>
          <div className={styles.possession}>
            球权: {possession === 'A' ? '🔴 A队' : '🔵 B队'}
          </div>
        </div>
        
        <div className={styles.teamBlock}>
          <h2 className={styles.teamNameB}>B队</h2>
          <div className={styles.score}>{score.B}</div>
        </div>
      </div>
      
      <div className={styles.stats}>
        <div className={styles.teamStats}>
          {teamAPlayers.map(player => (
            <div key={player.name} className={styles.playerStat}>
              <span className={styles.playerName}>{player.name}</span>
              <span className={styles.playerNumbers}>
                {player.stats.points}分 {player.stats.assists}助 {player.stats.rebounds}板
              </span>
            </div>
          ))}
        </div>
        
        <div className={styles.teamStats}>
          {teamBPlayers.map(player => (
            <div key={player.name} className={styles.playerStat}>
              <span className={styles.playerName}>{player.name}</span>
              <span className={styles.playerNumbers}>
                {player.stats.points}分 {player.stats.assists}助 {player.stats.rebounds}板
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}