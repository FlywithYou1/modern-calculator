/**
 * 计算器键盘组件
 *
 * 提供：
 * - 基础数字和运算符按钮
 * - 科学计算函数按钮
 * - 响应式布局
 * - 触觉反馈（移动端）
 * - 键盘快捷键支持
 */

export interface KeyboardOptions {
  showScientific: boolean
  isMobile: boolean
  angleMode: 'deg' | 'rad' | 'grad'
  onInput: (value: string) => void
  onFunction: (func: string) => void
  onCalculate: () => void
  onClear: () => void
  onBackspace: () => void
}

export interface ButtonConfig {
  label: string
  value?: string
  func?: string
  action?: string
  className?: string
  colspan?: number
  rowspan?: number
}

/**
 * 键盘类
 */
export class Keyboard {
  private container: HTMLElement
  private options: KeyboardOptions

  constructor(container: HTMLElement, options: KeyboardOptions) {
    this.container = container
    this.options = { ...options }
    this.init()
  }

  /**
   * 初始化键盘
   */
  private init(): void {
    this.createLayout()
    this.bindEvents()
  }

  /**
   * 创建键盘布局
   */
  private createLayout(): void {
    const basicButtons = this.getBasicButtons()
    const scientificButtons = this.getScientificButtons()

    this.container.innerHTML = `
      <div class="calculator-keyboard ${this.options.isMobile ? 'mobile' : 'desktop'}">
        ${
          this.options.showScientific
            ? `
          <!-- 科学计算面板 -->
          <div class="scientific-panel ${this.options.isMobile ? 'collapsed' : ''}">
            <div class="scientific-header">
              <span class="panel-title">科学计算</span>
              <button class="panel-toggle" id="scientific-toggle">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
                </svg>
              </button>
            </div>
            <div class="scientific-content">
              ${this.createButtonGrid(scientificButtons, 'scientific')}
            </div>
          </div>
        `
            : ''
        }

        <!-- 基础计算面板 -->
        <div class="basic-panel">
          ${this.createButtonGrid(basicButtons, 'basic')}
        </div>

        <!-- 移动端专用区域 -->
        ${
          this.options.isMobile
            ? `
          <div class="mobile-actions">
            <div class="swipe-hint">
              <span>左滑查看更多功能</span>
            </div>
          </div>
        `
            : ''
        }
      </div>
    `
  }

  /**
   * 创建按钮网格
   */
  private createButtonGrid(buttons: ButtonConfig[][], type: 'basic' | 'scientific'): string {
    return `
      <div class="button-grid ${type}-grid">
        ${buttons
          .map(
            row => `
          <div class="button-row">
            ${row.map(button => this.createButton(button)).join('')}
          </div>
        `
          )
          .join('')}
      </div>
    `
  }

  /**
   * 创建单个按钮
   */
  private createButton(config: ButtonConfig): string {
    const { label, value, func, action, className = '', colspan = 1, rowspan = 1 } = config

    const dataAttrs = []
    if (value) dataAttrs.push(`data-value="${value}"`)
    if (func) dataAttrs.push(`data-func="${func}"`)
    if (action) dataAttrs.push(`data-action="${action}"`)

    const style = []
    if (colspan > 1) style.push(`grid-column: span ${colspan}`)
    if (rowspan > 1) style.push(`grid-row: span ${rowspan}`)

    return `
      <button 
        class="calc-btn ${className}" 
        ${dataAttrs.join(' ')}
        ${style.length > 0 ? `style="${style.join('; ')}"` : ''}
        title="${this.getButtonTooltip(config)}"
      >
        <span class="btn-label">${label}</span>
        ${this.getButtonSecondaryLabel(config)}
      </button>
    `
  }

