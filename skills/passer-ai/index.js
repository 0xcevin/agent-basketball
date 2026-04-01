/**
 * 示例 Local Skill - Passer AI
 * 
 * 擅长传球的组织型球员
 */

const gameState = JSON.parse(process.env.GAME_STATE || '{}');

function decide(gameState) {
  const { me, iHaveBall, teammates, opponents } = gameState;
  
  if (iHaveBall) {
    // 寻找最佳传球目标
    let bestPassTarget = null;
    let bestPassScore = -Infinity;
    
    for (const teammate of teammates) {
      // 计算队友到篮筐的距离
      const distToBasket = Math.sqrt(
        Math.pow(teammate.position.x - 7, 2) + 
        Math.pow(teammate.position.y - 0, 2)
      );
      
      // 计算最近的防守者距离
      let minDefenderDist = Infinity;
      for (const opp of opponents) {
        const dist = Math.sqrt(
          Math.pow(opp.position.x - teammate.position.x, 2) +
          Math.pow(opp.position.y - teammate.position.y, 2)
        );
        minDefenderDist = Math.min(minDefenderDist, dist);
      }
      
      // 传球评分：离篮筐近 + 防守者远
      const score = (10 - distToBasket) + minDefenderDist;
      
      if (score > bestPassScore) {
        bestPassScore = score;
        bestPassTarget = teammate;
      }
    }
    
    // 如果有好的传球机会，传
    if (bestPassTarget && bestPassScore > 8) {
      return {
        type: 'PASS',
        target: bestPassTarget.id
      };
    }
    
    // 否则自己突破或投
    const myDistToBasket = Math.sqrt(
      Math.pow(me.position.x - 7, 2) + 
      Math.pow(me.position.y - 0, 2)
    );
    
    if (myDistToBasket < 4) {
      return { type: 'SHOOT', power: 0.65 };
    }
    
    return {
      type: 'MOVE',
      target: {
        x: 7,
        y: Math.max(3, me.position.y - 3)
      }
    };
  }
  
  // 无球时给持球人挡拆或拉开空间
  const ballHolder = teammates.find(t => 
    Math.abs(t.position.x - gameState.ballPosition.x) < 0.5 &&
    Math.abs(t.position.y - gameState.ballPosition.y) < 0.5
  );
  
  if (ballHolder) {
    // 给持球人挡拆位置
    return {
      type: 'MOVE',
      target: {
        x: ballHolder.position.x + 2,
        y: ballHolder.position.y + 2
      }
    };
  }
  
  return {
    type: 'MOVE',
    target: {
      x: 7 + (Math.random() - 0.5) * 6,
      y: 6 + Math.random() * 4
    }
  };
}

console.log(JSON.stringify(decide(gameState)));