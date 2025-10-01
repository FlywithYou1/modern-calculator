/**
 * 无障碍辅助工具
 * 提供屏幕阅读器支持、键盘导航、高对比度模式等功能
 */

export interface AccessibilityConfig {
  screenReaderSupport: boolean
  keyboardNavigation: boolean
  highContrast: boolean
  reduceMotion: boolean
  largeText: boolean
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
}

export class AccessibilityManager {
  private config: AccessibilityConfig = {
    screenReaderSupport: true,
    keyboardNavigation: true,
    highContrast: false,
    reduceMotion: false,
    largeText: false,
    colorBlindMode: 'none',
  }

  private focusableElements: HTMLElement[] = []
  private currentFocusIndex = 0
  private isNavigating = false

  constructor() {
    this.loadConfig()
    this.setupKeyboardNavigation()
    this.applyAccessibilitySettings()
  }

  /**
   * 加载配置
   */
  private loadConfig(): void {
    try {
      const stored = localStorage.getItem('calculator-accessibility')
      if (stored) {
        this.config = { ...this.config, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.warn('读取无障碍配置失败:', error)
    }
  }

  /**
   * 保存配置
   */
  private saveConfig(): void {
    try {
      localStorage.setItem('calculator-accessibility', JSON.stringify(this.config))
    } catch (error) {
      console.error('保存无障碍配置失败:', error)
    }
  }

  /**
   * 设置键盘导航
   */
  private setupKeyboardNavigation(): void {
    if (!this.config.keyboardNavigation) return

    document.addEventListener('keydown', (event) => {
      if (this.isNavigating) return

      switch (event.key) {
        case 'Tab':
          this.handleTabNavigation(event)
          break
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          this.handleArrowNavigation(event)
          break
        case 'Enter':
        case ' ':
          this.handleAction(event)
          break
        case 'Escape':
          this.handleEscape(event)
          break
      }
    })
  }

  /**
   * 处理Tab导航
   */
  private handleTabNavigation(event: KeyboardEvent): void {
    if (!this.config.keyboardNavigation) return

    this.isNavigating = true
    
    // 收集所有可聚焦元素
    this.focusableElements = Array.from(
      document.querySelectorAll<HTMLElement>(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => el.offsetParent !== null) // 只包含可见元素

    if (this.focusableElements.length === 0) return

    if (event.shiftKey) {
      // Shift+Tab: 向前导航
      this.currentFocusIndex = 
        (this.currentFocusIndex - 1 + this.focusableElements.length) % this.focusableElements.length
    } else {
      // Tab: 向后导航
      this.currentFocusIndex = (this.currentFocusIndex + 1) % this.focusableElements.length
    }

    const targetElement = this.focusableElements[this.currentFocusIndex]
    if (targetElement) {
      targetElement.focus()
      
      // 滚动到可见区域
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }

    event.preventDefault()
    
    setTimeout(() => {
      this.isNavigating = false
    }, 100)
  }

  /**
   * 处理方向键导航
   */
  private handleArrowNavigation(event: KeyboardEvent): void {
    if (!this.config.keyboardNavigation) return

    const focusedElement = document.activeElement as HTMLElement
    if (!focusedElement) return

    // 在计算器键盘中使用方向键导航
    if (focusedElement.closest('.calculator-keyboard')) {
      this.navigateCalculatorKeyboard(event, focusedElement)
    }
  }

  /**
   * 计算器键盘导航
   */
  private navigateCalculatorKeyboard(event: KeyboardEvent, focusedElement: HTMLElement): void {
    const keyboard = focusedElement.closest('.calculator-keyboard')
    if (!keyboard) return

    const buttons = Array.from(keyboard.querySelectorAll<HTMLElement>('button[tabindex]'))
    const currentIndex = buttons.indexOf(focusedElement)
    
    if (currentIndex === -1) return

    let nextIndex = currentIndex
    const rowLength = 5 // 假设每行5个按钮

    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % buttons.length
        break
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + buttons.length) % buttons.length
        break
      case 'ArrowDown':
        nextIndex = Math.min(currentIndex + rowLength, buttons.length - 1)
        break
      case 'ArrowUp':
        nextIndex = Math.max(currentIndex - rowLength, 0)
        break
    }

    if (nextIndex !== currentIndex && buttons[nextIndex]) {
      buttons[nextIndex].focus()
      event.preventDefault()
    }
  }

  /**
   * 处理操作键
   */
  private handleAction(event: KeyboardEvent): void {
    const focusedElement = document.activeElement as HTMLElement
    
    if (focusedElement && focusedElement.tagName === 'BUTTON') {
      // 触发按钮点击
      focusedElement.click()
      event.preventDefault()
    }
  }

  /**
   * 处理ESC键
   */
  private handleEscape(event: KeyboardEvent): void {
    // 关闭所有打开的模态框和面板
    const modals = document.querySelectorAll<HTMLElement>('[role="dialog"], .modal, .panel')
    
    for (const modal of Array.from(modals)) {
      if (modal.style.display !== 'none' && modal.style.display !== '') {
        const closeBtn = modal.querySelector<HTMLElement>('[aria-label*="关闭"], .close-btn')
        if (closeBtn) {
          closeBtn.click()
          event.preventDefault()
          break
        }
      }
    }
  }

  /**
   * 应用无障碍设置
   */
  private applyAccessibilitySettings(): void {
    const root = document.documentElement

    // 高对比度模式
    if (this.config.highContrast) {
      root.setAttribute('data-high-contrast', 'true')
    } else {
      root.removeAttribute('data-high-contrast')
    }

    // 减少动效模式
    if (this.config.reduceMotion) {
      root.setAttribute('data-reduce-motion', 'true')
    } else {
      root.removeAttribute('data-reduce-motion')
    }

    // 大文本模式
    if (this.config.largeText) {
      root.setAttribute('data-large-text', 'true')
    } else {
      root.removeAttribute('data-large-text')
    }

    // 色盲模式
    if (this.config.colorBlindMode !== 'none') {
      root.setAttribute('data-color-blind', this.config.colorBlindMode)
    } else {
      root.removeAttribute('data-color-blind')
    }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.applyAccessibilitySettings()
    this.saveConfig()
  }

  /**
   * 获取当前配置
   */
  getConfig(): AccessibilityConfig {
    return { ...this.config }
  }

  /**
   * 启用屏幕阅读器支持
   */
  enableScreenReaderSupport(): void {
    this.updateConfig({ screenReaderSupport: true })
  }

  /**
   * 禁用屏幕阅读器支持
   */
  disableScreenReaderSupport(): void {
    this.updateConfig({ screenReaderSupport: false })
  }

  /**
   * 启用键盘导航
   */
  enableKeyboardNavigation(): void {
    this.updateConfig({ keyboardNavigation: true })
  }

  /**
   * 禁用键盘导航
   */
  disableKeyboardNavigation(): void {
    this.updateConfig({ keyboardNavigation: false })
  }

  /**
   * 启用高对比度模式
   */
  enableHighContrast(): void {
    this.updateConfig({ highContrast: true })
  }

  /**
   * 禁用高对比度模式
   */
  disableHighContrast(): void {
    this.updateConfig({ highContrast: false })
  }

  /**
   * 启用减少动效模式
   */
  enableReduceMotion(): void {
    this.updateConfig({ reduceMotion: true })
  }

  /**
   * 禁用减少动效模式
   */
  disableReduceMotion(): void {
    this.updateConfig({ reduceMotion: false })
  }

  /**
   * 启用大文本模式
   */
  enableLargeText(): void {
    this.updateConfig({ largeText: true })
  }

  /**
   * 禁用大文本模式
   */
  disableLargeText(): void {
    this.updateConfig({ largeText: false })
  }

  /**
   * 设置色盲模式
   */
  setColorBlindMode(mode: AccessibilityConfig['colorBlindMode']): void {
    this.updateConfig({ colorBlindMode: mode })
  }

  /**
   * 朗读文本（屏幕阅读器支持）
   */
  speak(text: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.config.screenReaderSupport) return

    const ariaLive = document.createElement('div')
    ariaLive.setAttribute('aria-live', priority)
    ariaLive.setAttribute('aria-atomic', 'true')
    ariaLive.className = 'sr-only'
    ariaLive.textContent = text

    document.body.appendChild(ariaLive)

    // 自动移除
    setTimeout(() => {
      if (ariaLive.parentNode) {
        ariaLive.parentNode.removeChild(ariaLive)
      }
    }, 1000)
  }

