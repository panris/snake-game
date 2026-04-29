---
title: "架构设计"
description: "贪吃蛇游戏分层架构设计文档"
version: "1.0.0"
date: "2026-04-28"
category: "architecture"
tags: ["architecture", "design", "layered"]
---

# 架构设计

## 1. 整体架构

```
┌─────────────────────────────────────────────────────┐
│                    UI Layer                         │
│         (Screens, Controls, Events)                 │
├─────────────────────────────────────────────────────┤
│                  Engine Layer                       │
│     (Game Loop, State Machine, Collision)           │
├─────────────────────────────────────────────────────┤
│                  Render Layer                       │
│   (Canvas Renderer, Particles, Animations)          │
├─────────────────────────────────────────────────────┤
│                   Core Layer                        │
│      (Snake, Food, Grid, Utils)                     │
└─────────────────────────────────────────────────────┘
```

## 2. 分层说明

### 2.1 Core Layer（核心层）
纯数据与算法，无渲染、无DOM操作。

| 模块 | 职责 | 文件 |
|------|------|------|
| Snake | 蛇实体：移动、增长、碰撞检测 | `src/core/snake.js` |
| Food | 食物实体：生成、类型、过期 | `src/core/food.js` |
| Utils | 工具函数：随机、格式化、数学 | `src/core/utils.js` |

### 2.2 Engine Layer（引擎层）
游戏逻辑控制，协调核心层与渲染层。

| 模块 | 职责 | 文件 |
|------|------|------|
| Game | 游戏主控：循环、状态、难度 | `src/engine/game.js` |

### 2.3 Render Layer（渲染层）
负责视觉呈现（预留扩展）。

| 模块 | 职责 | 文件 |
|------|------|------|
| Renderer | Canvas 绘制（当前集成在 Game 中） | `src/render/` |
| Particles | 粒子特效 | `src/render/particles.js` |

### 2.4 UI Layer（UI层）
用户界面与交互（预留扩展）。

| 模块 | 职责 | 文件 |
|------|------|------|
| Screens | 屏幕管理 | `src/ui/screens.js` |
| Controls | 输入控制 | `src/ui/controls.js` |

## 3. 数据流

```
用户输入 → UI Layer → Engine Layer → Core Layer
                                      ↓
                                 状态更新
                                      ↓
Render Layer ← Engine Layer ← 状态变更
```

## 4. 模块依赖

```
engine/game.js
  ├── core/snake.js
  ├── core/food.js
  └── core/utils.js
```

无循环依赖，上层依赖下层，下层不依赖上层。

## 5. 扩展点

- 新增难度：修改 `difficultyConfigs`
- 新增食物类型：扩展 `Food.types`
- 新增渲染效果：扩展 `Render Layer`
- 新增控制方式：扩展 `UI Layer`
