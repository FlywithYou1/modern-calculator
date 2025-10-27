import type { Theme, DisplayConfig } from '@/types/calculator'
import { translate } from '@/utils/i18n'

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

  async init(): Promise<void> {
  }

  private createElement(): HTMLElement {
    const display = document.createElement('div')
    display.className = 'calculator-display'
    display.innerHTML = `
      <div class="display-container">
        <div class="display-expression" role="log" data-i18n-aria-label="display.expression.label">
          <span class="expression-text"></span>
        </div>
        <div class="display-result" role="log" data-i18n-aria-label="display.result.label">
          <span class="result-text">0</span>
        </div>
        <div class="display-status">
          <span class="memory-indicator" data-i18n-aria-label="display.status.memory"></span>
          <span class="angle-indicator" data-i18n-aria-label="display.status.angle"></span>
        </div>
      </div>
    `
    return display
  }

  private setupEventListeners(): void {
    this.resultElement.addEventListener('dblclick', () => {
      this.copyResult()
    })

    let longPressTimer: number | null = null
    this.resultElement.addEventListener('touchstart', () => {
      longPressTimer = window.setTimeout(() => {
        this.copyResult()
        this.vibrate(50)
      }, 800)
    })

    this.resultElement.addEventListener('touchend', () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        longPressTimer = null
      }
    })

    this.element.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        this.copyResult()
        e.preventDefault()
      }
    })
  }

  update(state: DisplayState): void {
    this.updateExpression(state.expression)
    if (state.error) {
      this.showError(state.error)
    } else {
      this.updateResult(state.result)
      this.hideError()
    }
  }

  updateExpression(expression: string): void {
    const expressionText = this.expressionElement.querySelector('.expression-text') as HTMLElement
    if (!expressionText) return

    const formattedExpression = this.formatExpression(expression)

    this.animateTextChange(expressionText, formattedExpression)

    this.scrollToEnd(this.expressionElement)
  }

  updateResult(result: string): void {
    const resultText = this.resultElement.querySelector('.result-text') as HTMLElement
    if (!resultText) return

    const formattedResult = this.formatNumber(result)

    this.animateResultChange(resultText, formattedResult, false)

    this.resultElement.classList.remove('error')
    this.resultElement.classList.toggle('success', result !== '0')
  }

  showError(message: string): void {
    const resultText = this.resultElement.querySelector('.result-text') as HTMLElement
    if (!resultText) return

    this.animateResultChange(resultText, message, true)
    this.resultElement.classList.add('error')

    this.shakeDisplay()
    this.vibrate(200)
  }

  hideError(): void {
    this.resultElement.classList.remove('error')
  }

  clear(): void {
    this.updateExpression('')
    this.updateResult('0')
    this.clearStatus()
  }

  updateMemoryStatus(hasMemory: boolean): void {
    const memoryIndicator = this.element.querySelector('.memory-indicator') as HTMLElement
    if (memoryIndicator) {
      memoryIndicator.textContent = hasMemory ? 'M' : ''
      memoryIndicator.classList.toggle('active', hasMemory)
    }
  }

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

  updateTheme(theme: Theme): void {
    this.config.theme = theme
    this.element.className = `calculator-display theme-${theme.mode}`

    Object.entries(theme.cssVariables).forEach(([property, value]) => {
      this.element.style.setProperty(property, value)
    })
  }

  setFontSize(size: number): void {
    if (this.config.fontSize !== undefined) {
      this.config.fontSize = size
    }
    this.element.style.fontSize = `${size}px`
  }

  handleResize(): void {
    const containerWidth = this.element.clientWidth
    const baseSize = Math.max(16, containerWidth / 20)
    this.setFontSize(baseSize)
  }

  getCurrentResult(): string {
    const resultText = this.resultElement.querySelector('.result-text') as HTMLElement
    return resultText ? resultText.textContent || '0' : '0'
  }

  private formatExpression(expression: string): string {
    if (!expression) return ''

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

  private formatNumber(value: string): string {
    if (!value || value === '0') return '0'

    const num = parseFloat(value)
    if (isNaN(num)) return value

    if (!isFinite(num)) {
      return num > 0 ? '∞' : '-∞'
    }

    const precision = this.config.precision || 12

    if (Math.abs(num) >= 1e12 || (Math.abs(num) < 1e-6 && num !== 0)) {
      return num.toExponential(Math.min(precision - 1, 6))
    }

    const formatted = num.toPrecision(precision)
    const result = parseFloat(formatted).toString()

    if (Math.abs(num) >= 1000) {
      return this.addThousandSeparators(result)
    }

    return result
  }

  private addThousandSeparators(value: string): string {
    const parts = value.split('.')
    if (parts[0]) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
    return parts.join('.')
  }

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

  private animateResultChange(element: HTMLElement, newText: string, isError: boolean): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }

    element.style.transform = 'scale(0.95)'

    this.animationFrameId = requestAnimationFrame(() => {
      element.textContent = newText
      element.style.transform = isError ? 'scale(1.05)' : 'scale(1.02)'

      setTimeout(() => {
        element.style.transform = 'scale(1)'
      }, 150)

      this.animationFrameId = null
    })
  }

  private shakeDisplay(): void {
    this.element.style.animation = 'shake 0.5s ease-in-out'
    setTimeout(() => {
      this.element.style.animation = ''
    }, 500)
  }

  private scrollToEnd(element: HTMLElement): void {
    element.scrollLeft = element.scrollWidth
  }

  private async copyResult(): Promise<void> {
    const result = this.getCurrentResult()
    if (result === '0') return

    try {
      await navigator.clipboard.writeText(result)

      this.showCopyFeedback()
      this.vibrate(30)
    } catch (error) {
      console.warn('无法复制到剪贴板:', error)

      this.selectResultText()
    }
  }

  private showCopyFeedback(): void {
    const feedback = document.createElement('div')
    feedback.className = 'copy-feedback'
    feedback.textContent = translate('display.copy.success') || '已复制'
    feedback.setAttribute('aria-live', 'polite')

    this.element.appendChild(feedback)

    requestAnimationFrame(() => {
      feedback.style.opacity = '1'
      feedback.style.transform = 'translateY(-10px)'
    })

    setTimeout(() => {
      feedback.style.opacity = '0'
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.parentNode.removeChild(feedback)
        }
      }, 200)
    }, 1500)
  }

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

  private clearStatus(): void {
    this.updateMemoryStatus(false)
    this.element.classList.remove('error', 'success')
  }

  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }

    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }
  }

  private vibrate(duration: number): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration)
    }
  }
}
