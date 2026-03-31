'use client';

import { useState, useEffect, useCallback } from 'react';
import Court from './components/Court';
import Scoreboard from './components/Scoreboard';
import GameLog from './components/GameLog';
import styles from './page.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function Home() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);

  // 创建新游戏
  const createGame = async () => {
    setLoading(true);
    try {
      const teamA = {
        name: '红队',
        players: [
          { name: '射手A1', attributes: { speed: 7, shooting: 9, passing: 5, defense: 6, stamina: 8 } },
          { name: '传球A2', attributes: { speed: 6, shooting: 6, passing: 9, defense: 7, stamina: 7 } },
          { name: '全能A3', attributes: { speed: 8, shooting: 7, passing: 7, defense: 8, stamina: 8 } },
        ]
      };
      
      const teamB = {
        name: '蓝队',
        players: [
          { name: '射手B1', attributes: { speed: 7, shooting: 9, passing: 5, defense: 6, stamina: 8 } },
          { name: '传球B2', attributes: { speed: 6, shooting: 6, passing: 9, defense: 7, stamina: 7 } },
          { name: '全能B3', attributes: { speed: 8, shooting: 7, passing: 7, defense: 8, stamina: 8 } },
        ]
      };

      const res = await fetch(`${API_BASE}/game/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamA, teamB })
      });
      
      const data = await res.json();
      setGameId(data.gameId);
      
      // 自动开始
      await fetch(`${API_BASE}/game/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: data.gameId })
      });
      
      fetchGameState(data.gameId);
    } catch (error) {
      console.error('Failed to create game:', error);
    }
    setLoading(false);
  };

  // 获取游戏状态
  const fetchGameState = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/game/state?gameId=${id}`);
      const data = await res.json();
      setGameState(data);
    } catch (error) {
      console.error('Failed to fetch game state:', error);
    }
  }, []);

  // 模拟一回合
  const simulateTurn = async () => {
    if (!gameId) return;
    try {
      await fetch(`${API_BASE}/game/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId })
      });
      fetchGameState(gameId);
    } catch (error) {
      console.error('Failed to simulate turn:', error);
    }
  };

  // 自动播放
  useEffect(() => {
    if (!autoPlay || !gameId || gameState?.status === 'finished') return;
    
    const interval = setInterval(() => {
      simulateTurn();
    }, 1000);
    
    return () => clearInterval(interval);
  }, [autoPlay, gameId, gameState?.status]);

  // 刷新状态
  useEffect(() => {
    if (gameId && !autoPlay) {
      const interval = setInterval(() => {
        fetchGameState(gameId);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [gameId, autoPlay, fetchGameState]);

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>🏀 Agent Basketball 3v3</h1>
      
      <div className={styles.controls}>
        {!gameId ? (
          <button onClick={createGame} disabled={loading} className={styles.btnPrimary}>
            {loading ? '创建中...' : '开始新比赛'}
          </button>
        ) : (
          <>
            <button onClick={simulateTurn} disabled={gameState?.status === 'finished'} className={styles.btnPrimary}>
              下一回合
            </button>
            <button onClick={() => setAutoPlay(!autoPlay)} className={styles.btnSecondary}>
              {autoPlay ? '⏸ 暂停' : '▶ 自动播放'}
            </button>
            <button onClick={createGame} className={styles.btnSecondary}>
              重新开始
            </button>
          </>
        )}
      </div>

      {gameState && (
        <div className={styles.gameContainer}>
          <Scoreboard gameState={gameState} />
          
          <div className={styles.courtWrapper}>
            <Court gameState={gameState} />
          </div>
          
          <GameLog logs={gameState.logs} />
        </div>
      )}
      
      <div className={styles.info}>
        <h3>关于游戏</h3>
        <p>这是一个专为 AI Agent 设计的 3v3 篮球游戏。</p>
        <p>每个球员都是一个独立的 Agent Skill，根据场上情况做出决策。</p>
      </div>
    </main>
  );
}