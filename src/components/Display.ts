/* *
 * 计算器显示屏组件
 * 负责显示表达式和计算结果，支持动画效果和多种显示模式 */

import type { Theme, DisplayConfig } from '../types/calculator.js'

interface DisplayState {
  expression: string
  result: string
  isCalculating: boolean
  error: string | null
}

export class Display {
  private element: HTMLElement
  private expressionElement: HTMLElement
  private resultElement: HTMLElement
  private config: DisplayConfig
  private animationFrameId: number | null = null

  constructor(container: HTMLElement, config: DisplayConfig) {
    this.config = config
    this.element = this.createElement()
    this.expressionElement = this.element.querySelector('.display-expression') as HTMLElement
    this.resultElement = this.element.querySelector('.display-result') as HTMLElement

    container.appendChild(this.element)
    this.setupEventListeners()
  }

  /* *
   * 初始化组件 */
  async init(): Promise<void> {
    // 组件已在构造函数中初始化
  }

  /* *
   * 创建显示器元素 */
  private createElement(): HTMLElement {
    const display = document.createElement('div')
    display.className = 'calculator-display'
    display.innerHTML = `
      <div class="display-container">
        <div class="display-expression" role="log" aria-label="表达式显示">
          <span class="expression-text"></span>
        </div>
        <div class="display-result" role="log" aria-label="计算结果">
          <span class="result-text">0</span>
        </div>
        <div class="display-status">
          <span class="memory-indicator" aria-label="内存状态"></span>
          <span class="angle-indicator" aria-label="角度单位"></span>
        </div>
      </div>
    `
    return display
  }

