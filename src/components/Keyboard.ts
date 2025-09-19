/**
 * 计算器键盘组件
 * 负责渲染科学计算器键盘，支持多种布局模式和触觉反馈
 */

import type { Theme, ButtonConfig, KeyboardConfig } from '../types/calculator.js'

export class Keyboard {
  private element: HTMLElement
  private config: KeyboardConfig
  private currentLayout: 'standard' | 'scientific' | 'programmer' = 'standard'
  private pressedKeys = new Set<string>()

  constructor(container: HTMLElement, config: KeyboardConfig) {
    this.config = config
    this.element = this.createElement()
    container.appendChild(this.element)
    this.setupEventListeners()
    this.updateLayout()
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 键盘事件监听将在主应用中处理
    // 这里主要处理触摸和鼠标事件的全局设置
  }

  /**
   * 初始化组件
   */
  async init(): Promise<void> {
    // 组件已在构造函数中初始化
  }

  /**
   * 创建键盘元素
   */
  private createElement(): HTMLElement {
    const keyboard = document.createElement('div')
    keyboard.className = 'calculator-keyboard'
    keyboard.setAttribute('role', 'grid')
    keyboard.setAttribute('aria-label', '计算器键盘')
    return keyboard
  }

  /**
   * 获取按钮配置
   */
  private getButtonConfigs(): ButtonConfig[][] {
    switch (this.currentLayout) {
      case 'scientific':
        return this.getScientificButtons()
      case 'programmer':
        return this.getProgrammerButtons()
      default:
        return this.getStandardButtons()
    }
  }

  /**
   * 标准键盘布局
   */
  private getStandardButtons(): ButtonConfig[][] {
    return [
      [
        {
          id: 'clear',
          text: 'C',
          label: '清除',
          value: 'clear',
          type: 'action',
          operation: { type: 'action', value: 'clear', symbol: 'C' },
          className: 'btn-action',
        },
        {
          id: 'backspace',
          text: '⌫',
          label: '退格',
          value: 'backspace',
          type: 'action',
          operation: { type: 'action', value: 'backspace', symbol: '⌫' },
          className: 'btn-action',
        },
        {
          id: 'percent',
          text: '%',
          label: '百分号',
          value: '%',
          type: 'operator',
          operation: { type: 'operator', value: '%', symbol: '%' },
          className: 'btn-operator',
        },
        {
          id: 'divide',
          text: '÷',
          label: '除法',
          value: '/',
          type: 'operator',
          operation: { type: 'operator', value: '/', symbol: '÷' },
          className: 'btn-operator',
        },
      ],
      [
        {
          id: 'seven',
          text: '7',
          label: '数字7',
          value: '7',
          type: 'number',
          operation: { type: 'number', value: '7', symbol: '7' },
        },
        {
          id: 'eight',
          text: '8',
          label: '数字8',
          value: '8',
          type: 'number',
          operation: { type: 'number', value: '8', symbol: '8' },
        },
        {
          id: 'nine',
          text: '9',
          label: '数字9',
          value: '9',
          type: 'number',
          operation: { type: 'number', value: '9', symbol: '9' },
        },
        {
          id: 'multiply',
          text: '×',
          label: '乘法',
          value: '*',
          type: 'operator',
          operation: { type: 'operator', value: '*', symbol: '×' },
          className: 'btn-operator',
        },
      ],
      [
        {
          id: 'four',
          text: '4',
          label: '数字4',
          value: '4',
          type: 'number',
          operation: { type: 'number', value: '4', symbol: '4' },
        },
        {
          id: 'five',
          text: '5',
          label: '数字5',
          value: '5',
          type: 'number',
          operation: { type: 'number', value: '5', symbol: '5' },
        },
        {
          id: 'six',
          text: '6',
          label: '数字6',
          value: '6',
          type: 'number',
          operation: { type: 'number', value: '6', symbol: '6' },
        },
        {
          id: 'subtract',
          text: '−',
          label: '减法',
          value: '-',
          type: 'operator',
          operation: { type: 'operator', value: '-', symbol: '−' },
          className: 'btn-operator',
        },
      ],
      [
        {
          id: 'one',
          text: '1',
          label: '数字1',
          value: '1',
          type: 'number',
          operation: { type: 'number', value: '1', symbol: '1' },
        },
        {
          id: 'two',
          text: '2',
          label: '数字2',
          value: '2',
          type: 'number',
          operation: { type: 'number', value: '2', symbol: '2' },
        },
        {
          id: 'three',
          text: '3',
          label: '数字3',
          value: '3',
          type: 'number',
          operation: { type: 'number', value: '3', symbol: '3' },
        },
        {
          id: 'add',
          text: '+',
          label: '加法',
          value: '+',
          type: 'operator',
          operation: { type: 'operator', value: '+', symbol: '+' },
          className: 'btn-operator',
        },
      ],
      [
        {
          id: 'zero',
          text: '0',
          label: '数字0',
          value: '0',
          type: 'number',
          operation: { type: 'number', value: '0', symbol: '0' },
          className: 'btn-wide',
        },
        {
          id: 'decimal',
          text: '.',
          label: '小数点',
          value: '.',
          type: 'number',
          operation: { type: 'number', value: '.', symbol: '.' },
        },
        {
          id: 'equals',
          text: '=',
          label: '等于',
          value: '=',
          type: 'action',
          operation: { type: 'action', value: 'equals', symbol: '=' },
          className: 'btn-equals',
        },
      ],
    ]
  }

