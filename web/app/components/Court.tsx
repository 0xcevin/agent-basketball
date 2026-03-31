'use client';

import styles from './Court.module.css';

interface Position {
  x: number;
  y: number;
}

interface Player {
  id: string;
  name: string;
  team: 'A' | 'B';
  position: Position;
  stats: {
    points: number;
  };
}

interface GameState {
  players: Player[];
  ballPosition: Position;
  possession: 'A' | 'B';
}

interface CourtProps {
  gameState: GameState;
}

const COURT_WIDTH = 280;
const COURT_HEIGHT = 300;
const SCALE = 20; // 14m * 15m court

export default function Court({ gameState }: CourtProps) {
  const { players, ballPosition, possession } = gameState;

  const scaleX = (x: number) => (x / 14) * COURT_WIDTH;
  const scaleY = (y: number) => (y / 15) * COURT_HEIGHT;

  return (
    <div className={styles.court}>
      <svg
        width={COURT_WIDTH}
        height={COURT_HEIGHT}
        viewBox={`0 0 ${COURT_WIDTH} ${COURT_HEIGHT}`}
        className={styles.svg}
      >
        {/* Court background */}
        <rect
          x="0"
          y="0"
          width={COURT_WIDTH}
          height={COURT_HEIGHT}
          fill="#d4a574"
          stroke="#8b6914"
          strokeWidth="3"
        />
        
        {/* Key area */}
        <rect
          x={COURT_WIDTH * 0.25}
          y="0"
          width={COURT_WIDTH * 0.5}
          height={COURT_HEIGHT * 0.3}
          fill="none"
          stroke="#8b6914"
          strokeWidth="2"
        />
        
        {/* Three-point line arc */}
        <path
          d={`M ${COURT_WIDTH * 0.1} 0 
              A ${COURT_WIDTH * 0.4} ${COURT_WIDTH * 0.4} 0 0 1 ${COURT_WIDTH * 0.9} 0`}
          fill="none"
          stroke="#8b6914"
          strokeWidth="2"
        />
        
        {/* Basket */}
        <circle
          cx={COURT_WIDTH / 2}
          cy={COURT_HEIGHT * 0.08}
          r="8"
          fill="#ff6b6b"
          stroke="#fff"
          strokeWidth="2"
        />
        
        {/* Center line */}
        <line
          x1="0"
          y1={COURT_HEIGHT}
          x2={COURT_WIDTH}
          y2={COURT_HEIGHT}
          stroke="#8b6914"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
        
        {/* Ball */}
        <circle
          cx={scaleX(ballPosition.x)}
          cy={scaleY(ballPosition.y)}
          r="6"
          fill="#ff9500"
          stroke="#fff"
          strokeWidth="2"
          className={styles.ball}
        />
        
        {/* Players */}
        {players.map((player) => (
          <g key={player.id}>
            <circle
              cx={scaleX(player.position.x)}
              cy={scaleY(player.position.y)}
              r="10"
              fill={player.team === 'A' ? '#ff6b6b' : '#4ecdc4'}
              stroke="#fff"
              strokeWidth={possession === player.team ? 3 : 2}
              className={styles.player}
            />
            <text
              x={scaleX(player.position.x)}
              y={scaleY(player.position.y) + 4}
              textAnchor="middle"
              fill="#fff"
              fontSize="10"
              fontWeight="bold"
            >
              {player.name.slice(0, 2)}
            </text>
            <text
              x={scaleX(player.position.x)}
              y={scaleY(player.position.y) - 15}
              textAnchor="middle"
              fill="#fff"
              fontSize="9"
            >
              {player.stats.points}分
            </text>
          </g>
        ))}
      </svg>
      
      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={`${styles.dot} ${styles.teamA}`}></span>
          <span>A队 (红)</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.dot} ${styles.teamB}`}></span>
          <span>B队 (蓝)</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.dot} ${styles.ball}`}></span>
          <span>篮球</span>
        </div>
      </div>
    </div>
  );
}