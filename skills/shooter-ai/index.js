/**
 * Shooter AI - 神射手
 * 
 * 专注于投篮得分的 AI Agent
 */

const gameState = JSON.parse(process.env.GAME_STATE || '{}');

function decide(gameState) {
  const { me, iHaveBall, teammates, opponents } = gameState;
  const basketPos = { x: 7, y: 0 };
  
  if (iHaveBall) {
    // 计算到篮筐的距离
    const distToBasket = Math.sqrt(
      Math.pow(me.position.x - basketPos.x, 2) + 
      Math.pow(me.position.y - basketPos.y, 2)
    );
    
    // 检查防守压力
    let defenderPressure = 0;
    for (const opp of opponents) {
      const dist = Math.sqrt(
        Math.pow(opp.position.x - me.position.x, 2) +
        Math.pow(opp.position.y - me.position.y, 2)
      );
      if (dist < 2) {
        defenderPressure++;
      }
    }
    
    // 如果防守压力小，果断投篮
    if (defenderPressure === 0 && distToBasket < 8) {
      const isThreePoint = distToBasket > 5;
      return {
        type: 'SHOOT',
        power: isThreePoint ? 0.85 : 0.7
      };
    }
    
    // 如果被包夹，传给最近的队友
    if (defenderPressure >= 2) {
      let nearestTeammate = null;
      let minDist = Infinity;
      
      for (const teammate of teammates) {
        const dist = Math.sqrt(
          Math.pow(teammate.position.x - me.position.x, 2) +
          Math.pow(teammate.position.y - me.position.y, 2)
        );
        if (dist < minDist) {
          minDist = dist;
          nearestTeammate = teammate;
        }
      }
      
      if (nearestTeammate) {
        return {
          type: 'PASS',
          target: nearestTeammate.id
        };
      }
    }
    
    // 否则继续靠近篮筐
    return {
      type: 'MOVE',
      target: {
        x: basketPos.x + (Math.random() - 0.5) * 3,
        y: Math.max(2, me.position.y - 2)
      }
    };
  }
  
  // 无球时跑位寻找空位
  // 尝试跑到三分线外或篮下空位
  const targetX = 7 + (Math.random() - 0.5) * 8;
  const targetY = Math.random() > 0.5 ? 3 : 8; // 要么篮下，要么三分线
  
  return {
    type: 'MOVE',
    target: { x: targetX, y: targetY }
  };
}

console.log(JSON.stringify(decide(gameState)));