  /**
   * 获取基础按钮配置
   */
  private getBasicButtons(): ButtonConfig[][] {
    return [
      // 第一行 - 清除和退格
      [
        { label: 'C', action: 'clear', className: 'clear-btn' },
        { label: '⌫', action: 'backspace', className: 'backspace-btn' },
        { label: '(', value: '(' },
        { label: ')', value: ')' },
      ],
      // 第二行 - 数字7-9和除法
      [
        { label: '7', value: '7', className: 'number-btn' },
        { label: '8', value: '8', className: 'number-btn' },
        { label: '9', value: '9', className: 'number-btn' },
        { label: '÷', value: '/', className: 'operator-btn' },
      ],
      // 第三行 - 数字4-6和乘法
      [
        { label: '4', value: '4', className: 'number-btn' },
        { label: '5', value: '5', className: 'number-btn' },
        { label: '6', value: '6', className: 'number-btn' },
        { label: '×', value: '*', className: 'operator-btn' },
      ],
      // 第四行 - 数字1-3和减法
      [
        { label: '1', value: '1', className: 'number-btn' },
        { label: '2', value: '2', className: 'number-btn' },
        { label: '3', value: '3', className: 'number-btn' },
        { label: '−', value: '-', className: 'operator-btn' },
      ],
      // 第五行 - 0、小数点和等号
      [
        { label: '0', value: '0', className: 'number-btn zero-btn', colspan: 2 },
        { label: '.', value: '.', className: 'number-btn' },
        { label: '+', value: '+', className: 'operator-btn' },
      ],
      // 第六行 - 等号
      [{ label: '=', action: 'calculate', className: 'equals-btn', colspan: 4 }],
    ]
  }

  /**
   * 获取科学计算按钮配置
   */
  private getScientificButtons(): ButtonConfig[][] {
    return [
      // 第一行 - 三角函数
      [
        { label: 'sin', func: 'sin(', className: 'function-btn' },
        { label: 'cos', func: 'cos(', className: 'function-btn' },
        { label: 'tan', func: 'tan(', className: 'function-btn' },
        { label: this.options.angleMode.toUpperCase(), action: 'angleMode', className: 'mode-btn' },
      ],
      // 第二行 - 反三角函数和常数
      [
        { label: 'asin', func: 'asin(', className: 'function-btn' },
        { label: 'acos', func: 'acos(', className: 'function-btn' },
        { label: 'atan', func: 'atan(', className: 'function-btn' },
        { label: 'π', value: 'π', className: 'constant-btn' },
      ],
      // 第三行 - 对数和指数
      [
        { label: 'ln', func: 'ln(', className: 'function-btn' },
        { label: 'log', func: 'log(', className: 'function-btn' },
        { label: 'e', value: 'e', className: 'constant-btn' },
        { label: '^', value: '^', className: 'operator-btn' },
      ],
      // 第四行 - 根号和阶乘
      [
        { label: '√', func: 'sqrt(', className: 'function-btn' },
        { label: 'x²', func: '^2', className: 'function-btn' },
        { label: 'x!', func: 'factorial(', className: 'function-btn' },
        { label: '%', value: '%', className: 'operator-btn' },
      ],
      // 第五行 - 进制转换
      [
        { label: 'BIN', func: 'bin(', className: 'function-btn' },
        { label: 'OCT', func: 'oct(', className: 'function-btn' },
        { label: 'HEX', func: 'hex(', className: 'function-btn' },
        { label: 'DEC', action: 'decMode', className: 'mode-btn' },
      ],
      // 第六行 - 统计函数
      [
        { label: 'mean', func: 'mean(', className: 'function-btn' },
        { label: 'med', func: 'median(', className: 'function-btn' },
        { label: 'std', func: 'stdev(', className: 'function-btn' },
        { label: 'var', func: 'variance(', className: 'function-btn' },
      ],
      // 第七行 - 最值和聚合函数
      [
        { label: 'min', func: 'min(', className: 'function-btn' },
        { label: 'max', func: 'max(', className: 'function-btn' },
        { label: 'sum', func: 'sum(', className: 'function-btn' },
        { label: '∏', func: 'product(', className: 'function-btn' },
      ],
      // 第八行 - 矩阵运算
      [
        { label: 'MAT', action: 'matrixMode', className: 'mode-btn' },
        { label: 'T', func: 'transpose(', className: 'function-btn' },
        { label: 'det', func: 'determinant(', className: 'function-btn' },
        { label: 'inv', func: 'inverse(', className: 'function-btn' },
      ],
      // 第九行 - 单位转换
      [
        { label: 'UNIT', action: 'unitMode', className: 'mode-btn' },
        { label: '°C→°F', func: 'tempConvert(', className: 'function-btn' },
        { label: 'm→ft', func: 'lengthConvert(', className: 'function-btn' },
        { label: 'kg→lb', func: 'weightConvert(', className: 'function-btn' },
      ],
    ]
  }

