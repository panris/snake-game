/**
 * 🍎 食物类
 * 管理食物的生成、类型和视觉效果
 */
class Food {
    constructor(gridWidth, gridHeight, cellSize) {
        this.gridW = gridWidth;
        this.gridH = gridHeight;
        this.cellSize = cellSize;
        this.position = { x: 0, y: 0 };
        this.type = 'normal'; // normal, bonus, speed
        this.spawnTime = 0;
        this.glowPhase = 0;

        // 食物类型配置
        this.types = {
            normal: {
                color: '#00ff88',
                glowColor: 'rgba(0, 255, 136, 0.5)',
                score: 10,
                grow: 1,
                probability: 0.8
            },
            bonus: {
                color: '#ffd700',
                glowColor: 'rgba(255, 215, 0, 0.6)',
                score: 30,
                grow: 2,
                probability: 0.15,
                duration: 8000 // 8秒后消失
            },
            speed: {
                color: '#ff2d95',
                glowColor: 'rgba(255, 45, 149, 0.5)',
                score: 20,
                grow: 1,
                probability: 0.05,
                duration: 5000 // 5秒后消失
            }
        };
    }

    /**
     * 随机生成食物位置
     * @param {Array} snakeBody 蛇身坐标数组
     * @param {Array} obstacles 障碍物坐标数组
     */
    spawn(snakeBody = [], obstacles = []) {
        const occupied = new Set();

        // 标记蛇身占用的格子
        snakeBody.forEach(seg => {
            occupied.add(`${seg.x},${seg.y}`);
        });

        // 标记障碍物占用的格子
        obstacles.forEach(obs => {
            occupied.add(`${obs.x},${obs.y}`);
        });

        // 找到所有可用位置（排除边界格子，避免吃到后撞墙）
        // 同时检查：上下左右至少有一个方向被阻挡（蛇身/障碍物/边界），避免食物在开阔区域孤立出现
        const available = [];
        for (let x = 1; x < this.gridW - 1; x++) {
            for (let y = 1; y < this.gridH - 1; y++) {
                if (occupied.has(`${x},${y}`)) continue;

                // 检查四个方向是否至少有一个被阻挡
                const blocked = {
                    up:    y === 1          || occupied.has(`${x},${y - 1}`),
                    down:  y === this.gridH - 2 || occupied.has(`${x},${y + 1}`),
                    left:  x === 1          || occupied.has(`${x - 1},${y}`),
                    right: x === this.gridW - 2 || occupied.has(`${x + 1},${y}`),
                };

                if (blocked.up || blocked.down || blocked.left || blocked.right) {
                    available.push({ x, y });
                }
            }
        }

        console.log('[Food.spawn] 可用位置数量:', available.length, '网格:', this.gridW, 'x', this.gridH, '排除边界: 1 到', this.gridW - 2);

        if (available.length === 0) {
            // 无可用位置，游戏应该结束
            return false;
        }

        // 随机选择位置（防御：available 不为空）
        if (available.length > 0) {
            this.position = Utils.randomChoice(available);
        } else {
            return false;
        }

        // 随机选择食物类型
        const rand = Math.random();
        let cumProb = 0;
        for (const [typeName, config] of Object.entries(this.types)) {
            cumProb += config.probability;
            if (rand <= cumProb) {
                this.type = typeName;
                break;
            }
        }

        this.spawnTime = Date.now();
        this.glowPhase = 0;

        return true;
    }

    /**
     * 检查食物是否过期（特殊食物有时效）
     */
    isExpired() {
        const config = this.types[this.type];
        if (!config.duration) return false;
        return Date.now() - this.spawnTime > config.duration;
    }

    /**
     * 获取食物配置
     */
    getConfig() {
        return this.types[this.type];
    }

    /**
     * 更新发光动画相位
     */
    update(deltaTime) {
        this.glowPhase += deltaTime * 0.005;
    }

    /**
     * 绘制食物
     */
    draw(ctx) {
        const config = this.types[this.type];
        const x = this.position.x * this.cellSize + this.cellSize / 2;
        const y = this.position.y * this.cellSize + this.cellSize / 2;
        const radius = this.cellSize * 0.35;

        // 发光效果
        const glowIntensity = 0.5 + Math.sin(this.glowPhase) * 0.3;
        ctx.save();

        // 外发光
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.5);
        gradient.addColorStop(0, config.glowColor);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 食物主体
        ctx.fillStyle = config.color;
        ctx.shadowColor = config.color;
        ctx.shadowBlur = 15 * glowIntensity;

        if (this.type === 'normal') {
            // 普通食物 - 圆形
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'bonus') {
            // 奖励食物 - 星形
            this.drawStar(ctx, x, y, radius * 1.2, 5);
        } else if (this.type === 'speed') {
            // 速度食物 - 菱形
            this.drawDiamond(ctx, x, y, radius * 1.3);
        }

        ctx.restore();
    }

    /**
     * 绘制星形
     */
    drawStar(ctx, cx, cy, outerRadius, points) {
        const innerRadius = outerRadius * 0.4;
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }

    /**
     * 绘制菱形
     */
    drawDiamond(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size, y);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * 获取食物位置
     */
    getPosition() {
        return { ...this.position };
    }
}
