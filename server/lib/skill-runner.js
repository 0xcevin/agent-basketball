/**
 * Skill Runner - 负责调用外部 Agent Skill
 * 
 * 支持两种模式：
 * 1. HTTP Skill: 调用远程 HTTP 接口
 * 2. Local Skill: 执行本地脚本
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class SkillRunner {
  constructor(config) {
    this.config = config;
  }
  
  async decide(gameState) {
    if (this.config.endpoint) {
      return this.callHttpSkill(gameState);
    } else if (this.config.scriptPath) {
      return this.callLocalSkill(gameState);
    } else {
      // 默认 AI 决策
      return this.defaultDecision(gameState);
    }
  }
  
  // HTTP Skill 调用
  async callHttpSkill(gameState) {
    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player: this.config.name,
          gameState
        }),
        timeout: 5000
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      return result.action;
    } catch (error) {
      console.error('Skill HTTP call failed:', error);
      return this.defaultDecision(gameState);
    }
  }
  
  // Local Skill 调用
  async callLocalSkill(gameState) {
    try {
      const input = JSON.stringify(gameState);
      const { stdout } = await execAsync(
        `node ${this.config.scriptPath}`,
        { 
          input,
          timeout: 5000,
          env: { ...process.env, GAME_STATE: input }
        }
      );
      
      return JSON.parse(stdout);
    } catch (error) {
      console.error('Skill local call failed:', error);
      return this.defaultDecision(gameState);
    }
  }
  
  // 默认 AI 决策
  defaultDecision(gameState) {
    const { me, iHaveBall, teammates } = gameState;
    const distToBasket = Math.sqrt(
      Math.pow(me.position.x - 7, 2) + 
      Math.pow(me.position.y - 0, 2)
    );
    
    if (iHaveBall) {
      // 持球决策
      if (distToBasket < 4 && me.attributes.shooting > 6) {
        return { type: 'SHOOT', power: 0.7 };
      }
      
      // 寻找空位队友
      const openTeammate = teammates.find(t => {
        const dist = Math.sqrt(
          Math.pow(t.position.x - me.position.x, 2) +
          Math.pow(t.position.y - me.position.y, 2)
        );
        return dist < 8 && dist > 2;
      });
      
      if (openTeammate && me.attributes.passing > 5) {
        return { type: 'PASS', target: openTeammate.id };
      }
      
      // 突破
      return {
        type: 'MOVE',
        target: {
          x: 7 + (Math.random() - 0.5) * 4,
          y: Math.max(2, me.position.y - 3)
        }
      };
    } else {
      // 无球跑位
      return {
        type: 'MOVE',
        target: {
          x: 7 + (Math.random() - 0.5) * 6,
          y: 4 + Math.random() * 4
        }
      };
    }
  }
}

module.exports = { SkillRunner };