  /**
   * 获取按钮提示文本
   */
  private getButtonTooltip(config: ButtonConfig): string {
    const { label, value, func, action } = config

    if (action) {
      switch (action) {
        case 'clear':
          return '清除 (Esc)'
        case 'backspace':
          return '退格 (Backspace)'
        case 'calculate':
          return '计算 (Enter)'
        case 'angleMode':
          return `角度模式: ${this.options.angleMode}`
        default:
          return label
      }
    }

    if (func) {
      return `${label} 函数`
    }

    if (value) {
      return `输入 ${value}`
    }

    return label
  }

  /**
   * 获取按钮的辅助标签
   */
  private getButtonSecondaryLabel(_config: ButtonConfig): string {
    // 实现shift模式下的标签切换
    // 暂时返回空字符串，需要时实现
    return ''
  }

  /**
   * 提供触觉和视觉反馈
   */
  private provideFeedback(_button: HTMLButtonElement): void {
    // 震动反馈（如果支持）
    if ('vibrate' in navigator) {
      navigator.vibrate(5)
    }
  }

  /**
   * 绑定事件
   */
  private bindEvents(): void {
    // 按钮点击事件
    this.container.addEventListener('click', event => {
      const button = (event.target as HTMLElement).closest('.calc-btn') as HTMLButtonElement
      if (button) {
        this.handleButtonClick(button)
      }
    })

    // 科学面板切换
    const scientificToggle = this.container.querySelector('#scientific-toggle')
    scientificToggle?.addEventListener('click', () => {
      this.toggleScientificPanel()
    })

    // 触摸事件（移动端）
    if (this.options.isMobile) {
      this.setupTouchGestures()
    }

    // 键盘事件
    this.setupKeyboardEvents()
  }

  /**
   * 处理按钮点击
   */
  private handleButtonClick(button: HTMLButtonElement): void {
    // 触觉反馈
    this.provideFeedback(button)

    const value = button.dataset.value
    const func = button.dataset.func
    const action = button.dataset.action

    if (value) {
      this.options.onInput(value)
    } else if (func) {
      this.options.onFunction(func)
    } else if (action) {
      this.handleAction(action)
    }

    // 按钮动画
    this.animateButton(button)
  }

  /**
   * 处理动作
   */
  private handleAction(action: string): void {
    switch (action) {
      case 'clear':
        this.options.onClear()
        break
      case 'backspace':
        this.options.onBackspace()
        break
      case 'calculate':
        this.options.onCalculate()
        break
      case 'angleMode':
        this.toggleAngleMode()
        break
    }
  }

  /**
   * 切换角度模式
   */
  private toggleAngleMode(): void {
    const modes: ('deg' | 'rad' | 'grad')[] = ['deg', 'rad', 'grad']
    const currentIndex = modes.indexOf(this.options.angleMode)
    const nextMode = modes[(currentIndex + 1) % modes.length]

    // nextMode 总是存在，这里显式断言类型，确保与签名一致
    this.updateAngleMode(nextMode as 'deg' | 'rad' | 'grad')
  }