  /**
   * 科学计算器键盘布局
   */
  private getScientificButtons(): ButtonConfig[][] {
    return [
      [
        {
          id: 'second',
          text: '2nd',
          label: '二次功能',
          value: '2nd',
          type: 'action',
          operation: { type: 'action', value: '2nd', symbol: '2nd' },
          className: 'btn-function',
        },
        {
          id: 'pi',
          text: 'π',
          label: '圆周率',
          value: 'pi',
          type: 'constant',
          operation: { type: 'constant', value: 'pi', symbol: 'π' },
          className: 'btn-constant',
        },
        {
          id: 'e',
          text: 'e',
          label: '自然常数',
          value: 'e',
          type: 'constant',
          operation: { type: 'constant', value: 'e', symbol: 'e' },
          className: 'btn-constant',
        },
        {
          id: 'clear',
          text: 'C',
          label: '清除',
          value: 'clear',
          type: 'action',
          operation: { type: 'action', value: 'clear', symbol: 'C' },
          className: 'btn-action',
        },
        {
          id: 'backspace',
          text: '⌫',
          label: '退格',
          value: 'backspace',
          type: 'action',
          operation: { type: 'action', value: 'backspace', symbol: '⌫' },
          className: 'btn-action',
        },
      ],
      [
        {
          id: 'sin',
          text: 'sin',
          label: '正弦函数',
          value: 'sin',
          type: 'function',
          operation: { type: 'function', value: 'sin', symbol: 'sin' },
          className: 'btn-function',
        },
        {
          id: 'cos',
          text: 'cos',
          label: '余弦函数',
          value: 'cos',
          type: 'function',
          operation: { type: 'function', value: 'cos', symbol: 'cos' },
          className: 'btn-function',
        },
        {
          id: 'tan',
          text: 'tan',
          label: '正切函数',
          value: 'tan',
          type: 'function',
          operation: { type: 'function', value: 'tan', symbol: 'tan' },
          className: 'btn-function',
        },
        {
          id: 'lparen',
          text: '(',
          label: '左括号',
          value: '(',
          type: 'bracket',
          operation: { type: 'bracket', value: '(', symbol: '(' },
        },
        {
          id: 'rparen',
          text: ')',
          label: '右括号',
          value: ')',
          type: 'bracket',
          operation: { type: 'bracket', value: ')', symbol: ')' },
        },
      ],
      [
        {
          id: 'ln',
          text: 'ln',
          label: '自然对数',
          value: 'ln',
          type: 'function',
          operation: { type: 'function', value: 'ln', symbol: 'ln' },
          className: 'btn-function',
        },
        {
          id: 'log',
          text: 'log',
          label: '常用对数',
          value: 'log',
          type: 'function',
          operation: { type: 'function', value: 'log', symbol: 'log' },
          className: 'btn-function',
        },
        {
          id: 'sqrt',
          text: '√',
          label: '平方根',
          value: 'sqrt',
          type: 'function',
          operation: { type: 'function', value: 'sqrt', symbol: '√' },
          className: 'btn-function',
        },
        {
          id: 'power',
          text: 'x^y',
          label: '乘方',
          value: '^',
          type: 'operator',
          operation: { type: 'operator', value: '^', symbol: '^' },
          className: 'btn-operator',
        },
        {
          id: 'factorial',
          text: 'x!',
          label: '阶乘',
          value: '!',
          type: 'operator',
          operation: { type: 'operator', value: '!', symbol: '!' },
          className: 'btn-operator',
        },
      ],
      [
        {
          id: 'seven',
          text: '7',
          label: '数字7',
          value: '7',
          type: 'number',
          operation: { type: 'number', value: '7', symbol: '7' },
        },
        {
          id: 'eight',
          text: '8',
          label: '数字8',
          value: '8',
          type: 'number',
          operation: { type: 'number', value: '8', symbol: '8' },
        },
        {
          id: 'nine',
          text: '9',
          label: '数字9',
          value: '9',
          type: 'number',
          operation: { type: 'number', value: '9', symbol: '9' },
        },
        {
          id: 'divide',
          text: '÷',
          label: '除法',
          value: '/',
          type: 'operator',
          operation: { type: 'operator', value: '/', symbol: '÷' },
          className: 'btn-operator',
        },
        {
          id: 'percent',
          text: '%',
          label: '百分号',
          value: '%',
          type: 'operator',
          operation: { type: 'operator', value: '%', symbol: '%' },
          className: 'btn-operator',
        },
      ],
      [
        {
          id: 'four',
          text: '4',
          label: '数字4',
          value: '4',
          type: 'number',
          operation: { type: 'number', value: '4', symbol: '4' },
        },
        {
          id: 'five',
          text: '5',
          label: '数字5',
          value: '5',
          type: 'number',
          operation: { type: 'number', value: '5', symbol: '5' },
        },
        {
          id: 'six',
          text: '6',
          label: '数字6',
          value: '6',
          type: 'number',
          operation: { type: 'number', value: '6', symbol: '6' },
        },
        {
          id: 'multiply',
          text: '×',
          label: '乘法',
          value: '*',
          type: 'operator',
          operation: { type: 'operator', value: '*', symbol: '×' },
          className: 'btn-operator',
        },
        {
          id: 'inverse',
          text: '1/x',
          label: '倒数',
          value: 'inv',
          type: 'function',
          operation: { type: 'function', value: 'inv', symbol: '1/x' },
          className: 'btn-function',
        },
      ],
      [
        {
          id: 'one',
          text: '1',
          label: '数字1',
          value: '1',
          type: 'number',
          operation: { type: 'number', value: '1', symbol: '1' },
        },
        {
          id: 'two',
          text: '2',
          label: '数字2',
          value: '2',
          type: 'number',
          operation: { type: 'number', value: '2', symbol: '2' },
        },
        {
          id: 'three',
          text: '3',
          label: '数字3',
          value: '3',
          type: 'number',
          operation: { type: 'number', value: '3', symbol: '3' },
        },
        {
          id: 'subtract',
          text: '−',
          label: '减法',
          value: '-',
          type: 'operator',
          operation: { type: 'operator', value: '-', symbol: '−' },
          className: 'btn-operator',
        },
        {
          id: 'square',
          text: 'x²',
          label: '平方',
          value: 'square',
          type: 'function',
          operation: { type: 'function', value: 'square', symbol: 'x²' },
          className: 'btn-function',
        },
      ],
      [
        {
          id: 'zero',
          text: '0',
          label: '数字0',
          value: '0',
          type: 'number',
          operation: { type: 'number', value: '0', symbol: '0' },
        },
        {
          id: 'decimal',
          text: '.',
          label: '小数点',
          value: '.',
          type: 'number',
          operation: { type: 'number', value: '.', symbol: '.' },
        },
        {
          id: 'negative',
          text: '±',
          label: '正负号',
          value: 'negate',
          type: 'action',
          operation: { type: 'action', value: 'negate', symbol: '±' },
          className: 'btn-action',
        },
        {
          id: 'add',
          text: '+',
          label: '加法',
          value: '+',
          type: 'operator',
          operation: { type: 'operator', value: '+', symbol: '+' },
          className: 'btn-operator',
        },
        {
          id: 'equals',
          text: '=',
          label: '等于',
          value: '=',
          type: 'action',
          operation: { type: 'action', value: 'equals', symbol: '=' },
          className: 'btn-equals',
        },
      ],
    ]
  }

