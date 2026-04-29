---
title: "数据模型"
description: "贪吃蛇游戏核心数据实体与状态设计"
version: "1.0.0"
date: "2026-04-28"
category: "data-model"
tags: ["data-model", "entity", "state"]
---

# 数据模型

## 1. SnakeEntity 蛇实体

```typescript
interface SnakeEntity {
  body: Position[];           // 身体节点列表
  direction: Direction;       // 当前方向
  nextDirection: Direction;   // 下一步方向
  growPending: number;        // 待增长量
  alive: boolean;             // 生存状态
  cellSize: number;           // 网格大小
  trail: TrailPoint[];        // 尾迹
  lastMoveTime: number;       // 上次移动时间
}

type Direction = 'up' | 'down' | 'left' | 'right';

interface Position {
  x: number;
  y: number;
}

interface TrailPoint {
  x: number;
  y: number;
  life: number;
}
```

## 2. FoodEntity 食物实体

```typescript
interface FoodEntity {
  position: Position;         // 当前位置
  type: FoodType;             // 食物类型
  spawnTime: number;          // 生成时间戳
  glowPhase: number;          // 发光相位
  gridW: number;              // 网格宽度
  gridH: number;              // 网格高度
  cellSize: number;           // 网格大小
  types: FoodTypeConfig[];    // 食物类型配置
}

type FoodType = 'normal' | 'bonus' | 'speed';

interface FoodTypeConfig {
  color: string;              // 主颜色
  glowColor: string;          // 发光颜色
  score: number;              // 分数
  grow: number;               // 增长量
  probability: number;        // 生成概率
  duration?: number;          // 存活时间(ms)
}
```

## 3. GameState 游戏状态

```typescript
interface GameState {
  state: 'menu' | 'playing' | 'paused' | 'gameover';
  difficulty: number;         // 1 | 2 | 3
  score: number;              // 当前得分
  elapsedTime: number;        // 已用时间(秒)
  startTime: number;          // 开始时间戳
  moveAccumulator: number;    // 移动累积器
  lastFrameTime: number;      // 上次帧时间
  gameLoopId: number | null;  // 循环ID
  timerInterval: number | null; // 计时器ID
  gridW: number;              // 网格宽(20)
  gridH: number;              // 网格高(20)
  cellSize: number;           // 单元格大小(px)
  particles: Particle[];      // 粒子列表
  obstacles: Position[];      // 障碍物列表
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  color: string;
  size: number;
}
```

## 4. DifficultyConfig 难度配置

```typescript
interface DifficultyConfig {
  name: string;               // 显示名称
  icon: string;               // 图标
  targetLength: number;       // 目标长度
  timeLimit: number;          // 时间限制(秒)
  moveInterval: number;       // 移动间隔(ms)
  obstacleCount: number;      // 障碍物数量
  obstacleComplexity: number; // 障碍物复杂度
  passRate: string;           // 通过率显示
}
```

## 5. CooldownState 冷却状态

```typescript
interface CooldownState {
  consecutiveFailures: number;  // 连续失败次数
  lastFailureTime: number;      // 上次失败时间
  cooldownDuration: number;     // 冷却时长(ms)
  maxFailures: number;          // 触发冷却的失败次数
}
```
