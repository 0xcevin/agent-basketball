/**
 * Basketball Game Engine - v3 (Standard Agent Skill)
 * 
 * 两个 Agent 对战，每个 Agent 控制 3 个球员
 * 每个球员单独调用 Agent Skill（标准形式）
 */

const { runAgentSkill } = require('./skill-runner');

// 游戏配置
const GAME_CONFIG = {
  COURT_WIDTH: 14,
  COURT_HEIGHT: 15,
  BASKET_X: 7,
  BASKET_Y: 0,
  GAME_DURATION: 300,
  MAX_SCORE: 21,
};

class GameEngine {
  constructor(teamASkill, teamBSkill) {
    // 每个球员配置（可以是不同的 skill）
    this.teamASkills = Array(3).fill(teamASkill);  // A队3个球员使用相同skill
    this.teamBSkills = Array(3).fill(teamBSkill);  // B队3个球员使用相同skill
    
    this.gameState = {
      score: { A: 0, B: 0 },
      timeRemaining: GAME_CONFIG.GAME_DURATION,
      status: 'waiting',
      possession: 'A',
      ballPosition: { x: 7, y: 10 },
      ballHolder: null,
    };
    
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
  
  // 获取单个球员视角的游戏状态（标准 Agent Skill 格式）
  getPlayerState(player) {
    const team = player.id.startsWith('A') ? 'A' : 'B';
    const opponentTeam = team === 'A' ? 'B' : 'A';
    
    const myPlayers = this.players[team];
    const opponentPlayers = this.players[opponentTeam];
    
    // 构建 teammates（不包括自己）
    const teammates = myPlayers
      .filter(p => p.id !== player.id)
      .map(p => ({
        id: p.id,
        name: p.name,
        position: p.position,
      }));
    
    return {
      me: {
        id: player.id,
        name: player.name,
        position: player.position,
        stats: player.stats,
      },
      teammates,
      opponents: opponentPlayers.map(p => ({
        id: p.id,
        name: p.name,
        position: p.position,
      })),
      ballPosition: this.gameState.ballPosition,
      iHaveBall: this.gameState.ballHolder === player.id,
    };
  }
  
  async runTurn() {
    if (this.gameState.status !== 'playing') return;
    
    this.turnNumber++;
    const activeTeam = this.gameState.possession;
    const skills = activeTeam === 'A' ? this.teamASkills : this.teamBSkills;
    const teamPlayers = this.players[activeTeam];
    
    this.log(`=== 回合 ${this.turnNumber} | ${activeTeam}队 ===`);
    
    // 找到持球人，优先执行
    const ballHolderIndex = teamPlayers.findIndex(
      p => p.id === this.gameState.ballHolder
    );
    
    // 按优先级排序：持球人先执行
    const executionOrder = [0, 1, 2].sort((a, b) => {
      if (a === ballHolderIndex) return -1;
      if (b === ballHolderIndex) return 1;
      return 0;
    });
    
    // 为每个球员调用 Agent Skill
    for (const playerIndex of executionOrder) {
      const player = teamPlayers[playerIndex];
      const skill = skills[playerIndex];
      
      try {
        // 获取该球员的视角
        const playerState = this.getPlayerState(player);
        
        // 调用 Agent Skill
        const action = await runAgentSkill(skill, playerState);
        
        // 执行动作
        await this.executePlayerAction(player, action);
        
      } catch (error) {
        this.log(`${player.name} 执行错误: ${error.message}`);
      }
    }
    
    // 更新时间
    this.gameState.timeRemaining -= 5;
    
    // 检查比赛结束
    if (this.gameState.timeRemaining <= 0 || 
        this.gameState.score.A >= GAME_CONFIG.MAX_SCORE ||
        this.gameState.score.B >= GAME_CONFIG.MAX_SCORE) {
      this.endGame();
    }
    
    return this.getGameState();
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
        this.log(`${player.name} 未知动作: ${action.type}`);
    }
  }
  
  async handleMove(player, target) {
    if (!target) return;
    
    target.x = Math.max(0, Math.min(GAME_CONFIG.COURT_WIDTH, target.x));
    target.y = Math.max(0, Math.min(GAME_CONFIG.COURT_HEIGHT, target.y));
    
    player.position = target;
    
    if (this.gameState.ballHolder === player.id) {
      this.updateBallPosition();
    }
    
    this.log(`${player.name} → (${target.x.toFixed(1)}, ${target.y.toFixed(1)})`);
  }
  
