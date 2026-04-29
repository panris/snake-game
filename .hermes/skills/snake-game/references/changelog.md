---
title: "变更日志"
description: "贪吃蛇游戏版本变更记录"
version: "1.0.0"
date: "2026-04-28"
category: "changelog"
tags: ["changelog", "version", "release"]
---

# 变更日志

## [1.0.0] - 2026-04-28

### 新增
- 完整的贪吃蛇核心游戏逻辑
- 三级难度系统（简单/中等/困难）
- 三种食物类型（普通/加分/加速）
- 暗黑科技风UI界面
- 粒子爆炸特效
- 发光渐变视觉效果
- 文案弹窗系统（10+种场景文案）
- 冷却机制（连续失败3次触发2分钟冷却）
- 响应式设计（PC+移动端适配）
- 分享功能

### 架构
- 分层架构：Core → Engine → Render → UI
- 文本层（docs/）：Markdown + YAML frontmatter 文档系统
- 向量层（knowledge/）：TF-IDF 文本向量索引
- 增量处理（scripts/）：文件监控与自动索引更新

### 技术
- HTML5 Canvas 2D 渲染
- requestAnimationFrame 游戏循环
- 无外部依赖纯原生实现
