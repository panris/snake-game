/**
 * 🧪 测试模块
 * 测试游戏各功能模块的正确性
 */

const TestRunner = {
    tests: [],
    passed: 0,
    failed: 0,

    test(name, fn) {
        this.tests.push({ name, fn });
    },

    async run() {
        console.log('\n========== 🧪 贪吃蛇游戏测试报告 ==========\n');

        for (const t of this.tests) {
            try {
                await t.fn();
                console.log(`✅ PASS: ${t.name}`);
                this.passed++;
            } catch (err) {
                console.log(`❌ FAIL: ${t.name}`);
                console.log(`   错误: ${err.message}`);
                this.failed++;
            }
        }

        console.log('\n========== 测试结果 ==========');
        console.log(`总计: ${this.tests.length} 个测试`);
        console.log(`通过: ${this.passed} 个 ✅`);
        console.log(`失败: ${this.failed} 个 ❌`);
        console.log(`通过率: ${(this.passed / this.tests.length * 100).toFixed(1)}%`);
        console.log('================================\n');

        return this.failed === 0;
    },

    assert(condition, message) {
        if (!condition) {
            throw new Error(message || '断言失败');
        }
    },

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `期待 ${expected}，实际 ${actual}`);
        }
    }
};

// ========== Utils 测试 ==========
TestRunner.test('Utils.randomInt 返回范围内整数', () => {
    for (let i = 0; i < 100; i++) {
        const val = Utils.randomInt(1, 10);
        TestRunner.assert(val >= 1 && val <= 10, `randomInt 返回 ${val}，超出范围 [1, 10]`);
    }
});

TestRunner.test('Utils.randomChoice 从数组选择', () => {
    const arr = ['a', 'b', 'c'];
    const choice = Utils.randomChoice(arr);
    TestRunner.assert(arr.includes(choice), '选择的元素应在数组中');
});

TestRunner.test('Utils.formatTime 格式化正确', () => {
    TestRunner.assertEqual(Utils.formatTime(65), '01:05');
    TestRunner.assertEqual(Utils.formatTime(0), '00:00');
    TestRunner.assertEqual(Utils.formatTime(540), '09:00');
});

TestRunner.test('Utils localStorage 存取正确', () => {
    Utils.setStorage('test_key', { value: 42 });
    const data = Utils.getStorage('test_key');
    TestRunner.assertEqual(data.value, 42);
    Utils.removeStorage('test_key');
    TestRunner.assertEqual(Utils.getStorage('test_key'), null);
});

TestRunner.test('Utils.checkCooldown 检测冷却状态', () => {
    // 清理
    Utils.removeStorage('cooldown_end');
    Utils.removeStorage('fail_count');

    // 无冷却
    TestRunner.assertEqual(Utils.checkCooldown(), 0, '无冷却时应返回0');

    // 设置冷却
    Utils.setStorage('cooldown_end', Date.now() + 120000);
    const remaining = Utils.checkCooldown();
    TestRunner.assert(remaining > 0, '冷却中应返回正数');
    TestRunner.assert(remaining <= 120, '冷却剩余时间不应超过120秒');

    // 清理
    Utils.removeStorage('cooldown_end');
});

TestRunner.test('Utils.recordFailure 记录失败次数', () => {
    Utils.removeStorage('fail_count');
    TestRunner.assertEqual(Utils.recordFailure(), 1);
    TestRunner.assertEqual(Utils.recordFailure(), 2);
    TestRunner.assertEqual(Utils.getFailCount(), 2);
    Utils.removeStorage('fail_count');
});

// ========== Snake 测试 ==========
TestRunner.test('Snake 初始化正确', () => {
    const snake = new Snake(10, 10, 20);
    TestRunner.assertEqual(snake.getLength(), 3, '初始长度应为3');
    TestRunner.assertEqual(snake.getHead().x, 10, '头部X坐标错误');
    TestRunner.assertEqual(snake.getHead().y, 10, '头部Y坐标错误');
    TestRunner.assert(snake.isAlive(), '初始状态应为存活');
});

