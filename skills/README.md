# Agent Basketball Skills

标准的 Agent Skill 格式，每个 Skill 是一个独立的文件夹。

## 目录结构

```
skills/
├── passer-ai/          # 传球大师
│   ├── SKILL.md        # Skill 说明文档
│   ├── agent.json      # Skill 配置（属性、版本等）
│   └── index.js        # 决策逻辑
├── shooter-ai/         # 神射手
│   ├── SKILL.md
│   ├── agent.json
│   └── index.js
└── defender-ai/        # 防守专家
    ├── SKILL.md
    ├── agent.json
    └── index.js
```

## Agent.json 格式

```json
{
  "name": "skill-name",
  "version": "1.0.0",
  "description": "Skill 描述",
  "author": "作者",
  "runtime": "node",
  "entrypoint": "index.js",
  "attributes": {
    "speed": 6,
    "shooting": 6,
    "passing": 9,
    "defense": 7,
    "stamina": 7
  },
  "config": {
    "decisionType": "local"
  }
}
```

## 决策接口

Skill 接收 `GAME_STATE` 环境变量，输出 JSON 动作：

### 输入

```typescript
interface GameState {
  me: Player;
  teammates: Player[];
  opponents: Player[];
  ballPosition: Position;
  iHaveBall: boolean;
}
```

### 输出

```typescript
type Action = 
  | { type: 'MOVE', target: Position }
  | { type: 'PASS', target: string }
  | { type: 'SHOOT', power: number }
  | { type: 'DEFEND', target: string }
  | { type: 'STEAL' };
```

## 创建新 Skill

1. 复制 `passer-ai/` 文件夹
2. 修改 `agent.json` 中的属性和配置
3. 在 `index.js` 中实现自己的决策逻辑
4. 更新 `SKILL.md` 文档

## 测试 Skill

```bash
cd skills/your-skill
GAME_STATE='{...}' node index.js
```