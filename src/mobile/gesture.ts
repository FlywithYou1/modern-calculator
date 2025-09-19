/**
 * 移动端手势识别模块
 * 提供触摸手势支持，包括滑动、双击、长按等操作
 */

interface TouchPoint {
    x: number;
    y: number;
    timestamp: number;
}

interface GestureOptions {
    swipeThreshold: number;        // 滑动阈值 (px)
    doubleTapDelay: number;        // 双击延迟 (ms)
    longPressDelay: number;        // 长按延迟 (ms)
    pinchThreshold: number;        // 缩放阈值
}

interface GestureEvent {
    type: 'swipe' | 'doubleTap' | 'longPress' | 'pinch';
    direction?: 'left' | 'right' | 'up' | 'down';
    scale?: number;
    deltaX?: number;
    deltaY?: number;
    target: HTMLElement;
}

export class MobileGestureManager {
    public element: HTMLElement;  // 改为public以便外部访问
    private options: GestureOptions;
    private touchStart: TouchPoint | null = null;
    private lastTap: TouchPoint | null = null;
    private longPressTimer: number | null = null;
    private initialDistance: number = 0;

    constructor(element: HTMLElement, options: Partial<GestureOptions> = {}) {
        this.element = element;
        this.options = {
            swipeThreshold: 50,
            doubleTapDelay: 300,
            longPressDelay: 500,
            pinchThreshold: 10,
            ...options
        };

        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
    }

    private handleTouchStart(event: TouchEvent): void {
        event.preventDefault();
        
        const touch = event.touches[0];
        if (!touch) return;  // 安全检查
        
        const now = Date.now();
        
        this.touchStart = {
            x: touch.clientX,
            y: touch.clientY,
            timestamp: now
        };

        // 检测双击
        if (this.lastTap && 
            now - this.lastTap.timestamp < this.options.doubleTapDelay &&
            Math.abs(touch.clientX - this.lastTap.x) < 30 &&
            Math.abs(touch.clientY - this.lastTap.y) < 30) {
            
            this.dispatchGestureEvent({
                type: 'doubleTap',
                target: event.target as HTMLElement
            });
            this.lastTap = null;
            return;
        }

        this.lastTap = { ...this.touchStart };

        // 设置长按定时器
        if (event.touches.length === 1) {
            this.longPressTimer = window.setTimeout(() => {
                this.dispatchGestureEvent({
                    type: 'longPress',
                    target: event.target as HTMLElement
                });
                
                // 触发触觉反馈
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }, this.options.longPressDelay);
        }

        // 检测双指缩放开始
        if (event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            if (touch1 && touch2) {
                this.initialDistance = this.getDistance(touch1, touch2);
            }
        }
    }

    private handleTouchMove(event: TouchEvent): void {
        event.preventDefault();

        // 清除长按定时器
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        // 处理双指缩放
        if (event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            if (touch1 && touch2) {
                const currentDistance = this.getDistance(touch1, touch2);
                
                if (this.initialDistance > 0) {
                    const scale = currentDistance / this.initialDistance;
                    
                    if (Math.abs(scale - 1) > this.options.pinchThreshold / 100) {
                        this.dispatchGestureEvent({
                            type: 'pinch',
                            scale: scale,
                            target: event.target as HTMLElement
                        });
                    }
                }
            }
        }
    }

    private handleTouchEnd(event: TouchEvent): void {
        event.preventDefault();

        // 清除长按定时器
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        if (!this.touchStart || event.touches.length > 0) {
            return;
        }

        const touch = event.changedTouches[0];
        if (!touch) return;  // 安全检查
        
        const deltaX = touch.clientX - this.touchStart.x;
        const deltaY = touch.clientY - this.touchStart.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // 检测滑动手势
        if (distance > this.options.swipeThreshold) {
            let direction: 'left' | 'right' | 'up' | 'down';
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                direction = deltaX > 0 ? 'right' : 'left';
            } else {
                direction = deltaY > 0 ? 'down' : 'up';
            }

            this.dispatchGestureEvent({
                type: 'swipe',
                direction: direction,
                deltaX: deltaX,
                deltaY: deltaY,
                target: event.target as HTMLElement
            });

            // 滑动触觉反馈
            if (navigator.vibrate) {
                navigator.vibrate(30);
            }
        }

