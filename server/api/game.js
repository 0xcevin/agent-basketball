const { GameEngine } = require('../lib/game-engine');
const { v4: uuidv4 } = require('uuid');

// 简单的内存存储（生产环境用 Redis/Vercel KV）
const games = new Map();

module.exports = async (req, res) => {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { path } = req.query;

  try {
    switch (path) {
      case 'create':
        return await createGame(req, res);
      case 'state':
        return await getGameState(req, res);
      case 'action':
        return await submitAction(req, res);
      case 'start':
        return await startGame(req, res);
      case 'simulate':
        return await simulateTurn(req, res);
      default:
        return res.status(404).json({ error: 'Unknown endpoint' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// 创建新游戏
async function createGame(req, res) {
  const { teamA, teamB } = req.body;
  
  const gameId = uuidv4();
  const game = new GameEngine(gameId, teamA, teamB);
  
  games.set(gameId, game);
  
  return res.status(200).json({
    gameId,
    status: 'created',
    message: 'Game created successfully'
  });
}

// 获取游戏状态
async function getGameState(req, res) {
  const { gameId } = req.query;
  
  const game = games.get(gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  return res.status(200).json(game.getState());
}

// 开始游戏
async function startGame(req, res) {
  const { gameId } = req.body;
  
  const game = games.get(gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  game.start();
  
  return res.status(200).json({
    status: 'started',
    state: game.getState()
  });
}

// Agent 提交动作（手动模式）
async function submitAction(req, res) {
  const { gameId, playerId, action } = req.body;
  
  const game = games.get(gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  game.submitPlayerAction(playerId, action);
  
  return res.status(200).json({
    success: true,
    state: game.getState()
  });
}

// 模拟一个回合（自动模式）
async function simulateTurn(req, res) {
  const { gameId } = req.body;
  
  const game = games.get(gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  await game.simulateTurn();
  
  return res.status(200).json({
    success: true,
    state: game.getState()
  });
}