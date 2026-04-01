# Agent Basketball 测试流程

## 快速开始

### 1. 本地测试 Skill

```bash
# 进入 Skill 目录
cd skills/team-ai

# 设置测试环境变量
export GAME_STATE='{
  "team": "A",
  "score": {"A": 0, "B": 0},
  "timeRemaining": 300,
  "possession": true,
  "ballPosition": {"x": 7, "y": 10},
  "myPlayers": [
    {"id": "A1", "name": "A-控卫", "position": {"x": 4, "y": 10}, "stats": {"points": 0, "assists": 0, "rebounds": 0}, "iHaveBall": true},
    {"id": "A2", "name": "A-前锋", "position": {"x": 7, "y": 12}, "stats": {"points": 0, "assists": 0, "rebounds": 0}, "iHaveBall": false},
    {"id": "A3", "name": "A-中锋", "position": {"x": 10, "y": 10}, "stats": {"points": 0, "assists": 0, "rebounds": 0}, "iHaveBall": false}
  ],
  "opponentPlayers": [
    {"id": "B1", "name": "B-控卫", "position": {"x": 4, "y": 5}},
    {"id": "B2", "name": "B-前锋", "position": {"x": 7, "y": 3}},
    {"id": "B3", "name": "B-中锋", "position": {"x": 10, "y": 5}}
  ],
  "turnNumber": 1
}'

# 运行 Skill
node index.js
```

**预期输出**:
```json
[
  {"playerIndex": 0, "action": {"type": "MOVE", "target": {"x": 7.2, "y": 8}}},
  {"playerIndex": 1, "action": {"type": "MOVE", "target": {"x": 8.5, "y": 6}}},
  {"playerIndex": 2, "action": {"type": "MOVE", "target": {"x": 6.8, "y": 3.5}}}
]
```

---

### 2. 测试游戏引擎

```bash
# 进入 server 目录
cd server

# 安装依赖
npm install

# 运行 API 测试
node -e "
const { GameEngine } = require('./lib/game-engine');

const teamA = { name: 'team-ai', runtime: 'node', entrypoint: 'index.js' };
const teamB = { name: 'team-ai', runtime: 'node', entrypoint: 'index.js' };

const game = new GameEngine(teamA, teamB);
console.log('游戏创建成功');

const state = game.startGame();
console.log('比赛开始:', state.score);

// 运行 5 个回合
(async () => {
  for (let i = 0; i < 5; i++) {
    await game.runTurn();
    console.log(\`回合 \${i+1}: A \${game.gameState.score.A} - \${game.gameState.score.B} B\`);
  }
  console.log('测试完成');
})();
"
```

---

### 3. API 端点测试

```bash
# 1. 创建游戏
curl -X POST http://localhost:3000/api/game?action=create \
  -H "Content-Type: application/json" \
  -d '{
    "teamA": {"name": "team-ai", "runtime": "node", "entrypoint": "index.js"},
    "teamB": {"name": "team-ai", "runtime": "node", "entrypoint": "index.js"}
  }'

# 返回: {"success": true, "gameId": "game_xxx"}

# 2. 开始游戏
curl -X POST http://localhost:3000/api/game?action=start \
  -H "Content-Type: application/json" \
  -d '{"gameId": "game_xxx"}'

# 3. 执行回合
curl -X POST http://localhost:3000/api/game?action=turn \
  -H "Content-Type: application/json" \
  -d '{"gameId": "game_xxx"}'

# 4. 获取状态
curl "http://localhost:3000/api/game?action=state&gameId=game_xxx"
```

---

### 4. 前端界面测试

```bash
# 进入 web 目录
cd web

# 安装依赖
npm install

# 开发模式启动
npm run dev

# 访问 http://localhost:3001
```

**测试步骤**:
1. 点击「开始比赛」按钮
2. 观察记分牌更新
3. 查看球场球员位置
4. 点击「下一回合」或「自动」
5. 查看比赛日志

---

### 5. 完整端到端测试

```bash
# 启动后端
cd server && npm start

# 新开终端，启动前端
cd web && npm run dev

# 在浏览器中访问 http://localhost:3001
# 点击「开始比赛」→「自动」观看完整比赛
```

---

## 创建自定义 Agent

1. 复制 `skills/team-ai/` 文件夹
2. 修改 `agent.json` 中的配置
3. 在 `index.js` 中实现自己的决策逻辑
4. 使用上面的测试流程验证

## 调试技巧

- 使用 `console.log` 在 Skill 中输出调试信息
- 检查 API 返回的日志数组
- 使用浏览器开发者工具查看网络请求