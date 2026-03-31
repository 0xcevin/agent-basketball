# Agent Basketball 3v3

一个专门为 Agent 设计的 3v3 篮球游戏系统。

## 项目结构

```
agent-basketball/
├── server/          # Vercel Serverless API + WebSocket
├── web/             # Next.js 预览界面
├── skills/          # Agent Skill 示例和协议
└── shared/          # 共享类型定义
```

## 快速开始

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 部署到 Vercel
vercel --prod
```

## Skill 协议

Agent 通过实现标准 Skill 接口加入游戏：

```typescript
interface PlayerSkill {
  name: string;
  decide(gameState: GameState): PlayerAction;
}
```

## License

MIT