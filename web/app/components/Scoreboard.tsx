'use client';

import styles from './Scoreboard.module.css';

interface ScoreboardProps {
  score: { A: number; B: number };
  timeRemaining: number;
  quarter: number;
  status: 'waiting' | 'playing' | 'finished';
  possession: 'A' | 'B';
  players: Array<{
    id: string;
    name: string;
    stats: {
      points: number;
      assists: number;
      rebounds: number;
    };
  }>;
  turnNumber?: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function Scoreboard({ 
  score, 
  timeRemaining, 
  status, 
  possession, 
  players,
  turnNumber 
}: ScoreboardProps) {
  const teamAPlayers = players.filter(p => p.id.startsWith('A'));
  const teamBPlayers = players.filter(p => p.id.startsWith('B'));

  return (
    <div className={styles.scoreboard}>
      <div className={styles.header}>
        <div className={styles.teamBlock}>
          <h2 className={styles.teamNameA}>Team A</h2>
          <div className={styles.score}>{score.A}</div>
          <div className={styles.possession}>
            {possession === 'A' ? '🔴 持球' : ''}
          </div>
        </div>
        
        <div className={styles.centerInfo}>
          <div className={styles.time}>{formatTime(Math.max(0, timeRemaining))}</div>
          <div className={styles.status}>
            {status === 'playing' ? (
              <span className={styles.live}>● 进行中</span>
            ) : status === 'finished' ? (
              <span className={styles.finished}>已结束</span>
            ) : (
              <span>等待中</span>
            )}
          </div>
          {turnNumber && (
            <div className={styles.turnNumber}>回合 {turnNumber}</div>
          )}
        </div>
        
        <div className={styles.teamBlock}>
          <h2 className={styles.teamNameB}>Team B</h2>
          <div className={styles.score}>{score.B}</div>
          <div className={styles.possession}>
            {possession === 'B' ? '🔵 持球' : ''}
          </div>
        </div>
      </div>
      
      <div className={styles.stats}>
        <div className={styles.teamStats}>
          {teamAPlayers.map(player => (
            <div key={player.id} className={styles.playerStat}>
              <span className={styles.playerName}>{player.name}</span>
              <span className={styles.playerNumbers}>
                {player.stats.points}分 {player.stats.assists}助 {player.stats.rebounds}板
              </span>
            </div>
          ))}
        </div>
        
        <div className={styles.teamStats}>
          {teamBPlayers.map(player => (
            <div key={player.id} className={styles.playerStat}>
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