TestRunner.test('Snake 移动正确', () => {
    const snake = new Snake(5, 5, 20);
    snake.move();
    const head = snake.getHead();
    TestRunner.assertEqual(head.x, 6, '向右移动后X应为6');
    TestRunner.assertEqual(head.y, 5, 'Y坐标应不变');
});

TestRunner.test('Snake 方向切换正确', () => {
    const snake = new Snake(5, 5, 20);
    snake.setDirection('down');
    snake.move();
    const head = snake.getHead();
    TestRunner.assertEqual(head.x, 5, '向下移动X应不变');
    TestRunner.assertEqual(head.y, 6, '向下移动Y应为6');
});

TestRunner.test('Snake 不允许反向移动', () => {
    const snake = new Snake(5, 5, 20);
    snake.setDirection('left'); // 当前正在向右，不能立即左转
    snake.move();
    const head = snake.getHead();
    // 方向还是向右
    TestRunner.assertEqual(head.x, 6, '不应允许反向');
});

TestRunner.test('Snake 不允许队列方向 180° 转向', () => {
    const snake = new Snake(5, 5, 20);
    snake.setDirection('up');
    snake.setDirection('down'); // 与已队列的 up 相反
    snake.move();
    const head = snake.getHead();
    TestRunner.assertEqual(head.y, 4, '不应在下一帧向下');
});

TestRunner.test('Snake 不允许同 tick 内快速转成当前反方向', () => {
    const snake = new Snake(5, 5, 20);
    snake.setDirection('up');
    snake.setDirection('left'); // 当前方向仍是 right，不能在移动前改成 left
    snake.move();
    const head = snake.getHead();

    TestRunner.assertEqual(head.x, 5, '快速转向后不应掉头向左');
    TestRunner.assertEqual(head.y, 4, '应保持第一次有效转向向上');
    TestRunner.assert(!snake.checkSelfCollision(), '快速转向不应导致蛇头撞回身体');
});

TestRunner.test('Snake 生长正确', () => {
    const snake = new Snake(5, 5, 20);
    const originalLength = snake.getLength();
    snake.grow(2);
    snake.move();
    snake.move();
    TestRunner.assertEqual(snake.getLength(), originalLength + 2, '生长后长度不正确');
});

TestRunner.test('Snake 吃食物的本次移动应立即生长', () => {
    const snake = new Snake(5, 5, 20);
    const originalLength = snake.getLength();
    snake.move(1);

    TestRunner.assertEqual(snake.getLength(), originalLength + 1, '吃食物当步应立即增加长度');
});

TestRunner.test('Snake 自身碰撞检测', () => {
    // 创建一个会碰撞自己的场景
    const snake = new Snake(5, 5, 20);
    // 人为设置身体，让头部碰撞
    snake.body = [
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 7, y: 5 },
        { x: 5, y: 5 } // 头部位置与身体重叠
    ];
    TestRunner.assert(snake.checkSelfCollision(), '应检测到自身碰撞');
});

TestRunner.test('Snake 边界检测', () => {
    const snake = new Snake(0, 0, 20);
    snake.setDirection('up');
    snake.move();
    TestRunner.assert(!snake.checkBoundary(20, 20), '出界后应返回false');
});

TestRunner.test('Snake 障碍物碰撞检测', () => {
    const snake = new Snake(5, 5, 20);
    const obstacles = [{ x: 6, y: 5 }];
    snake.move();
    TestRunner.assert(snake.checkObstacleCollision(obstacles), '应检测到障碍物碰撞');
});

