---
name: snake-game
description: "超酷炫动感的H5贪吃蛇游戏 - 复用 Hermes 内置能力"
version: "1.0.0"
author: Hermes Agent
date: "2026-04-28"
category: game
tags: ["snake", "h5", "canvas", "game"]
---

# 🐍 贪吃蛇 - 极限挑战

> 经典玩法，分级难度，挑战极限

## 项目简介

本项目是一款基于 HTML5 Canvas 的贪吃蛇游戏，复用 Hermes Agent 内置能力进行文档管理、知识检索和增量处理。

## 快速开始

```bash
# 启动本地服务器
python3 -m http.server 8888

# 浏览器打开
open http://localhost:8888
```

## 项目架构

```
snake-game/
├── src/                    # 游戏源码
│   ├── core/               # snake.js, food.js, utils.js
│   └── engine/             # game.js
├── styles/                 # 样式
├── tests/                  # 测试
├── index.html              # 入口
└── .hermes/                # Hermes 内置目录（复用）
    ├── skills/             # 文本层
    │   └── snake-game/
    │       ├── SKILL.md
    │       └── references/
    ├── memories/           # 记忆地图
    ├── plans/              # 计划
    └── logs/               # 日志
```

## Hermes 内置能力复用

| 需求 | Hermes 原生能力 | 使用方式 |
|------|----------------|---------|
| 文档阅读 | `skill_view` | 自动读取 `references/*.md` |
| 文档编辑 | `skill_manage` | `patch` / `edit` 增量更新 |
| 知识检索 | `session_search` | 搜索历史会话上下文 |
| 向量搜索 | `docs-vector-indexing` skill | Hermes 内置 skill 支持 |
| 记忆持久化 | `memory` tool | 读写 `.hermes/memories/` |
| 计划管理 | `plan` skill | 写入 `.hermes/plans/` |

## 难度模式

| 等级 | 名称 | 目标长度 | 时间限制 | 移动间隔 | 通过率 | 描述 |
|------|------|----------|----------|----------|--------|------|
| 1 | 简单模式 | 20 | 9分钟 | 180ms | 1% | 适合新手入门 |
| 2 | 中等模式 | 35 | 5分钟 | 120ms | 1‱ | 考验反应速度 |
| 3 | 困难模式 | 50 | 2分钟 | 75ms | 1‱‱ | 真正的极限挑战 |

## 技术栈

- HTML5 Canvas 2D 渲染
- Vanilla JavaScript (ES6+)
- CSS3 动画与特效
- 无外部依赖

## 参考文档

存放于 `.hermes/skills/snake-game/references/`，Hermes `skill_view` 自动索引：

- [requirements.md](./references/requirements.md) - 需求规格
- [architecture.md](./references/architecture.md) - 架构设计
- [api-reference.md](./references/api-reference.md) - API 参考
- [data-model.md](./references/data-model.md) - 数据模型
- [changelog.md](./references/changelog.md) - 变更日志

## 许可证

MIT License
