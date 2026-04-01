'use client';

import styles from './Court.module.css';

interface CourtProps {
  players: Array<{
    id: string;
    name: string;
    position: { x: number; y: number };
  }>;
  ballPosition: { x: number; y: number };
  ballHolder: string | null;
}

export default function Court({ players, ballPosition, ballHolder }: CourtProps) {
  // 球场尺寸
  const COURT_WIDTH = 14;
  const COURT_HEIGHT = 15;
  const SCALE = 30; // 像素/米
  
  const width = COURT_WIDTH * SCALE;
  const height = COURT_HEIGHT * SCALE;
  
  // 篮筐位置
  const basketX = 7 * SCALE;
  const basketY = 0.5 * SCALE;
  
  // 转换坐标
  const toScreenX = (x: number) => x * SCALE;
  const toScreenY = (y: number) => height - y * SCALE;
  
  // 获取球员颜色
  const getPlayerColor = (id: string) => {
    return id.startsWith('A') ? '#ff6b6b' : '#4ecdc4';
  };
  
  // 获取球员位置
  const getPlayerPos = (id: string) => {
    const player = players.find(p => p.id === id);
    return player ? player.position : { x: 0, y: 0 };
  };
  
  // 确定球的位置（跟随持球人或使用 ballPosition）
  const ballPos = ballHolder 
    ? getPlayerPos(ballHolder)
    : ballPosition;

  return (
    <div className={styles.court}>
      <svg 
        width={width} 
        height={height} 
        className={styles.svg}
        viewBox={`0 0 ${width} ${height}`}
      >
        {/* 球场背景 */}
        <rect 
          width={width} 
          height={height} 
          fill="#d4a574"
          stroke="#8b6914"
          strokeWidth="2"
        />
        
        {/* 三分线 */}
        <path
          d={`M ${toScreenX(0)} ${toScreenY(5)} 
              Q ${toScreenX(7)} ${toScreenY(2)} ${toScreenX(14)} ${toScreenY(5)}`}
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          opacity="0.6"
        />
        
        {/* 罚球区 */}
        <rect
          x={toScreenX(4)}
          y={toScreenY(4)}
          width={6 * SCALE}
          height={4 * SCALE}
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          opacity="0.6"
        />
        
        {/* 篮筐 */}
        <circle
          cx={basketX}
          cy={basketY}
          r={8}
          fill="#ff6b6b"
          stroke="#fff"
          strokeWidth="2"
        />
        
        {/* 球员 */}
        {players.map((player) => {
          const x = toScreenX(player.position.x);
          const y = toScreenY(player.position.y);
          const isBallHolder = ballHolder === player.id;
          
          return (
            <g key={player.id} className={styles.player}>
              {/* 球员圆圈 */}
              <circle
                cx={x}
                cy={y}
                r={isBallHolder ? 14 : 10}
                fill={getPlayerColor(player.id)}
                stroke="#fff"
                strokeWidth={isBallHolder ? 3 : 2}
                className={isBallHolder ? styles.ballHolder : ''}
              />
              
              {/* 球员ID */}
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                fill="#fff"
                fontSize={isBallHolder ? 10 : 8}
                fontWeight="bold"
              >
                {player.id}
              </text>
            </g>
          );
        })}
        
        {/* 篮球 */}
        <circle
          cx={toScreenX(ballPos.x)}
          cy={toScreenY(ballPos.y)}
          r={6}
          fill="#ff9500"
          stroke="#fff"
          strokeWidth="1"
          className={styles.ball}
        />
      </svg>
      
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={`${styles.dot} ${styles.teamA}`}></span>
          <span>A队</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.dot} ${styles.teamB}`}></span>
          <span>B队</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.dot} ${styles.ball}`}></span>
          <span>篮球</span>
        </div>
      </div>
    </div>
  );
}