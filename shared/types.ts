/**
 * 共享类型定义 - Agent Basketball 3v3
 */

// 球场坐标 (半场 3v3: 14m x 15m)
export interface Position {
  x: number; // 0-14 (横向)
  y: number; // 0-15 (纵向，0是底线，15是中线)
}

// 球员属性
export interface Player {
  id: string;
  name: string;
  team: 'A' | 'B';
  position: Position;
  attributes: PlayerAttributes;
  stats: PlayerStats;
}

export interface PlayerAttributes {
  speed: number;      // 1-10 移动速度
  shooting: number;   // 1-10 投篮能力
  passing: number;    // 1-10 传球能力
  defense: number;    // 1-10 防守能力
  stamina: number;    // 1-10 体力上限
}

export interface PlayerStats {
  points: number;
  assists: number;
  rebounds: number;
  steals: number;
}

// 动作类型
export type ActionType = 
  | 'MOVE'      // 移动到指定位置
  | 'PASS'      // 传球给队友
  | 'SHOOT'     // 投篮
  | 'DEFEND'    // 防守对位球员
  | 'STEAL'     // 尝试抢断
  | 'IDLE';     // 待机

// 球员动作
export interface PlayerAction {
  type: ActionType;
  target?: string | Position; // 传球目标球员ID / 移动目标位置
  power?: number;             // 投篮力度 (0-1)
}

// 比赛状态
export interface GameState {
  gameId: string;
  status: 'waiting' | 'playing' | 'finished';
  quarter: number;
  timeRemaining: number;      // 秒
  score: { A: number; B: number };
  possession: 'A' | 'B';      // 当前控球方
  players: Player[];
  ballPosition: Position;
  lastAction?: {
    playerId: string;
    action: PlayerAction;
    result: string;
  };
  logs: string[];
}

// Skill 接口
export interface SkillConfig {
  name: string;
  version: string;
  endpoint?: string;    // HTTP endpoint (remote skill)
  scriptPath?: string;  // Local script path (local skill)
  attributes: PlayerAttributes;
}

// 队伍配置
export interface TeamConfig {
  name: string;
  players: SkillConfig[];
}

// 游戏配置
export interface GameConfig {
  maxPoints: number;    // 获胜分数 (默认 11)
  timeLimit: number;    // 时间限制秒数 (默认 300 = 5分钟)
  decisionTimeout: number; // Agent 决策超时毫秒 (默认 3000)
}