        this.touchStart = null;
        this.initialDistance = 0;
    }

    private handleTouchCancel(_event: TouchEvent): void {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        this.touchStart = null;
        this.initialDistance = 0;
    }

    private getDistance(touch1: Touch, touch2: Touch): number {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    private dispatchGestureEvent(gestureEvent: GestureEvent): void {
        const customEvent = new CustomEvent('gesture', {
            detail: gestureEvent,
            bubbles: true,
            cancelable: true
        });
        
        this.element.dispatchEvent(customEvent);
    }

    public destroy(): void {
        this.element.removeEventListener('touchstart', this.handleTouchStart);
        this.element.removeEventListener('touchmove', this.handleTouchMove);
        this.element.removeEventListener('touchend', this.handleTouchEnd);
        this.element.removeEventListener('touchcancel', this.handleTouchCancel);
        
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
        }
    }

    public updateOptions(newOptions: Partial<GestureOptions>): void {
        this.options = { ...this.options, ...newOptions };
    }
}

/**
 * 计算器专用手势处理器
 * 集成常用的计算器手势操作
 */
export class CalculatorGestureHandler {
    private gestureManager: MobileGestureManager;
    
    constructor(element: HTMLElement) {
        this.gestureManager = new MobileGestureManager(element, {
            swipeThreshold: 60,
            doubleTapDelay: 250,
            longPressDelay: 400
        });

        this.setupCalculatorGestures();
    }

    private setupCalculatorGestures(): void {
        this.gestureManager.element.addEventListener('gesture', (event: Event) => {
            const gestureEvent = event as CustomEvent<GestureEvent>;
            const gesture = gestureEvent.detail;
            
            switch (gesture.type) {
                case 'swipe':
                    this.handleSwipe(gesture);
                    break;
                case 'doubleTap':
                    this.handleDoubleTap(gesture);
                    break;
                case 'longPress':
                    this.handleLongPress(gesture);
                    break;
                case 'pinch':
                    this.handlePinch(gesture);
                    break;
            }
        });
    }

    private handleSwipe(gesture: GestureEvent): void {
        const calculatorEvent = new CustomEvent('calculatorGesture', {
            detail: {
                action: 'swipe',
                direction: gesture.direction,
                // 左滑：清除最后一位数字
                // 右滑：恢复上次清除的操作
                // 上滑：打开历史记录
                // 下滑：关闭扩展面板
                suggestion: this.getSwipeAction(gesture.direction!)
            }
        });
        
        this.gestureManager.element.dispatchEvent(calculatorEvent);
    }

    private handleDoubleTap(_gesture: GestureEvent): void {
        // 双击：复制当前结果到剪贴板
        const calculatorEvent = new CustomEvent('calculatorGesture', {
            detail: {
                action: 'doubleTap',
                suggestion: 'copyResult'
            }
        });
        
        this.gestureManager.element.dispatchEvent(calculatorEvent);
    }

    private handleLongPress(gesture: GestureEvent): void {
        const target = gesture.target;
        let action = 'showTooltip';
        
        // 根据目标元素类型决定长按行为
        if (target.classList.contains('display')) {
            action = 'editExpression';
        } else if (target.classList.contains('history-item')) {
            action = 'editHistoryItem';
        } else if (target.classList.contains('button')) {
            action = 'showButtonMenu';
        }

        const calculatorEvent = new CustomEvent('calculatorGesture', {
            detail: {
                action: 'longPress',
                target: target,
                suggestion: action
            }
        });
        
        this.gestureManager.element.dispatchEvent(calculatorEvent);
    }

    private handlePinch(gesture: GestureEvent): void {
        // 缩放手势：调整字体大小或缩放界面
        const calculatorEvent = new CustomEvent('calculatorGesture', {
            detail: {
                action: 'pinch',
                scale: gesture.scale,
                suggestion: gesture.scale! > 1 ? 'zoomIn' : 'zoomOut'
            }
        });
        
        this.gestureManager.element.dispatchEvent(calculatorEvent);
    }

    private getSwipeAction(direction: string): string {
        switch (direction) {
            case 'left': return 'deleteLastDigit';
            case 'right': return 'undoLastOperation';
            case 'up': return 'showHistory';
            case 'down': return 'hideExtendedPanel';
            default: return 'unknown';
        }
    }

    public destroy(): void {
        this.gestureManager.destroy();
    }
}

// 导出类型定义供其他模块使用
export type { GestureEvent, GestureOptions, TouchPoint };