  async handlePass(player, targetId) {
    if (this.gameState.ballHolder !== player.id) {
      return;
    }
    
    const targetPlayer = this.findPlayer(targetId);
    if (!targetPlayer) return;
    
    const playerTeam = player.id.startsWith('A') ? 'A' : 'B';
    const targetTeam = targetId.startsWith('A') ? 'A' : 'B';
    
    if (playerTeam !== targetTeam) return;
    
    const dist = Math.sqrt(
      Math.pow(player.position.x - targetPlayer.position.x, 2) +
      Math.pow(player.position.y - targetPlayer.position.y, 2)
    );
    
    const successRate = Math.max(0.3, 1 - dist / 10);
    
    if (Math.random() < successRate) {
      this.gameState.ballHolder = targetId;
      this.updateBallPosition();
      player.stats.assists++;
      this.log(`${player.name} → ${targetPlayer.name} ✅`);
    } else {
      this.log(`${player.name} → ${targetPlayer.name} ❌ 失误`);
      this.turnover();
    }
  }
  
  async handleShoot(player, power = 0.7) {
    if (this.gameState.ballHolder !== player.id) return;
    
    const distToBasket = Math.sqrt(
      Math.pow(player.position.x - GAME_CONFIG.BASKET_X, 2) +
      Math.pow(player.position.y - GAME_CONFIG.BASKET_Y, 2)
    );
    
    let baseRate = 0.6;
    if (distToBasket > 5) baseRate = 0.35;
    else if (distToBasket > 3) baseRate = 0.5;
    
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
      const points = distToBasket > 5 ? 3 : 2;
      const team = player.id.startsWith('A') ? 'A' : 'B';
      this.gameState.score[team] += points;
      player.stats.points += points;
      
      this.log(`${player.name} 投篮命中 ${points}分！🎉`);
      
      this.gameState.possession = team === 'A' ? 'B' : 'A';
      this.resetPositions();
    } else {
      this.log(`${player.name} 投篮打铁 ❌`);
      this.contestRebound();
    }
  }
  
  async handleDefend(player, targetId) {
    const target = this.findPlayer(targetId);
    if (!target) return;
    
    const dx = target.position.x - player.position.x;
    const dy = target.position.y - player.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      const targetDist = 1;
      const moveX = player.position.x + (dx / dist) * (dist - targetDist);
      const moveY = player.position.y + (dy / dist) * (dist - targetDist);
      
      player.position = { x: moveX, y: moveY };
    }
    
    this.log(`${player.name} 防守 ${target.name}`);
  }
  
  async handleSteal(player) {
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
    }
  }
  
  turnover() {
    this.gameState.possession = this.gameState.possession === 'A' ? 'B' : 'A';
    this.resetPositions();
    this.log(`球权转换 → ${this.gameState.possession}队`);
  }
  
  contestRebound() {
    const teamA = this.players.A;
    const teamB = this.players.B;
    
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
    this.players.A[0].position = { x: 4, y: 10 };
    this.players.A[1].position = { x: 7, y: 12 };
    this.players.A[2].position = { x: 10, y: 10 };
    
    this.players.B[0].position = { x: 4, y: 5 };
    this.players.B[1].position = { x: 7, y: 3 };
    this.players.B[2].position = { x: 10, y: 5 };
    
    const team = this.gameState.possession;
    this.gameState.ballHolder = this.players[team][0].id;
    this.updateBallPosition();
  }
  
  endGame() {
    this.gameState.status = 'finished';
    const winner = this.gameState.score.A > this.gameState.score.B ? 'A' : 
                   this.gameState.score.B > this.gameState.score.A ? 'B' : 'tie';
    
    this.log('=== 比赛结束 ===');
    this.log(`比分: A ${this.gameState.score.A} - ${this.gameState.score.B} B`);
    
    if (winner !== 'tie') {
      this.log(`${winner}队获胜！🏆`);
    } else {
      this.log('平局！');
    }
  }
  
  getGameState() {
    return {
      ...this.gameState,
      players: [...this.players.A, ...this.players.B],
      logs: this.logs.slice(-20),
      turnNumber: this.turnNumber,
    };
  }
}

module.exports = { GameEngine, GAME_CONFIG };