  /**
   * 程序员键盘布局
   */
  private getProgrammerButtons(): ButtonConfig[][] {
    return [
      [
        {
          id: 'hex',
          text: 'HEX',
          label: '十六进制',
          value: 'hex',
          type: 'action',
          operation: { type: 'action', value: 'hex', symbol: 'HEX' },
          className: 'btn-base active',
        },
        {
          id: 'dec',
          text: 'DEC',
          label: '十进制',
          value: 'dec',
          type: 'action',
          operation: { type: 'action', value: 'dec', symbol: 'DEC' },
          className: 'btn-base',
        },
        {
          id: 'oct',
          text: 'OCT',
          label: '八进制',
          value: 'oct',
          type: 'action',
          operation: { type: 'action', value: 'oct', symbol: 'OCT' },
          className: 'btn-base',
        },
        {
          id: 'bin',
          text: 'BIN',
          label: '二进制',
          value: 'bin',
          type: 'action',
          operation: { type: 'action', value: 'bin', symbol: 'BIN' },
          className: 'btn-base',
        },
      ],
      [
        {
          id: 'A',
          text: 'A',
          label: '十六进制A',
          value: 'A',
          type: 'number',
          operation: { type: 'number', value: 'A', symbol: 'A' },
          className: 'btn-hex',
        },
        {
          id: 'B',
          text: 'B',
          label: '十六进制B',
          value: 'B',
          type: 'number',
          operation: { type: 'number', value: 'B', symbol: 'B' },
          className: 'btn-hex',
        },
        {
          id: 'C',
          text: 'C',
          label: '十六进制C',
          value: 'C',
          type: 'number',
          operation: { type: 'number', value: 'C', symbol: 'C' },
          className: 'btn-hex',
        },
        {
          id: 'clear',
          text: 'C',
          label: '清除',
          value: 'clear',
          type: 'action',
          operation: { type: 'action', value: 'clear', symbol: 'C' },
          className: 'btn-action',
        },
      ],
      [
        {
          id: 'D',
          text: 'D',
          label: '十六进制D',
          value: 'D',
          type: 'number',
          operation: { type: 'number', value: 'D', symbol: 'D' },
          className: 'btn-hex',
        },
        {
          id: 'E',
          text: 'E',
          label: '十六进制E',
          value: 'E',
          type: 'number',
          operation: { type: 'number', value: 'E', symbol: 'E' },
          className: 'btn-hex',
        },
        {
          id: 'F',
          text: 'F',
          label: '十六进制F',
          value: 'F',
          type: 'number',
          operation: { type: 'number', value: 'F', symbol: 'F' },
          className: 'btn-hex',
        },
        {
          id: 'backspace',
          text: '⌫',
          label: '退格',
          value: 'backspace',
          type: 'action',
          operation: { type: 'action', value: 'backspace', symbol: '⌫' },
          className: 'btn-action',
        },
      ],
    ]
  }