// ========== Food 测试 ==========
TestRunner.test('Food 生成位置有效', () => {
    const food = new Food(20, 20, 20);
    const snakeBody = [{ x: 5, y: 5 }, { x: 6, y: 5 }];
    const obstacles = [{ x: 10, y: 10 }];

    const result = food.spawn(snakeBody, obstacles);
    TestRunner.assert(result, '食物生成应成功');

    const pos = food.getPosition();
    TestRunner.assert(
        !snakeBody.some(s => s.x === pos.x && s.y === pos.y),
        '食物不应生成在蛇身上'
    );
    TestRunner.assert(
        !obstacles.some(o => o.x === pos.x && o.y === pos.y),
        '食物不应生成在障碍物上'
    );
});

TestRunner.test('Food 生成失败时返回false', () => {
    const food = new Food(3, 3, 20);
    // 填满整个网格
    const snakeBody = [];
    for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
            snakeBody.push({ x, y });
        }
    }
    const result = food.spawn(snakeBody, []);
    TestRunner.assert(!result, '无空位时应返回false');
});

TestRunner.test('Food 刚生成后不应立即判定过期', () => {
    const food = new Food(20, 20, 20, {
        normal: { score: 15, grow: 1 },
        bonus: { score: 40, grow: 2, duration: 9000 },
        speed: { score: 25, grow: 1, duration: 5000 }
    });
    food.type = 'bonus';
    food.spawnTime = Date.now() - 10000;
    TestRunner.assert(food.isExpired(), '未刷新前应已过期');
    food.justSpawned = true;
    TestRunner.assert(!food.isExpired(), '刚生成同帧不应过期');
    food.clearJustSpawned();
    TestRunner.assert(food.isExpired(), '清除标记后应恢复过期判断');
});

TestRunner.test('Food 配置获取正确', () => {
    const food = new Food(20, 20, 20);
    food.type = 'normal';
    const config = food.getConfig();
    TestRunner.assertEqual(config.score, 10, '普通食物分数应为10');
    TestRunner.assertEqual(config.grow, 1, '普通食物增长应为1');
});

// ========== 难度配置测试 ==========
TestRunner.test('难度配置完整', () => {
    const game = new SnakeGame();
    TestRunner.assert(game.difficultyConfigs[1], '简单难度应存在');
    TestRunner.assert(game.difficultyConfigs[2], '中等难度应存在');
    TestRunner.assert(game.difficultyConfigs[3], '困难难度应存在');

    TestRunner.assertEqual(game.difficultyConfigs[1].timeLimit, 540, '简单时长应为9分钟');
    TestRunner.assertEqual(game.difficultyConfigs[3].timeLimit, 120, '困难时长应为2分钟');
});

TestRunner.test('难度速度梯度明确', () => {
    const game = new SnakeGame();
    const speed1 = game.difficultyConfigs[1].moveInterval;
    const speed2 = game.difficultyConfigs[2].moveInterval;
    const speed3 = game.difficultyConfigs[3].moveInterval;

    TestRunner.assert(speed1 > speed2, '简单难度应比中等难度慢');
    TestRunner.assert(speed2 > speed3, '中等难度应比困难难度慢');
});

TestRunner.test('各难度吃到普通食物后应保持游戏进行', () => {
    [1, 2, 3].forEach(level => {
        const game = new SnakeGame();
        game.gridW = 20;
        game.gridH = 20;
        game.cellSize = 20;
        game.difficulty = level;
        game.state = 'playing';
        game.score = 0;
        game.elapsedTime = 0;
        game.startTime = Date.now();
        game.obstacles = [];
        game.particles = [];
        game.snake = new Snake(10, 10, 20);
        game.food = new Food(20, 20, 20, game.difficultyConfigs[level].food);
        game.food.position = { x: 11, y: 10 };
        game.food.type = 'normal';
        game.food.justSpawned = false;

        game.updateGame();

        TestRunner.assertEqual(game.state, 'playing', `${game.difficultyConfigs[level].name} 吃食物后不应结束`);
        TestRunner.assertEqual(game.snake.getLength(), 4, `${game.difficultyConfigs[level].name} 吃食物后应立即增长`);
        TestRunner.assertEqual(game.score, game.difficultyConfigs[level].food.normal.score, `${game.difficultyConfigs[level].name} 分数应增加`);
    });
});

