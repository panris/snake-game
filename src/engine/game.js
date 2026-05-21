/**
 * 🎮 游戏主引擎
 * 管理游戏状态、难度系统、胜负判定、冷却机制、文案反馈等
 */

class SnakeGame {
    constructor() {
        // 画布设置
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // 网格配置
        this.gridSize = 20;
        this.cellSize = 20;
        this.gridW = 0;
        this.gridH = 0;

        // 游戏状态
        this.state = 'menu'; // menu, countdown, playing, paused, gameover, victory
        this.difficulty = 1;
        this.score = 0;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.gameLoopId = null;
        this.lastFrameTime = 0;
        this.moveAccumulator = 0;

        // 游戏对象
        this.snake = null;
        this.food = null;
        this.obstacles = [];
        this.particles = [];

        // 难度配置
        this.difficultyConfigs = {
            1: {
                name: '简单模式',
                icon: '🎯',
                timeLimit: 540, // 9分钟
                moveInterval: 180, // 毫秒
                targetLength: 20,
                obstacleCount: 0,
                obstacleComplexity: 0,
                passRate: '1%',
                food: {
                    normal: { score: 10, grow: 1 },
                    bonus: { score: 30, grow: 2, duration: 12000 },
                    speed: { score: 20, grow: 1, duration: 6000 }
                }
            },
            2: {
                name: '中等模式',
                icon: '⚡',
                timeLimit: 300, // 5分钟
                moveInterval: 110,
                targetLength: 35,
                obstacleCount: 5,
                obstacleComplexity: 1,
                passRate: '1‱',
                food: {
                    normal: { score: 15, grow: 1 },
                    bonus: { score: 40, grow: 2, duration: 9000 },
                    speed: { score: 25, grow: 1, duration: 5000 }
                }
            },
            3: {
                name: '困难模式',
                icon: '🔥',
                timeLimit: 120, // 2分钟
                moveInterval: 75,
                targetLength: 50,
                obstacleCount: 12,
                obstacleComplexity: 2,
                passRate: '1‱‱',
                food: {
                    normal: { score: 20, grow: 1 },
                    bonus: { score: 50, grow: 2, duration: 7000 },
                    speed: { score: 30, grow: 1, duration: 4000 }
                }
            }
        };

        // 文案库
        this.quotes = {
            victory: [
                '太厉害了！你是真正的蛇王！👑',
                '完美通关！你的操作令人叹为观止！🌟',
                '难以置信的速度与技巧！你就是传奇！🔥',
                '惊人的表现！这条蛇被你驯服了！💎',
                '教科书级别的操作！无可挑剔！📖',
                '你的反应速度简直非人类！🚀',
                '通关成功！你的专注力值得敬佩！🎯',
                '蛇中精英，非你莫属！🏆',
                '行云流水般的操作，太美了！🌊',
                '这就是大师级的水准！膜拜！🙌',
                '你的蛇身舞动着胜利的旋律！🎵',
                '突破极限，超越自我！你做到了！💪'
            ],
            defeat: [
                '别灰心，每一次失败都是成长的机会！🌱',
                '重整旗鼓，下次一定能做得更好！💪',
                '失败乃成功之母，再来一次吧！🌈',
                '你的潜力无限，只是时机未到！✨',
                '休息一下，调整好状态再出发！☕',
                '这条蛇很狡猾，但你更聪明！🧠',
                '坚持就是胜利，不要轻易放弃！🔥',
                '差点就成功了，再试一次吧！🎯',
                '每个高手都经历过无数次失败！🎮',
                '相信自己的实力，你能行的！💎',
                '这只是一次练习，下次一定通关！📚',
                '你的进步我看在眼里，继续加油！🌟'
            ]
        };

        // 已展示的文案索引（避免重复）
        this.shownQuotes = { victory: new Set(), defeat: new Set() };

        // 输入控制
        this.inputState = { up: false, down: false, left: false, right: false };
        this.touchStart = null;
        this.minSwipeDistance = 20;
        this.isMobile = this.detectMobile();

        // 冷却检查
        this.cooldownCheckInterval = null;
        this.cooldownOverlayTimeout = null;

        this.init();
    }

    /**
     * 初始化
     */
    init() {
        this.setupCanvas();
        this.bindEvents();
        this.checkCooldownOnMenu();
        this.showScreen('difficulty-screen');
    }

