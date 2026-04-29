/**
 * 🐍 Snake 类
 * 管理蛇的移动、生长、绘制和轨迹效果
 */
class Snake {
    constructor(startX, startY, cellSize) {
        this.cellSize = cellSize;
        this.reset(startX, startY);
        this.trails = []; // 轨迹粒子
        this.moveTime = 0;
        this.lastMoveTime = 0;
    }

    /**
     * 重置蛇状态
     */
    reset(x, y) {
        this.body = [
            { x, y },           // 头部
            { x: x - 1, y },    // 身体 - 放在左边（后方）
            { x: x - 2, y }     // 尾部 - 放在左边（后方）
        ];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.growPending = 0;
        this.alive = true;
        this.trails = [];
    }

    /**
     * 设置下一个移动方向
     */
    setDirection(dir) {
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };
        // 不允许反向移动
        if (opposites[dir] !== this.direction) {
            this.nextDirection = dir;
        }
    }

    /**
     * 获取当前方向
     */
    getDirection() {
        return this.direction;
    }

    /**
     * 移动一步
     */
    move() {
        if (!this.alive) return false;

        this.direction = this.nextDirection;

        const head = { ...this.body[0] };
        const dirs = {
            'up': { x: 0, y: -1 },
            'down': { x: 0, y: 1 },
            'left': { x: -1, y: 0 },
            'right': { x: 1, y: 0 }
        };

        const delta = dirs[this.direction];
        head.x += delta.x;
        head.y += delta.y;

        // 添加轨迹
        this.addTrail(this.body[0]);

        // 移动身体
        this.body.unshift(head);

        // 处理生长
        if (this.growPending > 0) {
            this.growPending--;
        } else {
            this.body.pop();
        }

        this.lastMoveTime = Date.now();
        return true;
    }

    /**
     * 添加生长请求
     */
    grow(amount = 1) {
        this.growPending += amount;
    }

    /**
     * 获取头部位置
     */
    getHead() {
        return { ...this.body[0] };
    }

    /**
     * 获取身体（不含头部）
     */
    getBody() {
        return this.body.slice(1);
    }

    /**
     * 获取完整身体
     */
    getFullBody() {
        return this.body.map(seg => ({ ...seg }));
    }

    /**
     * 获取长度
     */
    getLength() {
        return this.body.length;
    }

    /**
     * 检查头部是否与身体碰撞
     */
    checkSelfCollision() {
        const head = this.body[0];
        for (let i = 1; i < this.body.length; i++) {
            if (head.x === this.body[i].x && head.y === this.body[i].y) {
                return true;
            }
        }
        return false;
    }

    /**
     * 检查头部是否在边界内
     */
    checkBoundary(gridW, gridH) {
        const head = this.body[0];
        return head.x >= 0 && head.x < gridW && head.y >= 0 && head.y < gridH;
    }

    /**
     * 检查头部是否与障碍物碰撞
     */
    checkObstacleCollision(obstacles) {
        const head = this.body[0];
        return obstacles.some(obs => head.x === obs.x && head.y === obs.y);
    }

    /**
     * 检查头部是否与食物碰撞
     */
    checkFoodCollision(foodPosition) {
        const head = this.body[0];
        return head.x === foodPosition.x && head.y === foodPosition.y;
    }

    /**
     * 添加轨迹效果
     */
    addTrail(pos) {
        this.trails.push({
            x: pos.x * this.cellSize + this.cellSize / 2,
            y: pos.y * this.cellSize + this.cellSize / 2,
            alpha: 0.6,
            scale: 1,
            life: 1.0
        });
    }

    /**
     * 更新轨迹
     */
    updateTrails(deltaTime) {
        this.trails = this.trails.filter(t => {
            t.life -= deltaTime * 0.003;
            t.alpha = t.life * 0.6;
            t.scale = 1 - (1 - t.life) * 0.5;
            return t.life > 0;
        });
    }

    /**
     * 绘制蛇
     */
    draw(ctx) {
        // 绘制轨迹
        this.drawTrails(ctx);

        // 绘制身体
        for (let i = this.body.length - 1; i >= 0; i--) {
            const seg = this.body[i];
            const x = seg.x * this.cellSize + this.cellSize / 2;
            const y = seg.y * this.cellSize + this.cellSize / 2;
            const radius = this.cellSize * 0.42;

            ctx.save();

            if (i === 0) {
                // 头部 - 更大更亮，带发光
                this.drawHead(ctx, x, y, radius * 1.1);
            } else {
                // 身体段
                const bodyAlpha = 1 - (i / this.body.length) * 0.3;
                const bodyRadius = radius * (1 - (i / this.body.length) * 0.15);

                // 身体渐变
                const gradient = ctx.createRadialGradient(
                    x, y, 0,
                    x, y, bodyRadius
                );
                gradient.addColorStop(0, `rgba(0, 255, 136, ${bodyAlpha})`);
                gradient.addColorStop(1, `rgba(0, 200, 100, ${bodyAlpha * 0.7})`);

                ctx.fillStyle = gradient;
                ctx.shadowColor = 'rgba(0, 255, 136, 0.3)';
                ctx.shadowBlur = 8;

                ctx.beginPath();
                ctx.arc(x, y, bodyRadius, 0, Math.PI * 2);
                ctx.fill();

                // 身体纹理
                ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + (i % 2) * 0.05})`;
                ctx.beginPath();
                ctx.arc(x, y, bodyRadius * 0.4, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    /**
     * 绘制蛇头
     */
    drawHead(ctx, x, y, radius) {
        // 头部发光
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
        glowGradient.addColorStop(0, 'rgba(0, 255, 136, 0.3)');
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
        ctx.fill();

        // 头部主体
        const headGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        headGradient.addColorStop(0, '#88ffcc');
        headGradient.addColorStop(0.5, '#00ff88');
        headGradient.addColorStop(1, '#00cc6a');

        ctx.fillStyle = headGradient;
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 20;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // 眼睛
        const eyeOffset = radius * 0.35;
        const eyeRadius = radius * 0.22;
        const eyePositions = this.getEyePositions(x, y, eyeOffset);

        ctx.shadowBlur = 0;

        eyePositions.forEach(eye => {
            // 眼白
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(eye.x, eye.y, eyeRadius, 0, Math.PI * 2);
            ctx.fill();

            // 瞳孔
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(eye.x, eye.y, eyeRadius * 0.5, 0, Math.PI * 2);
            ctx.fill();

            // 高光
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(eye.x - eyeRadius * 0.2, eye.y - eyeRadius * 0.2, eyeRadius * 0.2, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    /**
     * 根据方向计算眼睛位置
     */
    getEyePositions(cx, cy, offset) {
        const dirs = {
            'up': [{ x: cx - offset, y: cy - offset }, { x: cx + offset, y: cy - offset }],
            'down': [{ x: cx - offset, y: cy + offset }, { x: cx + offset, y: cy + offset }],
            'left': [{ x: cx - offset, y: cy - offset }, { x: cx - offset, y: cy + offset }],
            'right': [{ x: cx + offset, y: cy - offset }, { x: cx + offset, y: cy + offset }]
        };
        return dirs[this.direction] || dirs['right'];
    }

    /**
     * 绘制轨迹
     */
    drawTrails(ctx) {
        this.trails.forEach(trail => {
            ctx.save();
            ctx.globalAlpha = trail.alpha;
            ctx.fillStyle = 'rgba(0, 255, 136, 0.5)';
            ctx.beginPath();
            ctx.arc(trail.x, trail.y, this.cellSize * 0.2 * trail.scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    /**
     * 标记死亡
     */
    die() {
        this.alive = false;
    }

    /**
     * 是否存活
     */
    isAlive() {
        return this.alive;
    }
}