  /**
   * 聚焦到元素
   */
  focusElement(element: HTMLElement): void {
    if (!this.config.keyboardNavigation) return

    element.focus()
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  /**
   * 检查当前无障碍状态
   */
  getAccessibilityStatus(): {
    isAccessible: boolean
    issues: string[]
    suggestions: string[]
  } {
    const issues: string[] = []
    const suggestions: string[] = []

    // 检查ARIA标签
    const elementsWithoutAria = document.querySelectorAll<HTMLElement>(
      'button:not([aria-label]), input:not([aria-label]):not([type="hidden"]), [role]:not([aria-label])'
    )

    if (elementsWithoutAria.length > 0) {
      issues.push(`${elementsWithoutAria.length} 个元素缺少ARIA标签`)
      suggestions.push('为所有交互元素添加适当的ARIA标签')
    }

    // 检查颜色对比度
    const lowContrastElements = this.checkColorContrast()
    if (lowContrastElements.length > 0) {
      issues.push(`${lowContrastElements.length} 个元素颜色对比度不足`)
      suggestions.push('提高文本与背景的颜色对比度')
    }

    // 检查键盘可访问性
    const nonFocusableButtons = document.querySelectorAll<HTMLElement>(
      'button:not([tabindex]):not([disabled])'
    )

    if (nonFocusableButtons.length > 0) {
      issues.push(`${nonFocusableButtons.length} 个按钮无法通过键盘访问`)
      suggestions.push('为所有按钮添加tabindex属性')
    }

    return {
      isAccessible: issues.length === 0,
      issues,
      suggestions,
    }
  }

  /**
   * 检查颜色对比度
   */
  private checkColorContrast(): HTMLElement[] {
    const elements: HTMLElement[] = []
    const textElements = document.querySelectorAll<HTMLElement>('*')

    for (const element of Array.from(textElements)) {
      const style = window.getComputedStyle(element)
      const color = style.color
      const backgroundColor = style.backgroundColor

      // 这里可以添加颜色对比度计算逻辑
      // 简化版本：只检查是否有足够的颜色差异
      if (color && backgroundColor && color !== backgroundColor) {
        // 实际实现中应该计算对比度比率
        // 这里只是示例
        elements.push(element)
      }
    }

    return elements
  }

  /**
   * 重置为默认设置
   */
  resetToDefaults(): void {
    this.config = {
      screenReaderSupport: true,
      keyboardNavigation: true,
      highContrast: false,
      reduceMotion: false,
      largeText: false,
      colorBlindMode: 'none',
    }
    this.applyAccessibilitySettings()
    this.saveConfig()
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    // 清理事件监听器
    document.removeEventListener('keydown', this.handleTabNavigation)
  }
}

// 创建全局无障碍管理器实例
export const accessibilityManager = new AccessibilityManager()

// 开发环境下在控制台提供访问
if (import.meta.env.DEV) {
  ;(window as any).accessibilityManager = accessibilityManager
}

/**
 * 屏幕阅读器专用CSS类
 */
const screenReaderStyles = `
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

[data-high-contrast] {
  --color-primary: #ffff00;
  --color-secondary: #ffffff;
  --color-background: #000000;
  --color-surface: #000000;
  --color-text: #ffffff;
  --color-text-secondary: #ffff00;
  --color-accent: #00ff00;
  --color-error: #ff0000;
  --color-warning: #ffff00;
  --color-success: #00ff00;
}

[data-reduce-motion] * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}

[data-large-text] {
  font-size: 1.25em;
}

[data-color-blind="protanopia"] {
  filter: url('#protanopia-filter');
}

[data-color-blind="deuteranopia"] {
  filter: url('#deuteranopia-filter');
}

[data-color-blind="tritanopia"] {
  filter: url('#tritanopia-filter');
}
`

// 注入屏幕阅读器样式
const style = document.createElement('style')
style.textContent = screenReaderStyles
document.head.appendChild(style)