    /**
     * 设置画布大小
     */
    setupCanvas() {
        const isMobile = this.isMobile;

        // 移动端需要为触屏方向键预留空间
        const controlsHeight = isMobile ? 180 : 0;
        const headerHeight = isMobile ? 80 : 120;
        const actionsHeight = 60;
        const padding = isMobile ? 16 : 40;

        const maxWidth = Math.min(window.innerWidth - padding, 600);
        const maxHeight = Math.min(window.innerHeight - headerHeight - controlsHeight - actionsHeight, 600);
        const size = Math.max(200, Math.min(maxWidth, maxHeight));

        // 调整为网格大小的整数倍
        this.cellSize = Math.floor(size / this.gridSize);
        const canvasSize = this.cellSize * this.gridSize;

        this.canvas.width = canvasSize;
        this.canvas.height = canvasSize;
        this.canvas.style.width = canvasSize + 'px';
        this.canvas.style.height = canvasSize + 'px';

        this.gridW = this.gridSize;
        this.gridH = this.gridSize;
    }

    /**
     * 检测移动设备
     */
    detectMobile() {
        return ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0) ||
               (window.matchMedia('(pointer: coarse)').matches);
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 难度选择
        document.querySelectorAll('.diff-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (card.classList.contains('disabled')) return;
                const level = parseInt(card.dataset.level);
                this.selectDifficulty(level);
            });
        });

        // 键盘控制
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // 全屏触摸滑动控制（不仅限于画布）
        const swipeArea = document.getElementById('game-screen');
        swipeArea.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        swipeArea.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        swipeArea.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });

        // 阻止游戏界面默认手势（下拉刷新、双击缩放等）
        document.addEventListener('touchmove', (e) => {
            if (this.state === 'playing' || this.state === 'paused') {
                e.preventDefault();
            }
        }, { passive: false });

        // 虚拟方向键
        document.querySelectorAll('.touch-btn[data-dir]').forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.setDirection(btn.dataset.dir);
                this.flashSwipeIndicator(btn.dataset.dir);
            });
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.setDirection(btn.dataset.dir);
            });
        });

        // 游戏操作按钮
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
        document.getElementById('quit-btn').addEventListener('click', () => this.quitToMenu());
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('quit-pause-btn').addEventListener('click', () => this.quitToMenu());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('share-btn').addEventListener('click', () => this.shareGame());
        document.getElementById('result-quit-btn').addEventListener('click', () => this.quitToMenu());
        document.getElementById('quote-close').addEventListener('click', () => this.hideQuote());

        // 窗口大小变化
        window.addEventListener('resize', Utils.debounce(() => {
            this.setupCanvas();
        }, 300));

        // 阻止双击缩放
        document.addEventListener('dblclick', (e) => {
            if (this.state === 'playing') e.preventDefault();
        });
    }

    /**
     * 选择难度
     */
    selectDifficulty(level) {
        // 校验难度合法性
        if (!this.difficultyConfigs[level]) {
            console.error(`无效难度等级: ${level}，仅支持 1/2/3`);
            Utils.showToast('无效难度，请选择 1/2/3 级');
            return;
        }

        // 检查冷却
        const cooldownSec = Utils.checkCooldown();
        if (cooldownSec > 0) {
            this.showCooldownOverlay(cooldownSec);
            return;
        }

        this.difficulty = level;
        const config = this.difficultyConfigs[level];

        // 更新状态栏
        document.getElementById('current-difficulty').textContent = config.name;

        // 开始倒计时
        this.showScreen('game-screen');
        this.startCountdown();
    }

    /**
     * 开始倒计时
     */
    async startCountdown() {
        this.state = 'countdown';
        const countdownEl = document.getElementById('start-countdown');
        countdownEl.classList.add('active');

        for (let i = 3; i > 0; i--) {
            if (this.state !== 'countdown') return;
            countdownEl.textContent = i;
            await Utils.sleep(1000);
        }

        if (this.state !== 'countdown') return;
        countdownEl.textContent = 'GO!';
        await Utils.sleep(500);
        if (this.state !== 'countdown') return;
        countdownEl.classList.remove('active');

        this.startGame();
    }

    /**
     * 开始游戏
     */
    startGame() {
        this.stopLoops();
        this.clearPendingUiTimers();
        this.resetGameOverlays();

        this.state = 'playing';
        this.score = 0;
        this.elapsedTime = 0;
        this.startTime = Date.now();
        this.moveAccumulator = 0;
        this.particles = [];
        this.obstacles = [];
        this.shownQuotes = { victory: new Set(), defeat: new Set() };

        // 创建蛇
        const startX = Math.floor(this.gridW / 2);
        const startY = Math.floor(this.gridH / 2);
        this.snake = new Snake(startX, startY, this.cellSize);
        console.log('[startGame] 蛇初始位置: 头', startX, startY, '身体:', JSON.stringify(this.snake.getFullBody()));

        // 生成障碍物
        this.generateObstacles();

        // 创建食物
        const diffConfig = this.difficultyConfigs[this.difficulty];
        if (!diffConfig) {
            console.error('startGame: 难度配置不存在, difficulty:', this.difficulty);
            this.handleDefeat('游戏配置异常');
            return;
        }
        const foodConfig = diffConfig.food || {};
        this.food = new Food(this.gridW, this.gridH, this.cellSize, foodConfig);
        
        // 验证食物对象
        if (!this.food) {
            console.error('startGame: Food 对象创建失败');
            this.handleDefeat('游戏初始化失败');
            return;
        }
        
        const initSpawn = this.food.spawn(this.snake.getFullBody(), this.obstacles);
        if (!initSpawn) {
            console.error('初始食物生成失败，棋盘异常');
            this.handleDefeat('棋盘异常，无法开始游戏');
            return;
        }

        // 更新显示
        this.updateStatusBar();

        // 启动游戏循环
        // ⚠️ lastFrameTime 必须在 RAF 回调内部设置，不能提前设！
        // 提前设置会导致第一帧 deltaTime 异常（可能包含 countdown → playing 切换的间隔），
        // 在困难模式(moveInterval=75ms)下可能一帧触发多次 updateGame，导致开局立即死亡
        this._gameLoopFirstFrame = true;
        this.gameLoopId = requestAnimationFrame((t) => this.gameLoop(t));
        this.timerInterval = setInterval(() => this.updateTimer(), 100);
    }

    /**
     * 停止游戏循环与计时器
     */
    stopLoops() {
        if (this.gameLoopId != null) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        if (this.timerInterval != null) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * 清理会跨局延迟触发的 UI 定时器
     */
    clearPendingUiTimers() {
        if (this.quoteTimeout) {
            clearTimeout(this.quoteTimeout);
            this.quoteTimeout = null;
        }
        if (this.cooldownOverlayTimeout) {
            clearTimeout(this.cooldownOverlayTimeout);
            this.cooldownOverlayTimeout = null;
        }
    }

    /**
     * 新开一局前收起所有结束态/暂停态覆盖层
     */
    resetGameOverlays() {
        ['pause-screen', 'result-screen', 'cooldown-overlay'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('active');
        });

        const countdownEl = document.getElementById('start-countdown');
        if (countdownEl) {
            countdownEl.classList.remove('active');
        }

        const quotePopup = document.getElementById('quote-popup');
        if (quotePopup) {
            quotePopup.classList.remove('active');
        }

        const wrapper = this.canvas && this.canvas.parentElement;
        if (wrapper) {
            wrapper.classList.remove('danger');
        }

        this.touchStart = null;
        this.pauseStartedAt = null;
    }

    /**
     * 生成障碍物
     */
    generateObstacles() {
        const config = this.difficultyConfigs[this.difficulty];
        if (!config) {
            console.error('[generateObstacles] 难度配置不存在, difficulty:', this.difficulty);
            return;
        }
        this.obstacles = [];
        if (config.obstacleCount === 0) return;

        const occupied = new Set();
        const centerX = Math.floor(this.gridW / 2);
        const centerY = Math.floor(this.gridH / 2);

        console.log('[generateObstacles] 中心:', centerX, centerY, '网格:', this.gridW, 'x', this.gridH);
        console.log('[generateObstacles] 目标障碍物数:', config.obstacleCount, '复杂度:', config.obstacleComplexity);

        if (this.snake) {
            this.snake.getFullBody().forEach(seg => occupied.add(`${seg.x},${seg.y}`));
        }

        // 保护中心区域（蛇的出生点）- 扩大到 11x11，给蛇更多活动空间
        for (let dx = -5; dx <= 5; dx++) {
            for (let dy = -5; dy <= 5; dy++) {
                occupied.add(`${centerX + dx},${centerY + dy}`);
            }
        }
        console.log('[generateObstacles] 保护区域大小:', occupied.size);

        const targetCount = Math.max(0, Math.min(config.obstacleCount, this.gridW * this.gridH - occupied.size));
        let attempts = 0;
        while (this.obstacles.length < targetCount && attempts < 1000) {
            attempts++;
            const x = Utils.randomInt(1, this.gridW - 2);
            const y = Utils.randomInt(1, this.gridH - 2);
            const key = `${x},${y}`;

            if (occupied.has(key)) continue;

            // 根据复杂度生成不同形状的障碍物
            if (config.obstacleComplexity === 1) {
                // 简单障碍物：单个方块
                this.placeObstacleCells([{ x, y }], occupied, targetCount);
            } else if (config.obstacleComplexity === 2) {
                // 复杂障碍物：优先生成 2x2 方块或 L 形，剩余数量不足时退化为单格
                const remaining = targetCount - this.obstacles.length;
                const lShapes = [
                    [{ x, y }, { x: x + 1, y }, { x, y: y + 1 }],
                    [{ x, y }, { x: x - 1, y }, { x, y: y + 1 }],
                    [{ x, y }, { x: x + 1, y }, { x, y: y - 1 }],
                    [{ x, y }, { x: x - 1, y }, { x, y: y - 1 }]
                ];
                const complexShapes = [
                    [{ x, y }, { x: x + 1, y }, { x, y: y + 1 }, { x: x + 1, y: y + 1 }],
                    Utils.randomChoice(lShapes)
                ];

                let placed = false;
                if (remaining >= 3) {
                    const firstShape = Utils.randomChoice(complexShapes);
                    const secondShape = firstShape.length === 4 ? complexShapes[1] : complexShapes[0];
                    placed = this.placeObstacleCells(firstShape, occupied, targetCount) ||
                             this.placeObstacleCells(secondShape, occupied, targetCount);
                }
                if (!placed) {
                    this.placeObstacleCells([{ x, y }], occupied, targetCount);
                }
            } else {
                this.placeObstacleCells([{ x, y }], occupied, targetCount);
            }
        }

        if (this.obstacles.length < targetCount) {
            for (let x = 1; x < this.gridW - 1 && this.obstacles.length < targetCount; x++) {
                for (let y = 1; y < this.gridH - 1 && this.obstacles.length < targetCount; y++) {
                    this.placeObstacleCells([{ x, y }], occupied, targetCount);
                }
            }
        }
        console.log('[generateObstacles] 实际生成障碍物:', this.obstacles.length, '个', JSON.stringify(this.obstacles));
    }

    /**
     * 尝试放置一组障碍物格子，保证不越界、不重复、不超过目标数量
     */
    placeObstacleCells(cells, occupied, targetCount) {
        if (this.obstacles.length + cells.length > targetCount) return false;

        for (const cell of cells) {
            if (cell.x < 0 || cell.x >= this.gridW || cell.y < 0 || cell.y >= this.gridH) {
                return false;
            }
            if (occupied.has(`${cell.x},${cell.y}`)) {
                return false;
            }
        }

        cells.forEach(cell => {
            this.obstacles.push({ x: cell.x, y: cell.y });
            occupied.add(`${cell.x},${cell.y}`);
        });
        return true;
    }

    /**
     * 游戏主循环
     */
    gameLoop(timestamp) {
        if (this.state !== 'playing') return;

        try {
            // 首帧：初始化 lastFrameTime，deltaTime 为 0（避免首帧异常移动）
            if (this._gameLoopFirstFrame) {
                this._gameLoopFirstFrame = false;
                this.lastFrameTime = timestamp;
            }
            const deltaTime = timestamp - this.lastFrameTime;
            this.lastFrameTime = timestamp;

            // 更新移动计时器
            this.moveAccumulator += deltaTime;
            const moveInterval = this.difficultyConfigs[this.difficulty].moveInterval;

            if (this.moveAccumulator >= moveInterval) {
                this.moveAccumulator -= moveInterval;
                this.updateGame();
                if (this.state !== 'playing') return;
            }

            // 更新动画
            this.updateAnimations(deltaTime);

            // 渲染
            this.render();
        } catch (err) {
            console.error('🐛 gameLoop 异常:', err);
            this.endGame();
            this.showResult('defeat', '游戏出错', err.message);
        }

        if (this.state === 'playing') {
            this.gameLoopId = requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    /**
     * 更新游戏逻辑
     */
    updateGame() {
        if (!this.snake || !this.snake.isAlive()) return;

        try {
            const nextHead = this.snake.getNextHead();
            const foodPos = this.food.getPosition();
            const willEatFood = nextHead.x === foodPos.x && nextHead.y === foodPos.y;
            let foodConfig = null;

            if (willEatFood) {
                foodConfig = this.food.getConfig();
                if (!foodConfig) {
                    console.error('[updateGame] config 为 null! food.type:', this.food.type);
                    this.handleDefeat('食物配置异常');
                    return;
                }
            }

            // 移动蛇；吃到食物时本次移动立即增长，避免蛇身状态和食物刷新错位
            this.snake.move(willEatFood ? foodConfig.grow : 0);

            const head = this.snake.getHead();

            // 检查边界碰撞
            const inBoundary = this.snake.checkBoundary(this.gridW, this.gridH);
            if (!inBoundary) {
                console.log('[updateGame] ❌ 撞到边界! 蛇头:', head);
                this.handleDefeat('撞到了边界！');
                return;
            }

            // 检查自身碰撞
            const selfCollide = this.snake.checkSelfCollision();
            if (selfCollide) {
                console.log('[updateGame] ❌ 撞到自己! 蛇头:', head, '身体:', JSON.stringify(this.snake.getBody()));
                this.handleDefeat('撞到了自己！');
                return;
            }

            // 检查障碍物碰撞
            const obstacleCollide = this.snake.checkObstacleCollision(this.obstacles);
            if (obstacleCollide) {
                const hitObstacle = this.obstacles.find(obs => head.x === obs.x && head.y === obs.y);
                console.log('[updateGame] ❌ 撞到障碍物! 蛇头:', head, '撞到的障碍物:', JSON.stringify(hitObstacle));
                this.handleDefeat('撞到了障碍物！');
                return;
            }

            // 检查食物碰撞
            if (willEatFood) {
                // 仅检测食物是否与障碍物重叠（蛇头在食物格是正常的）
                const foodOnObstacle = this.obstacles.some(obs => obs.x === foodPos.x && obs.y === foodPos.y);
                if (foodOnObstacle) {
                    console.error('[updateGame] 食物与障碍物重叠:', foodPos);
                }

                this.score += foodConfig.score;

                // 粒子特效
                this.spawnParticles(foodPos, foodConfig.color);

                // 生成新食物
                const spawnOk = this.food.spawn(this.snake.getFullBody(), this.obstacles);
                if (!spawnOk) {
                    // 棋盘已满无法生成新食物，游戏结束（非胜利）
                    this.handleDefeat('棋盘已满，无法继续！');
                    return;
                }
            }

            // 检查食物是否过期
            if (this.food.isExpired()) {
                const spawnOk = this.food.spawn(this.snake.getFullBody(), this.obstacles);
                if (!spawnOk) {
                    this.handleDefeat('食物无法刷新，游戏结束！');
                    return;
                }
            }

            // 【关键】胜利判定必须在所有食物逻辑之后，
            // 确保本次吃的食物得分/特效/新食物都处理完毕再展示胜利
            const diffConfig = this.difficultyConfigs[this.difficulty];
            if (!diffConfig) {
                this.handleDefeat('难度配置异常，游戏终止');
                return;
            }
            const targetLength = diffConfig.targetLength;
            if (this.snake.getLength() >= targetLength) {
                this.handleVictory();
                return;
            }

            if (this.food) {
                this.food.clearJustSpawned();
            }

            this.updateStatusBar();
        } catch (err) {
            console.error('updateGame 异常:', err);
            this.handleDefeat('游戏出错: ' + err.message);
        }
    }

    /**
     * 更新计时器
     */
    updateTimer() {
        if (this.state !== 'playing') return;

        this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
        const config = this.difficultyConfigs[this.difficulty];
        const remaining = config.timeLimit - this.elapsedTime;

        if (remaining <= 0) {
            this.handleDefeat('时间到了！');
            return;
        }

        // 剩余时间少于30秒时警告
        const wrapper = this.canvas.parentElement;
        if (remaining <= 30) {
            wrapper.classList.add('danger');
        } else {
            wrapper.classList.remove('danger');
        }

        this.updateStatusBar();
    }

    /**
     * 更新状态栏显示
     */
    updateStatusBar() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('length').textContent = this.snake ? this.snake.getLength() : 3;
        document.getElementById('elapsed-time').textContent = Utils.formatTime(this.elapsedTime);

        const config = this.difficultyConfigs[this.difficulty];
        const remaining = Math.max(0, config.timeLimit - this.elapsedTime);
        document.getElementById('remaining-time').textContent = Utils.formatTime(remaining);
    }

    /**
     * 更新动画效果
     */
    updateAnimations(deltaTime) {
        if (this.snake) {
            this.snake.updateTrails(deltaTime);
        }
        if (this.food) {
            this.food.update(deltaTime);
        }

        // 更新粒子
        this.particles = this.particles.filter(p => {
            p.life -= deltaTime * 0.002;
            p.x += p.vx * deltaTime * 0.1;
            p.y += p.vy * deltaTime * 0.1;
            p.vy += 0.1; // 重力
            return p.life > 0;
        });
    }

    /**
     * 生成粒子特效
     */
    spawnParticles(pos, color) {
        const cx = pos.x * this.cellSize + this.cellSize / 2;
        const cy = pos.y * this.cellSize + this.cellSize / 2;

        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: cx,
                y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: color,
                size: 2 + Math.random() * 3
            });
        }
    }

    /**
     * 渲染画面
     */
    render() {
        // 清空画布
        this.ctx.fillStyle = '#12122a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制网格背景
        this.drawGrid();

        // 绘制障碍物
        this.drawObstacles();

        // 绘制食物
        if (this.food) {
            this.food.draw(this.ctx);
        }

        // 绘制蛇
        if (this.snake) {
            this.snake.draw(this.ctx);
        }

        // 绘制粒子
        this.drawParticles();
    }

    /**
     * 绘制网格
     */
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 255, 136, 0.03)';
        this.ctx.lineWidth = 1;

        for (let x = 0; x <= this.gridW; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.cellSize, 0);
            this.ctx.lineTo(x * this.cellSize, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y <= this.gridH; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.cellSize);
            this.ctx.lineTo(this.canvas.width, y * this.cellSize);
            this.ctx.stroke();
        }
    }

    /**
     * 绘制障碍物
     */
    drawObstacles() {
        this.obstacles.forEach(obs => {
            const x = obs.x * this.cellSize;
            const y = obs.y * this.cellSize;

            // 障碍物发光效果
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(255, 51, 102, 0.15)';
            this.ctx.beginPath();
            this.ctx.arc(
                x + this.cellSize / 2,
                y + this.cellSize / 2,
                this.cellSize * 0.6,
                0, Math.PI * 2
            );
            this.ctx.fill();

            // 障碍物主体
            this.ctx.fillStyle = '#ff3366';
            this.ctx.shadowColor = '#ff3366';
            this.ctx.shadowBlur = 10;

            const padding = this.cellSize * 0.15;
            this.ctx.fillRect(
                x + padding,
                y + padding,
                this.cellSize - padding * 2,
                this.cellSize - padding * 2
            );

            // 内部纹理
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.fillRect(
                x + padding * 2,
                y + padding * 2,
                this.cellSize - padding * 4,
                this.cellSize - padding * 4
            );

            this.ctx.restore();
        });
    }

    /**
     * 绘制粒子
     */
    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 8;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    /**
     * 处理胜利
     */
    handleVictory() {
        console.log('[handleVictory] 被调用, 长度:', this.snake && this.snake.getLength());
        this.endGame();

        const config = this.difficultyConfigs[this.difficulty];
        this.showResult('victory', '恭喜通关！', `你在 ${config.name} 中成功驯服了贪吃蛇！`);
        this.showRandomQuote('victory');
    }

    /**
     * 处理失败
     */
    handleDefeat(reason) {
        console.log('[handleDefeat] 原因:', reason, '| 状态:', this.state, '| 难度:', this.difficulty, '| 蛇长度:', this.snake && this.snake.getLength());
        this.endGame();

        // 记录失败
        const failCount = Utils.recordFailure();

        this.showResult('defeat', '游戏结束', reason);
        this.showRandomQuote('defeat');

        // 检查是否需要冷却
        if (failCount >= 3) {
            Utils.triggerCooldown(2);
            this.cooldownOverlayTimeout = setTimeout(() => {
                this.cooldownOverlayTimeout = null;
                if (this.state === 'gameover' || this.state === 'menu') {
                    this.showCooldownOverlay(120);
                }
            }, 3000);
        }
    }

    /**
     * 结束游戏
     */
    endGame() {
        this.state = 'gameover';
        this.stopLoops();
        if (this.snake) {
            this.snake.die();
        }

        // 移除危险警告
        const wrapper = this.canvas.parentElement;
        wrapper.classList.remove('danger');
    }

    /**
     * 显示结果界面
     */
    showResult(type, title, message) {
        const icon = type === 'victory' ? '🏆' : '💔';
        document.getElementById('result-icon').textContent = icon;
        document.getElementById('result-title').textContent = title;
        document.getElementById('result-message').textContent = message;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-length').textContent = this.snake ? this.snake.getLength() : 0;
        document.getElementById('final-time').textContent = Utils.formatTime(this.elapsedTime);

        const screen = document.getElementById('result-screen');
        screen.classList.add('active');
    }

    /**
     * 显示随机文案
     */
    showRandomQuote(type) {
        const quotes = this.quotes[type];
        const shown = this.shownQuotes[type];

        // 如果都展示过了，重置
        if (shown.size >= quotes.length) {
            shown.clear();
        }

        // 找到未展示过的文案
        let available = quotes.filter((_, i) => !shown.has(i));
        if (available.length === 0) {
            shown.clear();
            available = quotes;
        }

        const quote = Utils.randomChoice(available);
        const index = quotes.indexOf(quote);
        shown.add(index);

        const popup = document.getElementById('quote-popup');
        const icon = type === 'victory' ? '🎉' : '💫';
        popup.querySelector('.quote-icon').textContent = icon;
        document.getElementById('quote-text').textContent = quote;
        popup.classList.add('active');

        // 5秒后自动消失
        this.quoteTimeout = setTimeout(() => {
            this.hideQuote();
        }, 5000);
    }

    /**
     * 隐藏文案弹窗
     */
    hideQuote() {
        const popup = document.getElementById('quote-popup');
        popup.classList.remove('active');
        if (this.quoteTimeout) {
            clearTimeout(this.quoteTimeout);
            this.quoteTimeout = null;
        }
    }

    /**
     * 暂停游戏
     */
    pauseGame() {
        if (this.state !== 'playing') return;
        this.state = 'paused';
        this.pauseStartedAt = Date.now();
        this.stopLoops();
        document.getElementById('pause-screen').classList.add('active');
    }

    /**
     * 继续游戏
     */
    resumeGame() {
        if (this.state !== 'paused') return;
        if (this.pauseStartedAt) {
            this.startTime += Date.now() - this.pauseStartedAt;
            this.pauseStartedAt = null;
        }
        this.state = 'playing';
        document.getElementById('pause-screen').classList.remove('active');
        this.stopLoops();
        this.lastFrameTime = performance.now();
        this.gameLoopId = requestAnimationFrame((t) => this.gameLoop(t));
        this.timerInterval = setInterval(() => this.updateTimer(), 100);
    }

    /**
     * 重新开始
     */
    restartGame() {
        const cooldownSec = Utils.checkCooldown();
        if (cooldownSec > 0) {
            this.showCooldownOverlay(cooldownSec);
            return Promise.resolve(false);
        }

        this.endGame();
        this.clearPendingUiTimers();
        this.resetGameOverlays();
        this.hideQuote();
        return this.startCountdown().then(() => true);
    }

    /**
     * 返回主菜单
     */
    quitToMenu() {
        this.endGame();
        this.clearPendingUiTimers();
        this.state = 'menu';
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('pause-screen').classList.remove('active');
        document.getElementById('result-screen').classList.remove('active');
        document.getElementById('cooldown-overlay').classList.remove('active');
        this.hideQuote();
        this.checkCooldownOnMenu();
        this.showScreen('difficulty-screen');
    }

    /**
     * 分享游戏
     */
    async shareGame() {
        const result = await Utils.shareGame({
            text: `我在贪吃蛇${this.difficultyConfigs[this.difficulty].name}中获得了 ${this.score} 分，快来挑战吧！`
        });

        if (result.success) {
            if (result.method === 'native') {
                Utils.showToast('分享成功！');
            } else if (result.method === 'clipboard') {
                Utils.showToast('链接已复制到剪贴板，快去分享吧！');
            } else {
                Utils.showToast('已选中链接，快去分享吧！');
            }
        } else {
            Utils.showToast('分享失败，请手动复制链接');
        }
    }

    /**
     * 设置移动方向
     */
    setDirection(dir) {
        if (this.state !== 'playing' || !this.snake) return;
        this.snake.setDirection(dir);
    }

    /**
     * 键盘事件处理
     */
    handleKeyDown(e) {
        const keyMap = {
            'ArrowUp': 'up', 'KeyW': 'up',
            'ArrowDown': 'down', 'KeyS': 'down',
            'ArrowLeft': 'left', 'KeyA': 'left',
            'ArrowRight': 'right', 'KeyD': 'right',
            'Escape': 'pause'
        };

        const action = keyMap[e.code];
        if (!action) return;

        if (action === 'pause') {
            if (this.state === 'playing') {
                this.pauseGame();
            } else if (this.state === 'paused') {
                this.resumeGame();
            }
            return;
        }

        if (this.state === 'playing') {
            e.preventDefault();
            this.setDirection(action);
        }
    }

    /**
     * 触摸开始
     */
    handleTouchStart(e) {
        // 不拦截按钮区域的触摸
        if (e.target.closest('.touch-btn, .action-btn, .quote-popup, .overlay')) return;

        if (this.state !== 'playing') return;

        e.preventDefault();
        const touch = e.touches[0];
        this.touchStart = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    }

    /**
     * 触摸移动
     */
    handleTouchMove(e) {
        if (!this.touchStart || this.state !== 'playing') return;
        e.preventDefault();

        const touch = e.touches[0];
        const dx = touch.clientX - this.touchStart.x;
        const dy = touch.clientY - this.touchStart.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // 实时检测滑动方向（不等抬起就触发）
        if (Math.max(absDx, absDy) >= this.minSwipeDistance) {
            let dir;
            if (absDx > absDy) {
                dir = dx > 0 ? 'right' : 'left';
            } else {
                dir = dy > 0 ? 'down' : 'up';
            }

            this.setDirection(dir);
            this.flashSwipeIndicator(dir);

            // 重置起点，允许连续滑动换方向
            this.touchStart = { x: touch.clientX, y: touch.clientY, time: Date.now() };
        }
    }

    /**
     * 触摸结束
     */
    handleTouchEnd(e) {
        this.touchStart = null;
    }

    /**
     * 闪烁滑动方向指示器
     */
    flashSwipeIndicator(dir) {
        const indicator = document.getElementById('swipe-indicator');
        if (!indicator) return;

        const arrows = { up: '⬆️', down: '⬇️', left: '⬅️', right: '➡️' };
        indicator.textContent = arrows[dir] || '';
        indicator.classList.add('active');

        clearTimeout(this._swipeTimeout);
        this._swipeTimeout = setTimeout(() => {
            indicator.classList.remove('active');
        }, 200);
    }

    /**
     * 显示指定界面
     */
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => {
            if (!s.classList.contains('overlay')) {
                s.classList.remove('active');
            }
        });
        document.getElementById(screenId).classList.add('active');
    }

    /**
     * 显示冷却界面
     */
    showCooldownOverlay(seconds) {
        const overlay = document.getElementById('cooldown-overlay');
        overlay.classList.add('active');

        if (this.cooldownInterval) {
            clearInterval(this.cooldownInterval);
            this.cooldownInterval = null;
        }

        const updateTimer = () => {
            const remaining = Utils.checkCooldown();
            if (remaining <= 0) {
                overlay.classList.remove('active');
                if (this.cooldownInterval) {
                    clearInterval(this.cooldownInterval);
                    this.cooldownInterval = null;
                }
                this.checkCooldownOnMenu();
                return;
            }
            document.getElementById('cooldown-timer').textContent = Utils.formatTime(remaining);
        };

        updateTimer();
        this.cooldownInterval = setInterval(updateTimer, 1000);
    }

    /**
     * 检查菜单界面的冷却状态
     */
    checkCooldownOnMenu() {
        const cooldownSec = Utils.checkCooldown();
        const infoEl = document.getElementById('cooldown-info');
        const cards = document.querySelectorAll('.diff-card');

        if (cooldownSec > 0) {
            infoEl.textContent = `⏳ 冷却中：${Utils.formatTime(cooldownSec)} 后可继续挑战`;
            infoEl.classList.add('active');
            cards.forEach(card => card.classList.add('disabled'));

            // 启动冷却倒计时更新
            if (this.cooldownCheckInterval) {
                clearInterval(this.cooldownCheckInterval);
            }
            this.cooldownCheckInterval = setInterval(() => {
                const remaining = Utils.checkCooldown();
                if (remaining <= 0) {
                    infoEl.classList.remove('active');
                    cards.forEach(card => card.classList.remove('disabled'));
                    clearInterval(this.cooldownCheckInterval);
                    this.cooldownCheckInterval = null;
                } else {
                    infoEl.textContent = `⏳ 冷却中：${Utils.formatTime(remaining)} 后可继续挑战`;
                }
            }, 1000);
        } else {
            infoEl.classList.remove('active');
            cards.forEach(card => card.classList.remove('disabled'));
        }
    }
}

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
    window.game = new SnakeGame();
});
