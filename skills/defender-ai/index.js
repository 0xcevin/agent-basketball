/**
 * Defender AI - 防守专家
 * 
 * 专注于防守、抢断的篮球 AI Agent
 */

const gameState = JSON.parse(process.env.GAME_STATE || '{}');

function decide(gameState) {
  const { me, iHaveBall, teammates, opponents, ballPosition } = gameState;
  
  // 找到最近的对手（对位防守人）
  let nearestOpponent = null;
  let minOppDist = Infinity;
  
  for (const opp of opponents) {
    const dist = Math.sqrt(
      Math.pow(opp.position.x - me.position.x, 2) +
      Math.pow(opp.position.y - me.position.y, 2)
    );
    if (dist < minOppDist) {
      minOppDist = dist;
      nearestOpponent = opp;
    }
  }
  
  if (iHaveBall) {
    // 持球时：快速出球给队友，专注防守
    // 找到最近的队友传球
    let nearestTeammate = null;
    let minTeamDist = Infinity;
    
    for (const teammate of teammates) {
      const dist = Math.sqrt(
        Math.pow(teammate.position.x - me.position.x, 2) +
        Math.pow(teammate.position.y - me.position.y, 2)
      );
      if (dist < minTeamDist && dist < 5) {
        minTeamDist = dist;
        nearestTeammate = teammate;
      }
    }
    
    if (nearestTeammate) {
      return {
        type: 'PASS',
        target: nearestTeammate.id
      };
    }
    
    // 没有好传球机会，随便投一个
    return {
      type: 'SHOOT',
      power: 0.5
    };
  }
  
  // 无球时：防守
  // 如果对方持球人离我很近，尝试抢断
  let ballHandler = null;
  for (const opp of opponents) {
    const distToBall = Math.sqrt(
      Math.pow(opp.position.x - ballPosition.x, 2) +
      Math.pow(opp.position.y - ballPosition.y, 2)
    );
    if (distToBall < 0.5) {
      ballHandler = opp;
      break;
    }
  }
  
  if (ballHandler) {
    const distToBallHandler = Math.sqrt(
      Math.pow(ballHandler.position.x - me.position.x, 2) +
      Math.pow(ballHandler.position.y - me.position.y, 2)
    );
    
    // 在防守范围内，尝试抢断或紧贴
    if (distToBallHandler < 2) {
      // 有一定概率尝试抢断
      if (Math.random() < 0.4) {
        return {
          type: 'STEAL'
        };
      }
      
      // 否则紧贴防守
      return {
        type: 'DEFEND',
        target: ballHandler.id
      };
    }
    
    // 向持球人移动
    return {
      type: 'MOVE',
      target: {
        x: ballHandler.position.x + (Math.random() - 0.5),
        y: ballHandler.position.y + (Math.random() - 0.5)
      }
    };
  }
  
  // 默认：对位防守最近的对手
  if (nearestOpponent) {
    return {
      type: 'DEFEND',
      target: nearestOpponent.id
    };
  }
  
  // 移动到球场中央防守
  return {
    type: 'MOVE',
    target: { x: 7, y: 3 }
  };
}

console.log(JSON.stringify(decide(gameState)));