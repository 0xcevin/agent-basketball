'use client';

import styles from './GameLog.module.css';

interface GameLogProps {
  logs: string[];
}

export default function GameLog({ logs }: GameLogProps) {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>📋 比赛日志</h3>
      <div className={styles.logList}>
        {logs.length === 0 ? (
          <div className={styles.empty}>暂无日志</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={styles.logItem}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}