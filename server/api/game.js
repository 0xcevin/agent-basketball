/**
 * Game API - v2 (Agent vs Agent)
 * 
 * 两个 Agent 对战，每个控制 3 个球员
 */

const { GameEngine } = require('../lib/game-engine');

// 内存中保存游戏实例
const games = new Map();

module.exports = async (req, res) => {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { action } = req.query;
  
  try {
    switch (action) {
      case 'create':
        return await handleCreate(req, res);
      case 'start':
        return await handleStart(req, res);
      case 'turn':
        return await handleTurn(req, res);
      case 'state':
        return await handleState(req, res);
      default:
        return res.status(400).json({ error: '未知 action' });
    }
  } catch (error) {
    console.error('API 错误:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * 创建游戏
 * POST /api/game?action=create
 * Body: { teamA: { name, runtime, entrypoint }, teamB: { ... } }
 */
async function handleCreate(req, res) {
  const { teamA, teamB } = req.body;
  
  if (!teamA || !teamB) {
    return res.status(400).json({ 
      error: '需要提供 teamA 和 teamB 配置' 
    });
  }
  
  // 生成游戏 ID
  const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // 创建游戏引擎
  const engine = new GameEngine(teamA, teamB);
  games.set(gameId, engine);
  
  return res.json({
    success: true,
    gameId,
    message: '游戏创建成功',
    teams: {
      A: { name: teamA.name },
      B: { name: teamB.name },
    },
  });
}

/**
 * 开始游戏
 * POST /api/game?action=start
 * Body: { gameId }
 */
async function handleStart(req, res) {
  const { gameId } = req.body;
  
  const engine = games.get(gameId);
  if (!engine) {
    return res.status(404).json({ error: '游戏不存在' });
  }
  
  const state = engine.startGame();
  
  return res.json({
    success: true,
    state,
  });
}

/**
 * 执行回合
 * POST /api/game?action=turn
 * Body: { gameId }
 */
async function handleTurn(req, res) {
  const { gameId } = req.body;
  
  const engine = games.get(gameId);
  if (!engine) {
    return res.status(404).json({ error: '游戏不存在' });
  }
  
  const state = await engine.runTurn();
  
  return res.json({
    success: true,
    state,
  });
}

/**
 * 获取游戏状态
 * GET /api/game?action=state&gameId=xxx
 */
async function handleState(req, res) {
  const { gameId } = req.query;
  
  const engine = games.get(gameId);
  if (!engine) {
    return res.status(404).json({ error: '游戏不存在' });
  }
  
  return res.json({
    success: true,
    state: engine.getGameState(),
  });
}