TestRunner.test('中等模式奖励食物刷新不应占用增长后的蛇身', () => {
    const game = new SnakeGame();
    game.gridW = 20;
    game.gridH = 20;
    game.cellSize = 20;
    game.difficulty = 2;
    game.state = 'playing';
    game.score = 0;
    game.elapsedTime = 0;
    game.startTime = Date.now();
    game.obstacles = [];
    game.particles = [];
    game.snake = new Snake(10, 10, 20);
    game.food = new Food(20, 20, 20, game.difficultyConfigs[2].food);
    game.food.position = { x: 11, y: 10 };
    game.food.type = 'bonus';
    game.food.justSpawned = false;

    const originalTail = { x: 8, y: 10 };
    game.updateGame();
    const body = game.snake.getFullBody();
    const newFood = game.food.getPosition();

    TestRunner.assert(body.some(seg => seg.x === originalTail.x && seg.y === originalTail.y), '奖励食物吃下当步应保留原尾部');
    TestRunner.assert(
        !body.some(seg => seg.x === newFood.x && seg.y === newFood.y),
        '新食物不应刷新在增长后的蛇身上'
    );
});

TestRunner.test('中等模式吃到达标食物应当步胜利', () => {
    const game = new SnakeGame();
    game.gridW = 80;
    game.gridH = 20;
    game.cellSize = 20;
    game.difficulty = 2;
    game.state = 'playing';
    game.score = 0;
    game.elapsedTime = 0;
    game.startTime = Date.now();
    game.obstacles = [];
    game.particles = [];
    game.snake = new Snake(40, 10, 20);
    game.snake.body = [];
    for (let x = 40; x >= 7; x--) {
        game.snake.body.push({ x, y: 10 });
    }
    game.snake.direction = 'right';
    game.snake.nextDirection = 'right';
    game.food = new Food(80, 20, 20, game.difficultyConfigs[2].food);
    game.food.position = { x: 41, y: 10 };
    game.food.type = 'normal';
    game.food.justSpawned = false;

    game.updateGame();

    TestRunner.assertEqual(game.snake.getLength(), game.difficultyConfigs[2].targetLength, '吃到达标食物后长度应立即达标');
    TestRunner.assertEqual(document.getElementById('result-title').textContent, '恭喜通关！', '达标后应当步胜利');
});

TestRunner.test('中等模式失败后重新开始吃第一个食物不应失败', async () => {
    const originalSleep = Utils.sleep;
    Utils.sleep = () => Promise.resolve();
    Utils.removeStorage('fail_count');
    Utils.removeStorage('cooldown_end');

    const game = new SnakeGame();
    try {
        game.gridW = 80;
        game.gridH = 20;
        game.cellSize = 20;
        game.difficulty = 2;
        game.startGame();
        game.handleDefeat('测试失败');

        const restarted = await game.restartGame();
        TestRunner.assert(restarted, '未进入冷却时应允许重新开始');

        const nextHead = game.snake.getNextHead();
        game.food.position = nextHead;
        game.food.type = 'normal';
        game.food.justSpawned = false;
        game.updateGame();

        TestRunner.assertEqual(game.state, 'playing', '重新开始后吃第一个食物不应结束');
        TestRunner.assertEqual(game.snake.getLength(), 4, '重新开始后吃第一个食物应正常增长');
    } finally {
        game.endGame();
        Utils.sleep = originalSleep;
        Utils.removeStorage('fail_count');
        Utils.removeStorage('cooldown_end');
    }
});