  // 取消未使用的 cycleAngleMode 方法，避免未使用方法的编译告警

  /**
   * 按钮动画
   */
  private animateButton(button: HTMLButtonElement): void {
    button.classList.add('pressed')

    requestAnimationFrame(() => {
      setTimeout(() => {
        button.classList.remove('pressed')
      }, 150)
    })
  }

  /**
   * 设置触摸手势
   */
  private setupTouchGestures(): void {
    let startX = 0
    let startY = 0

    this.container.addEventListener(
      'touchstart',
      e => {
        startX = e.touches[0]?.clientX || 0
        startY = e.touches[0]?.clientY || 0
      },
      { passive: true }
    )

    this.container.addEventListener(
      'touchmove',
      e => {
        e.preventDefault()
      },
      { passive: false }
    )

    this.container.addEventListener(
      'touchend',
      e => {
        const endX = e.changedTouches[0]?.clientX || 0
        const endY = e.changedTouches[0]?.clientY || 0

        const deltaX = endX - startX
        const deltaY = endY - startY

        // 检测滑动手势
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
          if (deltaX > 0) {
            // 右滑 - 显示科学面板
            this.showScientificPanel()
          } else {
            // 左滑 - 隐藏科学面板
            this.hideScientificPanel()
          }
        }
      },
      { passive: true }
    )
  }

  /**
   * 设置键盘事件
   */
  private setupKeyboardEvents(): void {
    // 键盘事件由父组件处理
  }

  /**
   * 切换科学面板
   */
  private toggleScientificPanel(): void {
    const panel = this.container.querySelector('.scientific-panel') as HTMLElement
    const isCollapsed = panel.classList.contains('collapsed')

    if (isCollapsed) {
      this.showScientificPanel()
    } else {
      this.hideScientificPanel()
    }
  }

  /**
   * 显示科学面板
   */
  private showScientificPanel(): void {
    const panel = this.container.querySelector('.scientific-panel') as HTMLElement
    const toggle = this.container.querySelector('#scientific-toggle') as HTMLElement

    panel.classList.remove('collapsed')
    toggle.style.transform = 'rotate(180deg)'
  }

  /**
   * 隐藏科学面板
   */
  private hideScientificPanel(): void {
    const panel = this.container.querySelector('.scientific-panel') as HTMLElement
    const toggle = this.container.querySelector('#scientific-toggle') as HTMLElement

    panel.classList.add('collapsed')
    toggle.style.transform = 'rotate(0deg)'
  }

  /**
   * 更新科学计算模式
   */
  public updateScientificMode(show: boolean): void {
    this.options.showScientific = show

    const scientificPanel = this.container.querySelector('.scientific-panel') as HTMLElement
    if (scientificPanel) {
      scientificPanel.style.display = show ? 'block' : 'none'
    }
  }

  /**
   * 更新角度模式
   */
  public updateAngleMode(mode: 'deg' | 'rad' | 'grad'): void {
    this.options.angleMode = mode

    const modeButton = this.container.querySelector('[data-action="angleMode"]') as HTMLElement
    if (modeButton) {
      modeButton.querySelector('.btn-label')!.textContent = mode.toUpperCase()
      modeButton.title = `角度模式: ${mode}`
    }
  }

  /**
   * 高亮按钮（用于键盘输入反馈）
   */
  public highlightButton(value: string): void {
    const button = this.container.querySelector(
      `[data-value="${value}"], [data-action="${value}"]`
    ) as HTMLButtonElement
    if (button) {
      this.animateButton(button)
    }
  }

  /**
   * 设置主题
   */
  public setTheme(theme: 'light' | 'dark' | 'auto'): void {
    this.container.setAttribute('data-theme', theme)
  }

  /**
   * 获取键盘配置
   */
  public getConfig(): KeyboardOptions {
    return { ...this.options }
  }

  /**
   * 销毁组件
   */
  public destroy(): void {
    this.container.innerHTML = ''
  }
}
