'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './page.module.css';
import Scoreboard from './components/Scoreboard';
import Court from './components/Court';
import GameLog from './components/GameLog';

// API 基础 URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface GameState {
  score: { A: number; B: number };
  timeRemaining: number;
  quarter: number;
  status: 'waiting' | 'playing' | 'finished';
  possession: 'A' | 'B';
  ballPosition: { x: number; y: number };
  ballHolder: string | null;
  players: Array<{
    id: string;
    name: string;
    position: { x: number; y: number };
    stats: { points: number; assists: number; rebounds: number };
  }>;
  logs: string[];
  turnNumber: number;
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameId, setGameId] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // 创建游戏
  const createGame = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/game?action=create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamA: {
            name: 'team-ai',
            runtime: 'node',
            entrypoint: 'index.js',
          },
          teamB: {
            name: 'team-ai',
            runtime: 'node',
            entrypoint: 'index.js',
          },
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setGameId(data.gameId);
        setLogs([`游戏创建成功: ${data.gameId}`]);
        return data.gameId;
      }
    } catch (error) {
      console.error('创建游戏失败:', error);
      setLogs(prev => [...prev, '创建游戏失败']);
    }
  }, []);

  // 开始游戏
  const startGame = useCallback(async (gid: string) => {
    try {
      const response = await fetch(`${API_URL}/game?action=start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: gid }),
      });
      
      const data = await response.json();
      if (data.success) {
        setGameState(data.state);
        setLogs(data.state.logs || []);
      }
    } catch (error) {
      console.error('开始游戏失败:', error);
    }
  }, []);

  // 执行回合
  const runTurn = useCallback(async () => {
    if (!gameId || !gameState || gameState.status === 'finished') return;
    
    try {
      const response = await fetch(`${API_URL}/game?action=turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId }),
      });
      
      const data = await response.json();
      if (data.success) {
        setGameState(data.state);
        setLogs(data.state.logs || []);
        
        if (data.state.status === 'finished') {
          setIsRunning(false);
          setAutoPlay(false);
        }
      }
    } catch (error) {
      console.error('执行回合失败:', error);
    }
  }, [gameId, gameState]);

  // 自动播放
  useEffect(() => {
    if (!autoPlay || !isRunning) return;
    
    const interval = setInterval(() => {
      runTurn();
    }, 2000);
    
    return () => clearInterval(interval);
  }, [autoPlay, isRunning, runTurn]);

  // 初始化并开始游戏
  const handleStart = async () => {
    setIsRunning(true);
    const gid = await createGame();
    if (gid) {
      await startGame(gid);
    }
  };

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>🏀 Agent Basketball 3v3</h1>
      
      <div className={styles.controls}>
        {!isRunning ? (
          <button className={styles.btnPrimary} onClick={handleStart}>
            开始比赛
          </button>
        ) : (
          <>
            <button 
              className={styles.btnPrimary} 
              onClick={runTurn}
              disabled={gameState?.status === 'finished'}
            >
              下一回合
            </button>
            <button 
              className={styles.btnSecondary}
              onClick={() => setAutoPlay(!autoPlay)}
            >
              {autoPlay ? '⏸ 暂停' : '▶ 自动'}
            </button>
            <button 
              className={styles.btnSecondary}
              onClick={() => {
                setIsRunning(false);
                setAutoPlay(false);
                setGameState(null);
                setGameId('');
              }}
            >
              重置
            </button>
          </>
        )}
      </div>

      {gameState && (
        <div className={styles.gameContainer}>
          <Scoreboard 
            score={gameState.score}
            timeRemaining={gameState.timeRemaining}
            quarter={gameState.quarter}
            status={gameState.status}
            possession={gameState.possession}
            players={gameState.players}
            turnNumber={gameState.turnNumber}
          />
          
          <div className={styles.courtWrapper}>
            <Court 
              players={gameState.players}
              ballPosition={gameState.ballPosition}
              ballHolder={gameState.ballHolder}
            />
          </div>
          
          <GameLog logs={logs} />
        </div>
      )}
      
      {!gameState && (
        <div className={styles.info}>
          <h3>🎮 游戏说明</h3>
          <p>• 两个 AI Agent 对战，每个控制 3 个球员</p>
          <p>• 先进 21 分或时间结束时分数高者获胜</p>
          <p>• 每回合 Agent 为自己的 3 个球员决策</p>
          <p>• 动作类型：移动、传球、投篮、防守、抢断</p>
        </div>
      )}
    </main>
  );
}