TestRunner.test('中等模式连续吃多个食物后继续吃不应失败', () => {
    const game = new SnakeGame();
    game.gridW = 80;
    game.gridH = 20;
    game.cellSize = 20;
    game.difficulty = 2;
    game.state = 'playing';
    game.score = 0;
    game.elapsedTime = 0;
    game.startTime = Date.now();
    game.obstacles = [];
    game.particles = [];
    game.snake = new Snake(10, 10, 20);
    game.food = new Food(80, 20, 20, game.difficultyConfigs[2].food);

    for (let i = 0; i < 16; i++) {
        game.food.position = game.snake.getNextHead();
        game.food.type = i % 4 === 3 ? 'bonus' : 'normal';
        game.food.justSpawned = false;
        game.updateGame();

        TestRunner.assertEqual(game.state, 'playing', `连续吃第 ${i + 1} 个食物后不应结束`);
    }

    TestRunner.assert(game.snake.getLength() > 3, '连续吃食物后长度应增长');
});

// ========== 文案库测试 ==========
TestRunner.test('文案库数量达标', () => {
    const game = new SnakeGame();
    TestRunner.assert(game.quotes.victory.length >= 10, `鼓励文案至少10条，实际${game.quotes.victory.length}`);
    TestRunner.assert(game.quotes.defeat.length >= 10, `安慰文案至少10条，实际${game.quotes.defeat.length}`);
});

// ========== 分享功能测试 ==========
TestRunner.test('Utils.shareGame 存在且可调用', () => {
    TestRunner.assert(typeof Utils.shareGame === 'function', 'shareGame应为函数');
});

// ========== 障碍物生成测试 ==========
TestRunner.test('障碍物不覆盖蛇身', () => {
    const game = new SnakeGame();
    game.gridW = 20;
    game.gridH = 20;
    game.difficulty = 3;

    // 手动设置蛇
    game.snake = new Snake(10, 10, 20);
    game.generateObstacles();

    const snakeBody = game.snake.getFullBody();
    const obstacles = game.obstacles;

    const overlap = snakeBody.some(seg =>
        obstacles.some(obs => seg.x === obs.x && seg.y === obs.y)
    );

    TestRunner.assert(!overlap, '障碍物不应与蛇身重叠');
});

TestRunner.test('中等模式障碍物数量精确且不重复', () => {
    const game = new SnakeGame();
    game.gridW = 20;
    game.gridH = 20;
    game.difficulty = 2;
    game.snake = new Snake(10, 10, 20);
    game.generateObstacles();

    const obstacles = game.obstacles;
    const unique = new Set(obstacles.map(obs => `${obs.x},${obs.y}`));
    TestRunner.assertEqual(obstacles.length, game.difficultyConfigs[2].obstacleCount, '中等模式障碍物数量应等于配置');
    TestRunner.assertEqual(unique.size, obstacles.length, '中等模式障碍物不应重复');
});

TestRunner.test('困难模式障碍物数量精确且全部在棋盘内', () => {
    const game = new SnakeGame();
    game.gridW = 20;
    game.gridH = 20;
    game.difficulty = 3;
    game.snake = new Snake(10, 10, 20);

    for (let i = 0; i < 20; i++) {
        game.generateObstacles();
        const obstacles = game.obstacles;
        const unique = new Set(obstacles.map(obs => `${obs.x},${obs.y}`));

        TestRunner.assertEqual(obstacles.length, game.difficultyConfigs[3].obstacleCount, '困难模式障碍物数量应等于配置');
        TestRunner.assertEqual(unique.size, obstacles.length, '困难模式障碍物不应重复');
        TestRunner.assert(
            obstacles.every(obs => obs.x >= 0 && obs.x < game.gridW && obs.y >= 0 && obs.y < game.gridH),
            '困难模式障碍物必须全部在棋盘内'
        );
    }
});

// 运行测试
const testRunPromise = TestRunner.run().then(success => {
    if (typeof window !== 'undefined') {
        window.testResults = { passed: TestRunner.passed, failed: TestRunner.failed, total: TestRunner.tests.length };
    }
    if (typeof process !== 'undefined' && !success) {
        process.exitCode = 1;
    }
    return success;
});

if (typeof window !== 'undefined') {
    window.testRunPromise = testRunPromise;
}
