/**
 * Team AI - 球队教练 Agent
 * 
 * 控制 3 个球员的篮球 AI
 * 输入: 全队状态
 * 输出: 3 个球员的动作
 */

const gameState = JSON.parse(process.env.GAME_STATE || '{}');

/**
 * 主决策函数
 * 返回 [{playerIndex, action}, ...]
 */
function decide(gameState) {
  const { team, myPlayers, opponentPlayers, ballPosition, possession } = gameState;
  const basketPos = { x: 7, y: 0 };  // 篮筐位置
  
  const actions = [];
  
  // 找到持球人
  const ballHolderIndex = myPlayers.findIndex(p => p.iHaveBall);
  
  // 为每个球员决策
  for (let i = 0; i < 3; i++) {
    const player = myPlayers[i];
    const action = decideForPlayer(
      player, 
      i, 
      ballHolderIndex,
      myPlayers,
      opponentPlayers,
      ballPosition,
      basketPos
    );
    actions.push({ playerIndex: i, action });
  }
  
  return actions;
}

function decideForPlayer(player, index, ballHolderIndex, myPlayers, opponents, ballPosition, basketPos) {
  const iHaveBall = index === ballHolderIndex;
  
  // === 持球人决策 ===
  if (iHaveBall) {
    // 计算到篮筐距离
    const distToBasket = Math.sqrt(
      Math.pow(player.position.x - basketPos.x, 2) + 
      Math.pow(player.position.y - basketPos.y, 2)
    );
    
    // 检查防守压力
    let defenderPressure = 0;
    for (const opp of opponents) {
      const dist = Math.sqrt(
        Math.pow(opp.position.x - player.position.x, 2) +
        Math.pow(opp.position.y - player.position.y, 2)
      );
      if (dist < 2) defenderPressure++;
    }
    
    // 如果防守压力小且距离合适，投篮
    if (defenderPressure === 0 && distToBasket < 7) {
      const isThreePoint = distToBasket > 5;
      return {
        type: 'SHOOT',
        power: isThreePoint ? 0.85 : 0.75
      };
    }
    
    // 如果被包夹，找最佳传球目标
    if (defenderPressure >= 1) {
      let bestTarget = null;
      let bestScore = -Infinity;
      
      for (let j = 0; j < myPlayers.length; j++) {
        if (j === index) continue;  // 跳过自己
        
        const teammate = myPlayers[j];
        const distToTeammate = Math.sqrt(
          Math.pow(teammate.position.x - player.position.x, 2) +
          Math.pow(teammate.position.y - player.position.y, 2)
        );
        
        const distToBasket = Math.sqrt(
          Math.pow(teammate.position.x - basketPos.x, 2) +
          Math.pow(teammate.position.y - basketPos.y, 2)
        );
        
        // 评分：距离适中 + 靠近篮筐
        const score = 10 - distToTeammate - distToBasket * 0.5;
        
        if (score > bestScore) {
          bestScore = score;
          bestTarget = teammate;
        }
      }
      
      if (bestTarget && bestScore > 0) {
        return {
          type: 'PASS',
          target: bestTarget.id
        };
      }
    }
    
    // 否则向篮筐移动
    return {
      type: 'MOVE',
      target: {
        x: basketPos.x + (Math.random() - 0.5) * 2,
        y: Math.max(2, player.position.y - 2)
      }
    };
  }
  
  // === 无球球员决策 ===
  // 根据位置决定角色
  if (index === 0) {
    // 控卫：接应和组织
    const distToBall = Math.sqrt(
      Math.pow(player.position.x - ballPosition.x, 2) +
      Math.pow(player.position.y - ballPosition.y, 2)
    );
    
    if (distToBall > 5) {
      // 太远了，靠近持球人
      const ballHolder = myPlayers[ballHolderIndex];
      return {
        type: 'MOVE',
        target: {
          x: ballHolder.position.x + 2,
          y: ballHolder.position.y + 2
        }
      };
    }
    
    // 寻找空位
    return {
      type: 'MOVE',
      target: {
        x: 5 + (Math.random() - 0.5) * 4,
        y: 6 + (Math.random() - 0.5) * 2
      }
    };
  }
  
  if (index === 1) {
    // 前锋：跑位寻找机会
    return {
      type: 'MOVE',
      target: {
        x: 7 + (Math.random() - 0.5) * 6,
        y: 4 + Math.random() * 4
      }
    };
  }
  
  // 中锋：篮下卡位
  return {
    type: 'MOVE',
    target: {
      x: basketPos.x + (Math.random() - 0.5) * 3,
      y: basketPos.y + 2 + Math.random() * 2
    }
  };
}

console.log(JSON.stringify(decide(gameState)));