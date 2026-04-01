/**
 * Skill Runner - v2 (Team Control)
 * 
 * 调用 Agent Skill，一个 Agent 控制 3 个球员
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const execAsync = promisify(exec);

/**
 * 运行 Agent Skill
 * @param {Object} skill - Agent 配置
 * @param {Object} gameState - 游戏状态
 * @returns {Array} - [{playerIndex, action}, ...]
 */
async function runAgentSkill(skill, gameState) {
  const { runtime, entrypoint } = skill;
  
  // 构建环境变量
  const env = {
    ...process.env,
    GAME_STATE: JSON.stringify(gameState),
  };
  
  try {
    let result;
    
    if (runtime === 'node') {
      const skillPath = path.join(__dirname, '../../skills', skill.name, entrypoint);
      result = await execAsync(`node "${skillPath}"`, { env, timeout: 5000 });
    } else if (runtime === 'python') {
      const skillPath = path.join(__dirname, '../../skills', skill.name, entrypoint);
      result = await execAsync(`python3 "${skillPath}"`, { env, timeout: 5000 });
    } else if (skill.decisionType === 'http') {
      // HTTP 调用
      result = await callHttpEndpoint(skill.endpoint, gameState);
    } else {
      throw new Error(`不支持的 runtime: ${runtime}`);
    }
    
    // 解析输出
    const output = result.stdout.trim();
    const actions = JSON.parse(output);
    
    // 验证输出格式
    if (!Array.isArray(actions)) {
      throw new Error('Agent 输出必须是数组');
    }
    
    return actions;
    
  } catch (error) {
    console.error('Skill 执行失败:', error.message);
    // 返回默认动作（让球员原地不动）
    return [
      { playerIndex: 0, action: { type: 'MOVE', target: gameState.myPlayers[0]?.position } },
      { playerIndex: 1, action: { type: 'MOVE', target: gameState.myPlayers[1]?.position } },
      { playerIndex: 2, action: { type: 'MOVE', target: gameState.myPlayers[2]?.position } },
    ];
  }
}

/**
 * HTTP 调用 Agent
 */
async function callHttpEndpoint(endpoint, gameState) {
  const fetch = (await import('node-fetch')).default;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(gameState),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP 错误: ${response.status}`);
  }
  
  return await response.json();
}

module.exports = { runAgentSkill };