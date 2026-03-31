/**
 * 游戏引擎核心 - 处理比赛逻辑、状态推进、动作判定
 */

class GameEngine {
  constructor(gameId, teamA, teamB) {
    this.gameId = gameId;
    this.status = 'waiting';
    this.score = { A: 0, B: 0 };
    this.possession = 'A'; // A 队先攻
    this.timeRemaining = 300; // 5分钟
    this.quarter = 1;
    this.logs = [];
    
    // 初始化球员
    this.players = [];
    this.initPlayers(teamA, 'A');
    this.initPlayers(teamB, 'B');
    
    // 球的位置
    this.ballPosition = { x: 7, y: 2 }; // 三分线外
    this.ballHolder = null;
    
    // 待处理的动作
    this.pendingActions = new Map();
  }
  
  initPlayers(teamConfig, teamId) {
    const startPositions = teamId === 'A' 
      ? [{x: 3, y: 3}, {x: 7, y: 5}, {x: 11, y: 3}]  // A队进攻位置
      : [{x: 3, y: 12}, {x: 7, y: 10}, {x: 11, y: 12}]; // B队防守位置
      
    teamConfig.players.forEach((skillConfig, index) => {
      this.players.push({
        id: `${teamId}-${index}`,
        name: skillConfig.name,
        team: teamId,
        position: { ...startPositions[index] },
        attributes: skillConfig.attributes,
        stats: { points: 0, assists: 0, rebounds: 0, steals: 0 }
      });
    });
  }
  
  start() {
    this.status = 'playing';
    this.log('比赛开始！');
    this.log(`${this.getTeamPlayers('A')[0].name} 发球`);
  }
  
  getState() {
    return {
      gameId: this.gameId,
      status: this.status,
      quarter: this.quarter,
      timeRemaining: this.timeRemaining,
      score: this.score,
      possession: this.possession,
      players: this.players,
      ballPosition: this.ballPosition,
      logs: this.logs.slice(-20) // 最近20条日志
    };
  }
  
  // 模拟一个回合
  async simulateTurn() {
    if (this.status !== 'playing') return;
    
    // 获取当前控球方的球员
    const offensivePlayers = this.getTeamPlayers(this.possession);
    const defensiveTeam = this.possession === 'A' ? 'B' : 'A';
    const defensivePlayers = this.getTeamPlayers(defensiveTeam);
    
    // 为每个进攻球员调用 Skill 获取决策
    for (const player of offensivePlayers) {
      const gameState = this.buildGameStateForPlayer(player);
      const action = await this.callSkill(player, gameState);
      this.pendingActions.set(player.id, action);
    }
    
    // 执行动作（简化版：只执行持球者的动作）
    const ballHolder = this.getBallHolder() || offensivePlayers[0];
    const action = this.pendingActions.get(ballHolder.id);
    
    if (action) {
      this.executeAction(ballHolder, action, offensivePlayers, defensivePlayers);
    }
    
    // 更新时间和检查比赛结束
    this.timeRemaining -= 5; // 每个回合5秒
    if (this.timeRemaining <= 0 || this.score.A >= 11 || this.score.B >= 11) {
      this.endGame();
    }
    
    this.pendingActions.clear();
  }
  
  // 构建给 Skill 的游戏状态（信息隐藏，只能看到应该看到的）
  buildGameStateForPlayer(player) {
    return {
      me: player,
      teammates: this.players.filter(p => p.team === player.team && p.id !== player.id),
      opponents: this.players.filter(p => p.team !== player.team),
      ballPosition: this.ballPosition,
      possession: this.possession,
      score: this.score,
      timeRemaining: this.timeRemaining,
      iHaveBall: this.getBallHolder()?.id === player.id
    };
  }
  
  // 调用 Agent Skill
  async callSkill(player, gameState) {
    // TODO: 这里调用外部的 Skill
    // 现在使用内置的 AI 决策
    return this.aiDecide(player, gameState);
  }
  
  // 内置 AI 决策（示例逻辑）
  aiDecide(player, state) {
    const distToBasket = this.getDistance(player.position, { x: 7, y: 0 });
    
    // 如果持球且离篮筐近，投篮
    if (state.iHaveBall && distToBasket < 4) {
      return { type: 'SHOOT', power: 0.7 };
    }
    
    // 如果持球但离得远，往篮下移动
    if (state.iHaveBall) {
      return { 
        type: 'MOVE', 
        target: { x: 7, y: Math.max(0, player.position.y - 3) }
      };
    }
    
    // 无球跑位
    return { 
      type: 'MOVE',
      target: { 
        x: player.position.x + (Math.random() - 0.5) * 2,
        y: player.position.y + (Math.random() - 0.5) * 2
      }
    };
  }
  
