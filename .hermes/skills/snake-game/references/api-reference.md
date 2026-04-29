---
title: "API 参考"
description: "贪吃蛇游戏类与方法完整API文档"
version: "1.0.0"
date: "2026-04-28"
category: "api"
tags: ["api", "reference", "javascript"]
---

# API 参考

## Utils 工具类

### 静态方法

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `randomInt(min, max)` | min, max | number | 范围内随机整数 |
| `randomChoice(arr)` | arr | any | 数组随机元素 |
| `clamp(val, min, max)` | val, min, max | number | 限制范围 |
| `formatTime(seconds)` | seconds | string | 秒转 MM:SS |
| `lerp(a, b, t)` | a, b, t | number | 线性插值 |
| `hexToRgb(hex)` | hex | object | 16进制转RGB |
| `easeOut(t)` | t | number | ease-out 缓动 |

## Snake 蛇类

### 构造函数

```javascript
new Snake(startX, startY, cellSize)
```

### 方法

| 方法 | 返回 | 说明 |
|------|------|------|
| `move()` | boolean | 移动一步 |
| `grow(amount)` | void | 增加待增长量 |
| `setDirection(dir)` | void | 设置方向 |
| `getHead()` | object | 获取头部坐标 |
| `getDirection()` | string | 获取当前方向 |
| `getLength()` | number | 获取长度 |
| `isAlive()` | boolean | 是否存活 |
| `checkBoundary(w, h)` | boolean | 边界检查 |
| `checkSelfCollision()` | boolean | 自身碰撞 |
| `checkFoodCollision(foodPos)` | boolean | 食物碰撞 |
| `checkObstacleCollision(obstacles)` | boolean | 障碍物碰撞 |

## Food 食物类

### 构造函数

```javascript
new Food(gridW, gridH, cellSize)
```

### 方法

| 方法 | 返回 | 说明 |
|------|------|------|
| `spawn(snakeBody, obstacles)` | boolean | 生成新食物 |
| `getPosition()` | object | 获取位置 |
| `getConfig()` | object | 获取当前类型配置 |
| `isExpired()` | boolean | 是否过期 |
| `draw(ctx)` | void | 绘制食物 |

### 食物类型

| 类型 | 颜色 | 分数 | 增长 | 概率 | 过期 |
|------|------|------|------|------|------|
| normal | #00ff88 | 10 | 1 | 80% | 无 |
| bonus | #ffd700 | 30 | 2 | 15% | 8s |
| speed | #ff4444 | 50 | 1 | 5% | 5s |

## Game 游戏类

### 构造函数

```javascript
new Game(canvasId)
```

### 方法

| 方法 | 说明 |
|------|------|
| `startGame(difficulty)` | 开始游戏 |
| `pauseGame()` | 暂停游戏 |
| `resumeGame()` | 继续游戏 |
| `quitGame()` | 退出游戏 |
| `setDirection(direction)` | 设置方向 |
| `render()` | 渲染帧 |
| `updateGame()` | 更新游戏逻辑 |
| `updateTimer()` | 更新计时器 |

### 难度配置

| 属性 | 类型 | 说明 |
|------|------|------|
| `difficulty` | number | 当前难度 (1-3) |
| `score` | number | 当前得分 |
| `state` | string | 游戏状态 |
| `snake` | Snake | 蛇实体 |
| `food` | Food | 食物实体 |
