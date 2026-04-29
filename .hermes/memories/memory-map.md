# Hermes Memory Map - Snake Game

## 项目信息

- **项目名称**: 贪吃蛇 - 极限挑战
- **路径**: `/Users/panris/Projects/snake-game/`
- **服务器**: `http://localhost:8888`
- **版本**: v1.0.0

## 目录结构

严格复用 Hermes 官方目录结构（`~/.hermes/` 的镜像）：

```
snake-game/
├── src/                    # 游戏源码
│   ├── core/               # snake.js, food.js, utils.js
│   └── engine/             # game.js
├── styles/                 # 样式
├── tests/                  # 测试
├── index.html              # 入口
└── .hermes/                # 复用 Hermes 官方目录结构
    ├── skills/             # 技能（文本层）
    │   └── snake-game/
    │       ├── SKILL.md
    │       └── references/
    │           ├── requirements.md
    │           ├── architecture.md
    │           ├── api-reference.md
    │           ├── data-model.md
    │           └── changelog.md
    ├── memories/           # 记忆地图
    ├── sessions/           # 会话记录（官方标准目录）
    ├── logs/               # 日志
    └── profiles/           # 配置文件（官方标准目录）
```

## Hermes 内置能力

| 需求 | 工具 | 说明 |
|------|------|------|
| 文档读取 | `skill_view('snake-game')` | 自动读取 skills/ 下的 SKILL.md + references/ |
| 文档增量更新 | `skill_manage(action='patch')` | Hermes 原生增量维护 |
| 知识检索 | `session_search('关键词')` | 向量检索历史会话 |
| 记忆读写 | `memory(target='memory', action='...')` | 持久化到 .hermes/memories/ |
| 计划管理 | `plan` skill | 写入 .hermes/plans/ |

## 关键配置

| 难度 | 目标长度 | 时间 | 移动间隔 | 障碍物 |
|------|----------|------|----------|--------|
| 1 简单 | 20 | 9分钟 | 180ms | 0 |
| 2 中等 | 35 | 5分钟 | 120ms | 3 |
| 3 困难 | 50 | 2分钟 | 75ms | 5 |

## 游戏状态调试

```javascript
window.game.state              // 'menu' | 'playing' | 'paused' | 'gameover'
window.game.score              // 得分
window.game.snake.getLength()  // 蛇长
window.game.difficulty         // 1 | 2 | 3
```

## 已知问题

- **吃到食物停止**: 代码逻辑正常，已通过自动导航测试验证。
