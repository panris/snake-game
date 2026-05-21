const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '..');

class ElementStub {
    constructor(id = '') {
        this.id = id;
        this.dataset = {};
        this.style = {};
        this.textContent = '';
        this.parentElement = null;
        this.listeners = {};
        this.classList = {
            classes: new Set(),
            add: (...names) => names.forEach(name => this.classList.classes.add(name)),
            remove: (...names) => names.forEach(name => this.classList.classes.delete(name)),
            contains: name => this.classList.classes.has(name)
        };
    }

    addEventListener(type, handler) {
        this.listeners[type] = handler;
    }

    querySelector() {
        return new ElementStub();
    }

    closest() {
        return null;
    }

    getContext() {
        return createCanvasContextStub();
    }
}

function createCanvasContextStub() {
    const noop = () => {};
    return {
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        shadowColor: '',
        shadowBlur: 0,
        globalAlpha: 1,
        save: noop,
        restore: noop,
        beginPath: noop,
        arc: noop,
        fill: noop,
        fillRect: noop,
        stroke: noop,
        moveTo: noop,
        lineTo: noop,
        closePath: noop,
        createRadialGradient: () => ({ addColorStop: noop })
    };
}

const elements = new Map();
const ids = [
    'game-canvas',
    'difficulty-screen',
    'game-screen',
    'pause-screen',
    'result-screen',
    'cooldown-overlay',
    'current-difficulty',
    'start-countdown',
    'pause-btn',
    'quit-btn',
    'resume-btn',
    'quit-pause-btn',
    'restart-btn',
    'share-btn',
    'result-quit-btn',
    'quote-close',
    'quote-popup',
    'quote-text',
    'cooldown-timer',
    'cooldown-info',
    'score',
    'length',
    'elapsed-time',
    'remaining-time',
    'result-icon',
    'result-title',
    'result-message',
    'final-score',
    'final-length',
    'final-time',
    'swipe-indicator',
    'share-toast'
];

for (const id of ids) {
    elements.set(id, new ElementStub(id));
}
elements.get('game-canvas').parentElement = new ElementStub('canvas-wrapper');

const difficultyCards = [1, 2, 3].map(level => {
    const card = new ElementStub(`diff-card-${level}`);
    card.dataset.level = String(level);
    return card;
});
const touchButtons = ['up', 'down', 'left', 'right'].map(dir => {
    const button = new ElementStub(`touch-${dir}`);
    button.dataset.dir = dir;
    return button;
});
const screens = [
    elements.get('difficulty-screen'),
    elements.get('game-screen'),
    elements.get('pause-screen'),
    elements.get('result-screen'),
    elements.get('cooldown-overlay')
];

const documentStub = {
    addEventListener(event, handler) {
        if (event === 'DOMContentLoaded') this.domContentLoaded = handler;
    },
    body: new ElementStub('body'),
    createElement: () => new ElementStub(),
    execCommand: () => true,
    getElementById(id) {
        if (!elements.has(id)) {
            elements.set(id, new ElementStub(id));
        }
        return elements.get(id);
    },
    querySelectorAll(selector) {
        if (selector === '.diff-card') return difficultyCards;
        if (selector === '.touch-btn[data-dir]') return touchButtons;
        if (selector === '.screen') return screens;
        return [];
    }
};

const storage = new Map();

global.window = {
    innerWidth: 1024,
    innerHeight: 768,
    matchMedia: () => ({ matches: false }),
    addEventListener: () => {},
    location: { href: 'http://localhost/' }
};
global.document = documentStub;
global.navigator = {
    maxTouchPoints: 0,
    clipboard: { writeText: async () => {} }
};
global.localStorage = {
    getItem: key => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
};
global.requestAnimationFrame = () => 1;
global.cancelAnimationFrame = () => {};

function runFile(relativePath, exportName) {
    const fullPath = path.join(rootDir, relativePath);
    const code = fs.readFileSync(fullPath, 'utf8');
    vm.runInThisContext(`${code}\nglobalThis.${exportName} = ${exportName};`, { filename: fullPath });
}

runFile('src/core/utils.js', 'Utils');
runFile('src/core/food.js', 'Food');
runFile('src/core/snake.js', 'Snake');
runFile('src/engine/game.js', 'SnakeGame');

const testsPath = path.join(rootDir, 'tests/test.js');
vm.runInThisContext(fs.readFileSync(testsPath, 'utf8'), { filename: testsPath });
