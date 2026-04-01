/**
 * Basketball Game Engine - v2 (Agent vs Agent)
 * 
 * 两个 Agent 对战，每个 Agent 控制 3 个球员
 */

const { runAgentSkill } = require('./skill-runner');

// 游戏配置
const GAME_CONFIG = {
  COURT_WIDTH: 14,      // 半场宽度
  COURT_HEIGHT: 15,     // 半场长度
  BASKET_X: 7,          // 篮筐 X 坐标
  BASKET_Y: 0,          // 篮筐 Y 坐标
  TURN_DURATION: 3000,  // 每回合 3 秒
  GAME_DURATION: 300,   // 5 分钟
  MAX_SCORE: 21,        // 21 分获胜
};

// 初始球员位置
function getInitialPositions(team) {
  if (team === 'A') {
    return [
      { x: 4, y: 10 },   // 控球后卫
      { x: 7, y: 12 },   // 前锋
      { x: 10, y: 10 },  // 中锋
    ];
  } else {
    return [
      { x: 4, y: 5 },
      { x: 7, y: 3 },
      { x: 10, y: 5 },
    ];
  }
}

class GameEngine {
  constructor(teamASkill, teamBSkill) {
    this.teamASkill = teamASkill;  // Agent A 配置
    this.teamBSkill = teamBSkill;  // Agent B 配置
    
    this.gameState = {
      score: { A: 0, B: 0 },
      timeRemaining: GAME_CONFIG.GAME_DURATION,
      quarter: 1,
      status: 'waiting',  // waiting, playing, finished
      possession: 'A',    // 当前持球方
      ballPosition: { x: 7, y: 10 },
      ballHolder: null,   // 当前持球人ID
    };
    
    // 球员状态 - 每个队3个球员
    this.players = {
      A: [
        { id: 'A1', name: 'A-控卫', position: { x: 4, y: 10 }, stats: { points: 0, assists: 0, rebounds: 0 } },
        { id: 'A2', name: 'A-前锋', position: { x: 7, y: 12 }, stats: { points: 0, assists: 0, rebounds: 0 } },
        { id: 'A3', name: 'A-中锋', position: { x: 10, y: 10 }, stats: { points: 0, assists: 0, rebounds: 0 } },
      ],
      B: [
        { id: 'B1', name: 'B-控卫', position: { x: 4, y: 5 }, stats: { points: 0, assists: 0, rebounds: 0 } },
        { id: 'B2', name: 'B-前锋', position: { x: 7, y: 3 }, stats: { points: 0, assists: 0, rebounds: 0 } },
        { id: 'B3', name: 'B-中锋', position: { x: 10, y: 5 }, stats: { points: 0, assists: 0, rebounds: 0 } },
      ],
    };
    
    this.logs = [];
    this.turnNumber = 0;
  }
  
  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.logs.push(logEntry);
    console.log(logEntry);
  }
  
  startGame() {
    this.gameState.status = 'playing';
    this.gameState.possession = Math.random() > 0.5 ? 'A' : 'B';
    this.log(`比赛开始！${this.gameState.possession}队获得球权`);
    
    // 设置初始持球人
    const team = this.gameState.possession;
    this.gameState.ballHolder = this.players[team][0].id;
    this.updateBallPosition();
    
    return this.getGameState();
  }
  
  updateBallPosition() {
    if (this.gameState.ballHolder) {
      const player = this.findPlayer(this.gameState.ballHolder);
      if (player) {
        this.gameState.ballPosition = { ...player.position };
      }
    }
  }
  
  findPlayer(playerId) {
    for (const team of ['A', 'B']) {
      const player = this.players[team].find(p => p.id === playerId);
      if (player) return player;
    }
    return null;
  }
  
  findPlayerByTeamAndIndex(team, index) {
    return this.players[team][index];
  }
  
  // 获取 Agent 视角的游戏状态
  getAgentState(team) {
    const myPlayers = this.players[team];
    const opponentTeam = team === 'A' ? 'B' : 'A';
    const opponentPlayers = this.players[opponentTeam];
    
    // 构建每个球员的视角
    const playerStates = myPlayers.map((player, index) => ({
      index: index,  // 0, 1, 2
      id: player.id,
      name: player.name,
      position: player.position,
      stats: player.stats,
      iHaveBall: this.gameState.ballHolder === player.id,
    }));
    
    return {
      team: team,
      score: this.gameState.score,
      timeRemaining: this.gameState.timeRemaining,
      possession: this.gameState.possession === team,
      ballPosition: this.gameState.ballPosition,
      myPlayers: playerStates,
      opponentPlayers: opponentPlayers.map(p => ({
        id: p.id,
        name: p.name,
        position: p.position,
      })),
      turnNumber: this.turnNumber,
    };
  }
  
  async runTurn() {
    if (this.gameState.status !== 'playing') return;
    
    this.turnNumber++;
    const activeTeam = this.gameState.possession;
    const skill = activeTeam === 'A' ? this.teamASkill : this.teamBSkill;
    
    this.log(`=== 回合 ${this.turnNumber} | ${activeTeam}队决策 ===`);
    
    // 获取 Agent 状态
    const agentState = this.getAgentState(activeTeam);
    
    try {
      // 调用 Agent Skill - 返回3个球员的动作
      const actions = await runAgentSkill(skill, agentState);
      
      // 执行动作
      await this.executeActions(activeTeam, actions);
      
    } catch (error) {
      this.log(`Agent 执行错误: ${error.message}`);
    }
    
    // 更新时间
    this.gameState.timeRemaining -= 5;  // 每回合5秒
    
    // 检查比赛结束
    if (this.gameState.timeRemaining <= 0 || 
        this.gameState.score.A >= GAME_CONFIG.MAX_SCORE ||
        this.gameState.score.B >= GAME_CONFIG.MAX_SCORE) {
      this.endGame();
    }
    
    return this.getGameState();
  }
  
  async executeActions(team, actions) {
    // actions 应该是 [{playerIndex, action}, ...]
    if (!Array.isArray(actions)) {
      this.log('错误：actions 必须是数组');
      return;
    }
    
    // 优先执行持球人的动作
    const ballHolderIndex = this.players[team].findIndex(
      p => p.id === this.gameState.ballHolder
    );
    
    // 按优先级排序：持球人先执行
    const sortedActions = [...actions].sort((a, b) => {
      if (a.playerIndex === ballHolderIndex) return -1;
      if (b.playerIndex === ballHolderIndex) return 1;
      return 0;
    });
    
    for (const { playerIndex, action } of sortedActions) {
      if (playerIndex < 0 || playerIndex > 2) continue;
      
      const player = this.players[team][playerIndex];
      await this.executePlayerAction(player, action);
    }
  }
  
  async executePlayerAction(player, action) {
    if (!action || !action.type) return;
    
    switch (action.type) {
      case 'MOVE':
        await this.handleMove(player, action.target);
        break;
      case 'PASS':
        await this.handlePass(player, action.target);
        break;
      case 'SHOOT':
        await this.handleShoot(player, action.power);
        break;
      case 'DEFEND':
        await this.handleDefend(player, action.target);
        break;
      case 'STEAL':
        await this.handleSteal(player);
        break;
      default:
        this.log(`未知动作类型: ${action.type}`);
    }
  }
  
  async handleMove(player, target) {
    if (!target) return;
    
    // 限制移动范围
    target.x = Math.max(0, Math.min(GAME_CONFIG.COURT_WIDTH, target.x));
    target.y = Math.max(0, Math.min(GAME_CONFIG.COURT_HEIGHT, target.y));
    
    player.position = target;
    
    // 如果持球，更新球位置
    if (this.gameState.ballHolder === player.id) {
      this.updateBallPosition();
    }
    
    this.log(`${player.name} 移动到 (${target.x.toFixed(1)}, ${target.y.toFixed(1)})`);
  }
  
  async handlePass(player, targetId) {
    if (this.gameState.ballHolder !== player.id) {
      this.log(`${player.name} 尝试传球但没有球`);
      return;
    }
    
    const targetPlayer = this.findPlayer(targetId);
    if (!targetPlayer) {
      this.log(`${player.name} 传球目标不存在`);
      return;
    }
    
    // 检查是否是队友
    const playerTeam = player.id.startsWith('A') ? 'A' : 'B';
    const targetTeam = targetId.startsWith('A') ? 'A' : 'B';
    
    if (playerTeam !== targetTeam) {
      this.log(`${player.name} 不能传给对手`);
      return;
    }
    
    // 计算传球距离
    const dist = Math.sqrt(
      Math.pow(player.position.x - targetPlayer.position.x, 2) +
      Math.pow(player.position.y - targetPlayer.position.y, 2)
    );
    
    // 传球成功率（距离越远成功率越低）
    const successRate = Math.max(0.3, 1 - dist / 10);
    
    if (Math.random() < successRate) {
      this.gameState.ballHolder = targetId;
      this.updateBallPosition();
      player.stats.assists++;
      this.log(`${player.name} 传球给 ${targetPlayer.name} ✅`);
    } else {
      // 传球失误，转换球权
      this.log(`${player.name} 传球给 ${targetPlayer.name} 失误 ❌`);
      this.turnover();
    }
  }
  
  async handleShoot(player, power = 0.7) {
    if (this.gameState.ballHolder !== player.id) {
      this.log(`${player.name} 尝试投篮但没有球`);
      return;
    }
    
    const distToBasket = Math.sqrt(
      Math.pow(player.position.x - GAME_CONFIG.BASKET_X, 2) +
      Math.pow(player.position.y - GAME_CONFIG.BASKET_Y, 2)
    );
    
    // 基础命中率
    let baseRate = 0.6;
    if (distToBasket > 5) baseRate = 0.35;  // 三分
    else if (distToBasket > 3) baseRate = 0.5;  // 中距离
    
    // 受防守影响
    const opponentTeam = player.id.startsWith('A') ? 'B' : 'A';
    let defensePressure = 0;
    for (const opp of this.players[opponentTeam]) {
      const dist = Math.sqrt(
        Math.pow(opp.position.x - player.position.x, 2) +
        Math.pow(opp.position.y - player.position.y, 2)
      );
      if (dist < 2) defensePressure++;
    }
    
    const finalRate = baseRate * (1 - defensePressure * 0.15) * power;
    
    if (Math.random() < finalRate) {
      // 进球
      const points = distToBasket > 5 ? 3 : 2;
      const team = player.id.startsWith('A') ? 'A' : 'B';
      this.gameState.score[team] += points;
      player.stats.points += points;
      
      this.log(`${player.name} 投篮命中！${points}分！🎉 (${distToBasket.toFixed(1)}m)`);
      
      // 进球后换发球
      this.gameState.possession = team === 'A' ? 'B' : 'A';
      this.resetPositions();
    } else {
      this.log(`${player.name} 投篮打铁 ❌ (${distToBasket.toFixed(1)}m)`);
      // 篮板争夺
      this.contestRebound();
    }
  }
  
  async handleDefend(player, targetId) {
    const target = this.findPlayer(targetId);
    if (!target) return;
    
    // 向目标移动并贴身防守
    const dx = target.position.x - player.position.x;
    const dy = target.position.y - player.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      // 移动到距离目标 1 米的位置
      const targetDist = 1;
      const moveX = player.position.x + (dx / dist) * (dist - targetDist);
      const moveY = player.position.y + (dy / dist) * (dist - targetDist);
      
      player.position = { x: moveX, y: moveY };
    }
    
    this.log(`${player.name} 防守 ${target.name}`);
  }
  
  async handleSteal(player) {
    // 检查是否靠近持球人
    const opponentTeam = player.id.startsWith('A') ? 'B' : 'A';
    const ballHolder = this.findPlayer(this.gameState.ballHolder);
    
    if (!ballHolder) return;
    
    const dist = Math.sqrt(
      Math.pow(player.position.x - ballHolder.position.x, 2) +
      Math.pow(player.position.y - ballHolder.position.y, 2)
    );
    
    if (dist < 2 && Math.random() < 0.3) {
      this.log(`${player.name} 抢断成功！⚡`);
      this.gameState.ballHolder = player.id;
      this.gameState.possession = player.id.startsWith('A') ? 'A' : 'B';
      this.updateBallPosition();
    } else {
      this.log(`${player.name} 抢断失败`);
    }
  }
  
  turnover() {
    this.gameState.possession = this.gameState.possession === 'A' ? 'B' : 'A';
    this.resetPositions();
    this.log(`球权转换！${this.gameState.possession}队获得球权`);
  }
  
  contestRebound() {
    // 简单的篮板争夺
    const teamA = this.players.A;
    const teamB = this.players.B;
    
    // 计算每队离篮筐近的球员数
    let aClose = 0, bClose = 0;
    
    for (const p of teamA) {
      const dist = Math.sqrt(
        Math.pow(p.position.x - GAME_CONFIG.BASKET_X, 2) +
        Math.pow(p.position.y - GAME_CONFIG.BASKET_Y, 2)
      );
      if (dist < 4) aClose++;
    }
    
    for (const p of teamB) {
      const dist = Math.sqrt(
        Math.pow(p.position.x - GAME_CONFIG.BASKET_X, 2) +
        Math.pow(p.position.y - GAME_CONFIG.BASKET_Y, 2)
      );
      if (dist < 4) bClose++;
    }
    
    // 争夺篮板
    const aWin = Math.random() < (aClose / (aClose + bClose + 0.1));
    const winner = aWin ? 'A' : 'B';
    
    this.gameState.possession = winner;
    this.gameState.ballHolder = this.players[winner][0].id;
    this.updateBallPosition();
    
    const rebounder = this.players[winner][0];
    rebounder.stats.rebounds++;
    
    this.log(`${rebounder.name} 抢到篮板！`);
  }
  
  resetPositions() {
    // 重置球员位置
    this.players.A[0].position = { x: 4, y: 10 };
    this.players.A[1].position = { x: 7, y: 12 };
    this.players.A[2].position = { x: 10, y: 10 };
    
    this.players.B[0].position = { x: 4, y: 5 };
    this.players.B[1].position = { x: 7, y: 3 };
    this.players.B[2].position = { x: 10, y: 5 };
    
    // 新持球人
    const team = this.gameState.possession;
    this.gameState.ballHolder = this.players[team][0].id;
    this.updateBallPosition();
  }
  
  endGame() {
    this.gameState.status = 'finished';
    const winner = this.gameState.score.A > this.gameState.score.B ? 'A' : 
                   this.gameState.score.B > this.gameState.score.A ? 'B' : 'tie';
    
    this.log('=== 比赛结束 ===');
    this.log(`最终比分: A ${this.gameState.score.A} - ${this.gameState.score.B} B`);
    
    if (winner === 'tie') {
      this.log('平局！');
    } else {
      this.log(`${winner}队获胜！🏆`);
    }
  }
  
  getGameState() {
    return {
      ...this.gameState,
      players: [...this.players.A, ...this.players.B],
      logs: this.logs.slice(-20),  // 最近20条日志
      turnNumber: this.turnNumber,
    };
  }
}

module.exports = { GameEngine, GAME_CONFIG };