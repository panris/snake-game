/**
 * 🚀 工具函数模块
 * 提供游戏各模块通用的辅助函数
 */

const Utils = {
    /**
     * 随机整数 [最小值, 最大值]
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * 从数组中随机选择一个元素
     */
    randomChoice(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    /**
     * 格式化时间 (mm:ss)
     */
    formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    },

    /**
     * localStorage 安全读取
     */
    getStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(`snake_game_${key}`);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.warn('localStorage read error:', e);
            return defaultValue;
        }
    },

    /**
     * localStorage 安全写入
     */
    setStorage(key, value) {
        try {
            localStorage.setItem(`snake_game_${key}`, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn('localStorage write error:', e);
            return false;
        }
    },

    /**
     * 清除 localStorage 数据
     */
    removeStorage(key) {
        try {
            localStorage.removeItem(`snake_game_${key}`);
        } catch (e) {
            console.warn('localStorage remove error:', e);
        }
    },

    /**
     * 检查是否处于冷却状态
     * 返回剩余冷却秒数，若已结束返回 0
     */
    checkCooldown() {
        const cooldownEnd = this.getStorage('cooldown_end', 0);
        const now = Date.now();
        if (cooldownEnd > now) {
            return Math.ceil((cooldownEnd - now) / 1000);
        }
        // 冷却结束，重置失败次数
        this.removeStorage('fail_count');
        this.removeStorage('cooldown_end');
        return 0;
    },

    /**
     * 触发冷却
     */
    triggerCooldown(minutes = 2) {
        const endTime = Date.now() + minutes * 60 * 1000;
        this.setStorage('cooldown_end', endTime);
        this.setStorage('fail_count', 0);
    },

    /**
     * 记录失败次数
     */
    recordFailure() {
        let count = this.getStorage('fail_count', 0);
        count++;
        this.setStorage('fail_count', count);
        return count;
    },

    /**
     * 获取失败次数
     */
    getFailCount() {
        return this.getStorage('fail_count', 0);
    },

    /**
     * 检测触摸设备
     */
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },

    /**
     * 分享功能
     */
    async shareGame(data = {}) {
        const shareData = {
            title: '🐍 贪吃蛇 - 极限挑战',
            text: '我在玩超酷炫的贪吃蛇游戏，快来挑战吧！',
            url: window.location.href,
            ...data
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                return { success: true, method: 'native' };
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.warn('Native share failed:', err);
                }
            }
        }

        // 降级方案：复制链接
        try {
            await navigator.clipboard.writeText(`${shareData.title}\n${shareData.url}`);
            return { success: true, method: 'clipboard' };
        } catch (err) {
            // 最后降级：选中复制
            const textarea = document.createElement('textarea');
            textarea.value = shareData.url;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return { success: true, method: 'fallback' };
        }
    },

    /**
     * 显示 Toast 提示
     */
    showToast(message, duration = 3000) {
        const toast = document.getElementById('share-toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('active');
        setTimeout(() => {
            toast.classList.remove('active');
        }, duration);
    },

    /**
     * 等待指定毫秒
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * 防抖动
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};