  /**
   * 更新键盘布局
   */
  private updateLayout(): void {
    const buttonConfigs = this.getButtonConfigs()
    this.element.innerHTML = ''

    buttonConfigs.forEach((row, rowIndex) => {
      const rowElement = document.createElement('div')
      rowElement.className = 'keyboard-row'
      rowElement.setAttribute('role', 'row')

      row.forEach((buttonConfig, colIndex) => {
        const button = this.createButton(buttonConfig)
        button.setAttribute('role', 'gridcell')
        button.setAttribute('tabindex', rowIndex === 0 && colIndex === 0 ? '0' : '-1')
        rowElement.appendChild(button)
      })

      this.element.appendChild(rowElement)
    })
  }

  /**
   * 创建按钮元素
   */
  private createButton(config: ButtonConfig): HTMLElement {
    const button = document.createElement('button')
    button.className = `keyboard-button ${config.className || ''} ${config.type}`
    button.textContent = config.text
    button.setAttribute('aria-label', config.label)
    button.setAttribute('data-value', config.value)
    button.setAttribute('data-type', config.type)

    if (config.tooltip) {
      button.title = config.tooltip
    }

    if (config.disabled) {
      button.disabled = true
      button.setAttribute('aria-disabled', 'true')
    }

    // 添加点击事件
    button.addEventListener('click', () => {
      this.handleButtonClick(config)
    })

    // 添加触摸反馈
    button.addEventListener('touchstart', () => {
      this.addPressEffect(button)
      if (this.config.enableHaptic) {
        this.vibrate(30)
      }
    })

    button.addEventListener('mousedown', () => {
      this.addPressEffect(button)
    })

    button.addEventListener('mouseup', () => {
      this.removePressEffect(button)
    })

    button.addEventListener('mouseleave', () => {
      this.removePressEffect(button)
    })

    button.addEventListener('touchend', () => {
      this.removePressEffect(button)
    })

    return button
  }