  // 执行动作
  executeAction(player, action, teammates, opponents) {
    switch (action.type) {
      case 'MOVE':
        this.executeMove(player, action.target);
        break;
      case 'PASS':
        this.executePass(player, action.target, teammates);
        break;
      case 'SHOOT':
        this.executeShoot(player, action.power, opponents);
        break;
      case 'DEFEND':
        this.executeDefend(player, action.target);
        break;
      case 'STEAL':
        this.executeSteal(player, opponents);
        break;
    }
  }
  
  executeMove(player, target) {
    const speed = player.attributes.speed * 0.5;
    const dx = target.x - player.position.x;
    const dy = target.y - player.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      const ratio = Math.min(speed / dist, 1);
      player.position.x += dx * ratio;
      player.position.y += dy * ratio;
    }
    
    // 如果持球，球跟着移动
    if (this.getBallHolder()?.id === player.id) {
      this.ballPosition = { ...player.position };
    }
    
    this.log(`${player.name} 移动到 (${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)})`);
  }
  
  executePass(player, targetId, teammates) {
    const target = teammates.find(p => p.id === targetId);
    if (!target) return;
    
    // 传球成功率计算
    const passSuccess = Math.random() < (player.attributes.passing / 10);
    
    if (passSuccess) {
      this.ballHolder = target;
      this.ballPosition = { ...target.position };
      player.stats.assists++;
      this.log(`${player.name} 传球给 ${target.name}`);
    } else {
      this.log(`${player.name} 传球失误！`);
      this.changePossession();
    }
  }
  
  executeShoot(player, power, opponents) {
    const basketPos = { x: 7, y: 0 };
    const dist = this.getDistance(player.position, basketPos);
    
    // 基础命中率
    let shotChance = player.attributes.shooting / 10;
    
    // 距离修正 (越远越难)
    shotChance *= Math.max(0.3, 1 - dist / 10);
    
    // 防守压力修正
    const nearbyDefenders = opponents.filter(o => 
      this.getDistance(o.position, player.position) < 2
    ).length;
    shotChance *= Math.pow(0.8, nearbyDefenders);
    
    const made = Math.random() < shotChance;
    
    if (made) {
      const points = dist > 5 ? 3 : 2; // 三分线判断
      this.score[player.team] += points;
      player.stats.points += points;
      this.log(`${player.name} 投篮命中！${points}分！`);
      this.changePossession();
    } else {
      this.log(`${player.name} 投篮不中`);
      // 简化：直接换攻防
      this.changePossession();
    }
  }
  
  executeDefend(player, targetId) {
    // 贴防逻辑
    this.log(`${player.name} 防守 ${targetId}`);
  }
  
  executeSteal(player, opponents) {
    const ballHolder = this.getBallHolder();
    if (!ballHolder || ballHolder.team === player.team) return;
    
    const stealChance = (player.attributes.defense / 10) * 0.3;
    
    if (Math.random() < stealChance) {
      this.log(`${player.name} 抢断成功！`);
      player.stats.steals++;
      this.ballHolder = player;
      this.ballPosition = { ...player.position };
      this.possession = player.team;
    } else {
      this.log(`${player.name} 抢断失败`);
    }
  }
  
  changePossession() {
    this.possession = this.possession === 'A' ? 'B' : 'A';
    this.ballHolder = null;
    
    // 重置球位置到新进攻方
    const newOffense = this.getTeamPlayers(this.possession);
    this.ballPosition = { ...newOffense[0].position };
    this.log(`球权转换，${this.possession}队进攻`);
  }
  
  getTeamPlayers(team) {
    return this.players.filter(p => p.team === team);
  }
  
  getBallHolder() {
    return this.players.find(p => 
      Math.abs(p.position.x - this.ballPosition.x) < 0.5 &&
      Math.abs(p.position.y - this.ballPosition.y) < 0.5
    );
  }
  
  getDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  log(message) {
    const timestamp = new Date().toISOString().substr(11, 8);
    this.logs.push(`[${timestamp}] ${message}`);
    console.log(`[Game ${this.gameId}] ${message}`);
  }
  
  endGame() {
    this.status = 'finished';
    const winner = this.score.A > this.score.B ? 'A' : 'B';
    this.log(`比赛结束！${winner}队获胜 ${this.score.A}:${this.score.B}`);
  }
  
  submitPlayerAction(playerId, action) {
    this.pendingActions.set(playerId, action);
  }
}

module.exports = { GameEngine };