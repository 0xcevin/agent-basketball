/**
 * Smart AI - 聪明型球员
 * 
 * 标准 Agent Skill 格式 - 控制单个球员
 * 根据比赛情况灵活决策的篮球 AI
 */

const gameState = JSON.parse(process.env.GAME_STATE || '{}');

function decide(gameState) {
  const { me, teammates, opponents, ballPosition, iHaveBall } = gameState;
  const basketPos = { x: 7, y: 0 };
  
  // === 持球决策 ===
  if (iHaveBall) {
    const distToBasket = Math.sqrt(
      Math.pow(me.position.x - basketPos.x, 2) + 
      Math.pow(me.position.y - basketPos.y, 2)
    );
    
    // 检查防守压力
    let defenderPressure = 0;
    let nearestDefender = null;
    let minDefenderDist = Infinity;
    
    for (const opp of opponents) {
      const dist = Math.sqrt(
        Math.pow(opp.position.x - me.position.x, 2) +
        Math.pow(opp.position.y - me.position.y, 2)
      );
      if (dist < 2.5) {
        defenderPressure++;
        if (dist < minDefenderDist) {
          minDefenderDist = dist;
          nearestDefender = opp;
        }
      }
    }
    
    // 如果防守压力小且位置好，投篮
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
      
      for (const teammate of teammates) {
        const distToTeammate = Math.sqrt(
          Math.pow(teammate.position.x - me.position.x, 2) +
          Math.pow(teammate.position.y - me.position.y, 2)
        );
        
        const distToBasket = Math.sqrt(
          Math.pow(teammate.position.x - basketPos.x, 2) +
          Math.pow(teammate.position.y - basketPos.y, 2)
        );
        
        // 评分：距离适中 + 靠近篮筐 + 远离防守
        let score = 10 - distToTeammate * 0.5 - distToBasket * 0.3;
        
        // 检查队友是否被防守
        for (const opp of opponents) {
          const distToOpp = Math.sqrt(
            Math.pow(opp.position.x - teammate.position.x, 2) +
            Math.pow(opp.position.y - teammate.position.y, 2)
          );
          if (distToOpp < 2) {
            score -= 3; // 被防守扣分
          }
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestTarget = teammate;
        }
      }
      
      if (bestTarget && bestScore > 3) {
        return {
          type: 'PASS',
          target: bestTarget.id
        };
      }
    }
    
    // 否则向篮筐移动
    const dx = basketPos.x - me.position.x;
    const dy = basketPos.y - me.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      const moveDist = 2;
      return {
        type: 'MOVE',
        target: {
          x: me.position.x + (dx / dist) * moveDist,
          y: me.position.y + (dy / dist) * moveDist
        }
      };
    }
  }
  
  // === 无球决策 ===
  // 找到持球人
  const ballHolder = [...teammates, me].find(p => {
    const distToBall = Math.sqrt(
      Math.pow(p.position.x - ballPosition.x, 2) +
      Math.pow(p.position.y - ballPosition.y, 2)
    );
    return distToBall < 0.5;
  });
  
  // 如果队友持球，跑位接应
  if (ballHolder && ballHolder.id !== me.id) {
    const distToBallHolder = Math.sqrt(
      Math.pow(ballHolder.position.x - me.position.x, 2) +
      Math.pow(ballHolder.position.y - me.position.y, 2)
    );
    
    // 如果离持球人太远，靠近接应
    if (distToBallHolder > 6) {
      return {
        type: 'MOVE',
        target: {
          x: ballHolder.position.x + (Math.random() - 0.5) * 3,
          y: ballHolder.position.y + 2
        }
      };
    }
    
    // 否则跑位寻找空位（靠近篮筐但远离防守）
    const targetX = basketPos.x + (Math.random() - 0.5) * 8;
    const targetY = 3 + Math.random() * 5;
    
    return {
      type: 'MOVE',
      target: { x: targetX, y: targetY }
    };
  }
  
  // 对方持球，防守
  const opponentWithBall = opponents.find(opp => {
    const distToBall = Math.sqrt(
      Math.pow(opp.position.x - ballPosition.x, 2) +
      Math.pow(opp.position.y - ballPosition.y, 2)
    );
    return distToBall < 0.5;
  });
  
  if (opponentWithBall) {
    const distToOpponent = Math.sqrt(
      Math.pow(opponentWithBall.position.x - me.position.x, 2) +
      Math.pow(opponentWithBall.position.y - me.position.y, 2)
    );
    
    // 靠近抢断
    if (distToOpponent < 2 && Math.random() < 0.3) {
      return { type: 'STEAL' };
    }
    
    // 贴身防守
    if (distToOpponent < 4) {
      return {
        type: 'DEFEND',
        target: opponentWithBall.id
      };
    }
  }
  
  // 默认：向篮筐移动
  return {
    type: 'MOVE',
    target: {
      x: me.position.x + (basketPos.x - me.position.x) * 0.3,
      y: me.position.y + (basketPos.y - me.position.y) * 0.3
    }
  };
}

console.log(JSON.stringify(decide(gameState)));