  /**
   * 处理按钮点击
   */
  private handleButtonClick(config: ButtonConfig): void {
    if (this.config.onInput) {
      this.config.onInput(config.value, config.type)
    }

    // 添加点击动画
    const button = this.element.querySelector(`[data-value="${config.value}"]`) as HTMLElement
    if (button) {
      this.animateButtonPress(button)
    }
  }

  /**
   * 设置布局模式
   */
  setLayout(layout: 'standard' | 'scientific' | 'programmer'): void {
    if (this.currentLayout !== layout) {
      this.currentLayout = layout
      this.updateLayout()
      this.element.className = `calculator-keyboard layout-${layout}`
    }
  }

  /**
   * 更新主题
   */
  updateTheme(theme: Theme): void {
    this.config.theme = theme
    this.element.className = `calculator-keyboard layout-${this.currentLayout} theme-${theme.mode}`

    // 应用主题颜色
    Object.entries(theme.cssVariables).forEach(([property, value]) => {
      this.element.style.setProperty(property, value)
    })
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<KeyboardConfig>): void {
    Object.assign(this.config, config)
  }

  /**
   * 处理键盘输入
   */
  handleKeyDown(event: KeyboardEvent): boolean {
    const key = event.key
    const button = this.findButtonByKey(key)

    if (button) {
      event.preventDefault()
      this.pressedKeys.add(key)
      this.addPressEffect(button)

      // 模拟点击
      button.click()
      return true
    }

    return false
  }

  /**
   * 处理键盘释放
   */
  handleKeyUp(event: KeyboardEvent): void {
    const key = event.key
    if (this.pressedKeys.has(key)) {
      this.pressedKeys.delete(key)
      const button = this.findButtonByKey(key)
      if (button) {
        this.removePressEffect(button)
      }
    }
  }

  /**
   * 根据键查找按钮
   */
  private findButtonByKey(key: string): HTMLElement | null {
    const keyMap: { [key: string]: string } = {
      '0': '0',
      '1': '1',
      '2': '2',
      '3': '3',
      '4': '4',
      '5': '5',
      '6': '6',
      '7': '7',
      '8': '8',
      '9': '9',
      '.': '.',
      '+': '+',
      '-': '-',
      '*': '*',
      '/': '/',
      Enter: '=',
      '=': '=',
      Escape: 'clear',
      Backspace: 'backspace',
      '(': '(',
      ')': ')',
      '%': '%',
      '^': '^',
    }

    const mappedValue = keyMap[key]
    if (mappedValue) {
      return this.element.querySelector(`[data-value="${mappedValue}"]`) as HTMLElement
    }

    return null
  }

  /**
   * 添加按压效果
   */
  private addPressEffect(button: HTMLElement): void {
    button.classList.add('pressed')
    button.style.transform = 'scale(0.95)'
  }

  /**
   * 移除按压效果
   */
  private removePressEffect(button: HTMLElement): void {
    button.classList.remove('pressed')
    button.style.transform = ''
  }

  /**
   * 按钮按压动画
   */
  private animateButtonPress(button: HTMLElement): void {
    button.style.animation = 'buttonPress 0.15s ease-out'
    setTimeout(() => {
      button.style.animation = ''
    }, 150)
  }

  /**
   * 处理大小变化
   */
  handleResize(): void {
    // 根据容器大小调整按钮尺寸
    const containerWidth = this.element.clientWidth
    const buttonSize = this.config.buttonSize || 'medium'

    let size = buttonSize
    if (containerWidth < 300) {
      size = 'small'
    } else if (containerWidth > 500) {
      size = 'large'
    }

    this.element.setAttribute('data-size', size)
  }

  /**
   * 处理方向变化
   */
  handleOrientationChange(): void {
    // 延迟处理，等待布局稳定
    setTimeout(() => {
      this.handleResize()
    }, 100)
  }

  /**
   * 启用/禁用按钮
   */
  setButtonEnabled(value: string, enabled: boolean): void {
    const button = this.element.querySelector(`[data-value="${value}"]`) as HTMLButtonElement
    if (button) {
      button.disabled = !enabled
      button.setAttribute('aria-disabled', enabled ? 'false' : 'true')
    }
  }

  /**
   * 高亮按钮
   */
  highlightButton(value: string, highlight: boolean): void {
    const button = this.element.querySelector(`[data-value="${value}"]`) as HTMLElement
    if (button) {
      button.classList.toggle('highlighted', highlight)
    }
  }

  /**
   * 触觉反馈
   */
  private vibrate(duration: number): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration)
    }
  }

  /**
   * 销毁组件
   */
  destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }
  }
}