  /* *
   * 设置事件监听器 */
  private setupEventListeners(): void {
    // 支持双击复制结果
    this.resultElement.addEventListener('dblclick', () => {
      this.copyResult()
    })

    // 支持长按复制（移动端）
    let longPressTimer: number | null = null
    this.resultElement.addEventListener('touchstart', () => {
      longPressTimer = window.setTimeout(() => {
        this.copyResult()
        this.vibrate(50) // 触觉反馈
      }, 800)
    })

    this.resultElement.addEventListener('touchend', () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        longPressTimer = null
      }
    })

    // 无障碍支持 - 键盘导航
    this.element.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        this.copyResult()
        e.preventDefault()
      }
    })
  }

  /* *
   * 更新状态 */
  update(state: DisplayState): void {
    this.updateExpression(state.expression)
    if (state.error) {
      this.showError(state.error)
    } else {
      this.updateResult(state.result)
      this.hideError()
    }
  }

  /* *
   * 更新表达式显示 */
  updateExpression(expression: string): void {
    const expressionText = this.expressionElement.querySelector('.expression-text') as HTMLElement
    if (!expressionText) return

    // 格式化表达式以提高可读性
    const formattedExpression = this.formatExpression(expression)

    // 添加淡入动画
    this.animateTextChange(expressionText, formattedExpression)

    // 自动滚动到末尾
    this.scrollToEnd(this.expressionElement)
  }

  /* *
   * 更新结果显示 */
  updateResult(result: string): void {
    const resultText = this.resultElement.querySelector('.result-text') as HTMLElement
    if (!resultText) return

    // 格式化结果
    const formattedResult = this.formatNumber(result)

    // 添加动画效果
    this.animateResultChange(resultText, formattedResult, false)

    // 更新样式
    this.resultElement.classList.remove('error')
    this.resultElement.classList.toggle('success', result !== '0')
  }

  /* *
   * 显示错误信息 */
  showError(message: string): void {
    const resultText = this.resultElement.querySelector('.result-text') as HTMLElement
    if (!resultText) return

    this.animateResultChange(resultText, message, true)
    this.resultElement.classList.add('error')

    // 添加震动效果（如果支持）
    this.shakeDisplay()
    this.vibrate(200)
  }

  /* *
   * 隐藏错误状态 */
  hideError(): void {
    this.resultElement.classList.remove('error')
  }

  /* *
   * 清空显示器 */
  clear(): void {
    this.updateExpression('')
    this.updateResult('0')
    this.clearStatus()
  }

  /* *
   * 更新内存状态指示器 */
  updateMemoryStatus(hasMemory: boolean): void {
    const memoryIndicator = this.element.querySelector('.memory-indicator') as HTMLElement
    if (memoryIndicator) {
      memoryIndicator.textContent = hasMemory ? 'M' : ''
      memoryIndicator.classList.toggle('active', hasMemory)
    }
  }

  /* *
   * 更新角度单位指示器 */
  updateAngleMode(mode: 'degrees' | 'radians' | 'gradians'): void {
    const angleIndicator = this.element.querySelector('.angle-indicator') as HTMLElement
    if (angleIndicator) {
      const modeText = {
        degrees: 'DEG',
        radians: 'RAD',
        gradians: 'GRAD',
      }
      angleIndicator.textContent = modeText[mode]
    }
  }

  /* *
   * 更新主题 */
  updateTheme(theme: Theme): void {
    this.config.theme = theme
    this.element.className = `calculator-display theme-${theme.mode}`

    // 应用主题颜色
    Object.entries(theme.cssVariables).forEach(([property, value]) => {
      this.element.style.setProperty(property, value)
    })
  }

  /* *
   * 设置字体大小 */
  setFontSize(size: number): void {
    if (this.config.fontSize !== undefined) {
      this.config.fontSize = size
    }
    this.element.style.fontSize = `${size}px`
  }

  /* *
   * 处理大小变化 */
  handleResize(): void {
    // 重新计算字体大小和布局
    const containerWidth = this.element.clientWidth
    const baseSize = Math.max(16, containerWidth / 20)
    this.setFontSize(baseSize)
  }

  /* *
   * 获取当前显示的结果 */
  getCurrentResult(): string {
    const resultText = this.resultElement.querySelector('.result-text') as HTMLElement
    return resultText ? resultText.textContent || '0' : '0'
  }

  /* *
   * 格式化表达式 */
  private formatExpression(expression: string): string {
    if (!expression) return ''

    // 替换操作符为更美观的符号
    return expression
      .replace(/\*/g, '×')
      .replace(/\//g, '÷')
      .replace(/sqrt/g, '√')
      .replace(/pi/g, 'π')
      .replace(/e\b/g, 'ℯ')
      .replace(/infinity/g, '∞')
      .replace(/<=>/g, '≤')
      .replace(/>=/g, '≥')
      .replace(/!=/g, '≠')
  }

  /* *
   * 格式化数字 */
  private formatNumber(value: string): string {
    if (!value || value === '0') return '0'

    const num = parseFloat(value)
    if (isNaN(num)) return value

    // 处理特殊值
    if (!isFinite(num)) {
      return num > 0 ? '∞' : '-∞'
    }

    // 根据配置格式化数字
    const precision = this.config.precision || 12

    // 科学记数法处理
    if (Math.abs(num) >= 1e12 || (Math.abs(num) < 1e-6 && num !== 0)) {
      return num.toExponential(Math.min(precision - 1, 6))
    }

    // 普通格式
    const formatted = num.toPrecision(precision)
    const result = parseFloat(formatted).toString()

    // 添加千位分隔符（可选）
    if (Math.abs(num) >= 1000) {
      return this.addThousandSeparators(result)
    }

    return result
  }

  /* *
   * 添加千位分隔符 */
  private addThousandSeparators(value: string): string {
    const parts = value.split('.')
    if (parts[0]) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
    return parts.join('.')
  }

  /* *
   * 动画化文本变化 */
  private animateTextChange(element: HTMLElement, newText: string): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }

    element.style.opacity = '0.7'
    element.style.transform = 'scale(0.98)'

    this.animationFrameId = requestAnimationFrame(() => {
      element.textContent = newText
      element.style.opacity = '1'
      element.style.transform = 'scale(1)'
      this.animationFrameId = null
    })
  }

  /* *
   * 动画化结果变化 */
  private animateResultChange(element: HTMLElement, newText: string, isError: boolean): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }

    // 缩放效果
    element.style.transform = 'scale(0.95)'

    this.animationFrameId = requestAnimationFrame(() => {
      element.textContent = newText
      element.style.transform = isError ? 'scale(1.05)' : 'scale(1.02)'

      // 恢复正常大小
      setTimeout(() => {
        element.style.transform = 'scale(1)'
      }, 150)

      this.animationFrameId = null
    })
  }

  /* *
   * 震动显示器（错误时） */
  private shakeDisplay(): void {
    this.element.style.animation = 'shake 0.5s ease-in-out'
    setTimeout(() => {
      this.element.style.animation = ''
    }, 500)
  }

  /* *
   * 滚动到末尾 */
  private scrollToEnd(element: HTMLElement): void {
    element.scrollLeft = element.scrollWidth
  }

  /* *
   * 复制结果到剪贴板 */
  private async copyResult(): Promise<void> {
    const result = this.getCurrentResult()
    if (result === '0') return

    try {
      await navigator.clipboard.writeText(result)

      // 显示复制成功提示
      this.showCopyFeedback()
      this.vibrate(30)
    } catch (error) {
      console.warn('无法复制到剪贴板:', error)

      // 回退方案：选择文本
      this.selectResultText()
    }
  }

  /* *
   * 显示复制成功反馈 */
  private showCopyFeedback(): void {
    const feedback = document.createElement('div')
    feedback.className = 'copy-feedback'
    feedback.textContent = '已复制'
    feedback.setAttribute('aria-live', 'polite')

    this.element.appendChild(feedback)

    // 动画效果
    requestAnimationFrame(() => {
      feedback.style.opacity = '1'
      feedback.style.transform = 'translateY(-10px)'
    })

    // 移除反馈
    setTimeout(() => {
      feedback.style.opacity = '0'
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.parentNode.removeChild(feedback)
        }
      }, 200)
    }, 1500)
  }

  /* *
   * 选择结果文本（复制失败时的回退方案） */
  private selectResultText(): void {
    const resultText = this.resultElement.querySelector('.result-text') as HTMLElement
    if (resultText) {
      const range = document.createRange()
      range.selectNodeContents(resultText)
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
      }
    }
  }

  /* *
   * 清空状态指示器 */
  private clearStatus(): void {
    this.updateMemoryStatus(false)
    this.element.classList.remove('error', 'success')
  }

  /* *
   * 销毁组件 */
  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }

    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }
  }

  /* *
   * 触觉反馈 */
  private vibrate(duration: number): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration)
    }
  }
}
