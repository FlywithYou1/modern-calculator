import type { KeyboardConfig, Operation, Theme } from '../types/calculator.js'

interface AdvancedButtonConfig {
  id: string
  label: string
  value: string
  type: Operation
  className?: string
  colspan?: number
  rowspan?: number
  tooltip?: string
  secondaryLabel?: string
}

type ButtonMatrix = AdvancedButtonConfig[][]

const ACTION_CLEAR = 'clear'
const ACTION_BACKSPACE = 'backspace'
const ACTION_EQUALS = 'equals'
const ACTION_TOGGLE_ANGLE = 'toggle-angle-mode'
const ACTION_MATRIX_PANEL = 'open-matrix-panel'
const ACTION_UNIT_PANEL = 'open-unit-panel'
const ACTION_COMPLEX_PANEL = 'open-complex-panel'
const ACTION_STATS_PANEL = 'open-stats-panel'
const ACTION_BASE_CONVERTER = 'open-base-converter'

/* *
 * 高级键盘组件，覆盖基础、科学、程序员和自定义快捷面板。 */
export class AdvancedKeyboard {
  private container: HTMLElement
  private config: KeyboardConfig
  private root: HTMLElement
  private scientificPanel: HTMLElement | null = null
  private pressedKeys = new Set<string>()
  private isScientificCollapsed: boolean

  constructor(container: HTMLElement, config: KeyboardConfig) {
    this.container = container
    this.config = { ...config }
    this.isScientificCollapsed = config.deviceType === 'mobile'
    this.root = this.createRoot()
    this.container.appendChild(this.root)
    this.render()
    this.bindEvents()
  }

  /* *
   * 创建根节点 */
  private createRoot(): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.className = 'calculator-keyboard-wrap'
    if (this.config.deviceType) {
      wrapper.dataset.device = this.config.deviceType
    }
    return wrapper
  }

  /* *
   * 渲染键盘内容 */
  private render(): void {
    const showScientific = this.config.showScientific ?? true
    const isMobile = this.config.deviceType === 'mobile'
    const themeMode = this.config.theme?.mode ?? 'dark'

    const basicSection = this.buildSection('basic', this.getBasicButtons())
    const scientificSection = showScientific
      ? this.buildScientificSection(isMobile)
      : null

    const mobileHint = isMobile
      ? `
          <div class="keyboard-mobile-hint" aria-hidden="true">
            <span>向左滑动可展开科学面板</span>
          </div>
        `
      : ''

    this.root.innerHTML = `
      <div class="calculator-keyboard" data-theme="${themeMode}">
        ${scientificSection ?? ''}
        ${basicSection}
        ${mobileHint}
      </div>
    `

    this.scientificPanel = this.root.querySelector('.keyboard-panel-scientific') as HTMLElement | null
    if (this.scientificPanel && this.isScientificCollapsed) {
      this.scientificPanel.classList.add('is-collapsed')
    }

    if (this.config.deviceType) {
      this.root.dataset.device = this.config.deviceType
    }
  }

  /* *
   * 构建基础区域 */
  private buildSection(kind: 'basic' | 'scientific', buttons: ButtonMatrix): string {
    return `
      <section class="keyboard-panel keyboard-panel-${kind}" role="group" aria-label="${
        kind === 'basic' ? '基础键盘' : '科学键盘'
      }">
        <div class="keyboard-grid">
          ${buttons.map(row => this.renderRow(row)).join('')}
        </div>
      </section>
    `
  }

  /* *
   * 构建科学区域（含折叠头） */
  private buildScientificSection(isMobile: boolean): string {
    return `
      <section class="keyboard-panel keyboard-panel-scientific" role="group" aria-label="科学与高级功能">
        <header class="keyboard-panel__header">
          <div class="keyboard-panel__title">科学/高级</div>
          <button class="keyboard-panel__toggle" type="button" aria-expanded="${!this.isScientificCollapsed}" aria-label="切换科学面板" data-action="toggle-scientific">
            <span class="keyboard-panel__icon"></span>
          </button>
        </header>
        <div class="keyboard-panel__content${isMobile ? ' is-scrollable' : ''}">
          <div class="keyboard-grid keyboard-grid-scientific">
            ${this.getScientificButtons().map(row => this.renderRow(row)).join('')}
          </div>
        </div>
      </section>
    `
  }

  /* *
   * 渲染一行按钮 */
  private renderRow(row: AdvancedButtonConfig[]): string {
    return `
      <div class="keyboard-row">
        ${row.map(btn => this.renderButton(btn)).join('')}
      </div>
    `
  }

  /* *
   * 渲染单个按钮 */
  private renderButton(config: AdvancedButtonConfig): string {
    const { id, label, value, className = '', colspan = 1, rowspan = 1, tooltip, secondaryLabel } = config
    const ariaLabel = tooltip || label
    const dataAttrs = [`data-value="${value}"`, `data-type="${config.type}"`, `data-id="${id}"`]
    const styleParts = []
    if (colspan > 1) styleParts.push(`grid-column: span ${colspan}`)
    if (rowspan > 1) styleParts.push(`grid-row: span ${rowspan}`)

    return `
      <button
        class="keyboard-button ${className}"
        ${dataAttrs.join(' ')}
        ${styleParts.length ? `style="${styleParts.join('; ')}"` : ''}
        type="button"
        title="${ariaLabel}"
        aria-label="${ariaLabel}"
      >
        <span class="keyboard-button__label">${label}</span>
        ${secondaryLabel ? `<span class="keyboard-button__secondary" aria-hidden="true">${secondaryLabel}</span>` : ''}
      </button>
    `
  }

  /* *
   * 绑定交互事件 */
  private bindEvents(): void {
    this.root.addEventListener('click', event => {
      const target = event.target as HTMLElement
      const toggle = target.closest('[data-action="toggle-scientific"]') as HTMLElement | null
      if (toggle) {
        this.toggleScientificPanel()
        return
      }

      const button = target.closest('.keyboard-button') as HTMLButtonElement | null
      if (!button) return

      this.processButton(button)
    })

    if (this.config.deviceType === 'mobile') {
      this.bindSwipeGestures()
    }
  }

  /* *
   * 处理按钮点击 */
  private processButton(button: HTMLButtonElement): void {
    this.applyFeedback(button)

    const value = button.dataset.value ?? ''
    const type = (button.dataset.type as Operation | undefined) ?? 'action'

    if (type === 'number' || type === 'operator' || type === 'bracket' || type === 'constant') {
      this.config.onInput?.(value, type)
      return
    }

    if (type === 'function') {
      this.config.onInput?.(value, 'function')
      return
    }

    // 统一处理 action
    this.handleAction(value)
  }

  /* *
   * 动作分发 */
  private handleAction(action: string): void {
    const value = action

    switch (action) {
      case ACTION_CLEAR:
      case ACTION_BACKSPACE:
      case ACTION_EQUALS:
      case ACTION_TOGGLE_ANGLE:
      case ACTION_MATRIX_PANEL:
      case ACTION_UNIT_PANEL:
      case ACTION_COMPLEX_PANEL:
      case ACTION_STATS_PANEL:
      case ACTION_BASE_CONVERTER:
        this.config.onInput?.(value, 'action')
        break
      default:
        this.config.onInput?.(value, 'action')
    }
  }

  /* *
   * 触觉 + 动画反馈 */
  private applyFeedback(button: HTMLButtonElement): void {
    if (this.config.enableHaptic && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }

    button.classList.add('is-pressed')
    requestAnimationFrame(() => {
      setTimeout(() => button.classList.remove('is-pressed'), 160)
    })
  }

  /* *
   * 绑定滑动手势 */
  private bindSwipeGestures(): void {
    let startX = 0
    let startY = 0

    this.root.addEventListener(
      'touchstart',
      evt => {
        startX = evt.touches[0]?.clientX ?? 0
        startY = evt.touches[0]?.clientY ?? 0
      },
      { passive: true }
    )

    this.root.addEventListener(
      'touchend',
      evt => {
        const endX = evt.changedTouches[0]?.clientX ?? 0
        const endY = evt.changedTouches[0]?.clientY ?? 0

        const deltaX = endX - startX
        const deltaY = endY - startY

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
          if (deltaX < 0) {
            this.isScientificCollapsed = false
            this.updateScientificState()
          } else {
            this.isScientificCollapsed = true
            this.updateScientificState()
          }
        }
      },
      { passive: true }
    )
  }

  /* *
   * 切换科学面板 */
  private toggleScientificPanel(): void {
    this.isScientificCollapsed = !this.isScientificCollapsed
    this.updateScientificState()
  }

  private updateScientificState(): void {
    if (!this.scientificPanel) return
    this.scientificPanel.classList.toggle('is-collapsed', this.isScientificCollapsed)
    const toggle = this.scientificPanel.querySelector('[data-action="toggle-scientific"]') as HTMLElement | null
    if (toggle) {
      toggle.setAttribute('aria-expanded', (!this.isScientificCollapsed).toString())
    }
  }

  /* *
   * 获取基础按钮矩阵 */
  private getBasicButtons(): ButtonMatrix {
    return [
      [
        this.actionButton('clear', 'C', ACTION_CLEAR, 'btn-action'),
        this.actionButton('backspace', '⌫', ACTION_BACKSPACE, 'btn-action'),
        this.basicButton('lparen', '(', '(', 'bracket'),
        this.basicButton('rparen', ')', ')', 'bracket'),
      ],
      [
        this.basicButton('seven', '7', '7', 'number'),
        this.basicButton('eight', '8', '8', 'number'),
        this.basicButton('nine', '9', '9', 'number'),
        this.basicButton('divide', '÷', '/', 'operator'),
      ],
      [
        this.basicButton('four', '4', '4', 'number'),
        this.basicButton('five', '5', '5', 'number'),
        this.basicButton('six', '6', '6', 'number'),
        this.basicButton('multiply', '×', '*', 'operator'),
      ],
      [
        this.basicButton('one', '1', '1', 'number'),
        this.basicButton('two', '2', '2', 'number'),
        this.basicButton('three', '3', '3', 'number'),
        this.basicButton('minus', '−', '-', 'operator'),
      ],
      [
        this.basicButton('zero', '0', '0', 'number', { colspan: 2 }),
        this.basicButton('decimal', '.', '.', 'number'),
        this.basicButton('plus', '+', '+', 'operator'),
      ],
      [this.actionButton('equals', '=', ACTION_EQUALS, 'btn-equals', { colspan: 4 })],
    ]
  }

  /* *
   * 获取科学按钮矩阵 */
  private getScientificButtons(): ButtonMatrix {
    const angleLabel = this.getAngleLabel()
    return [
      [
        this.functionButton('sin', 'sin', 'sin'),
        this.functionButton('cos', 'cos', 'cos'),
        this.functionButton('tan', 'tan', 'tan'),
        this.actionButton('angle-mode', angleLabel, ACTION_TOGGLE_ANGLE, 'btn-mode', {
          tooltip: `切换角度模式（当前：${angleLabel}）`,
        }),
      ],
      [
        this.functionButton('asin', 'asin', 'asin'),
        this.functionButton('acos', 'acos', 'acos'),
        this.functionButton('atan', 'atan', 'atan'),
        this.constantButton('pi', 'π', 'pi'),
      ],
      [
        this.functionButton('ln', 'ln', 'ln'),
        this.functionButton('log', 'log', 'log'),
        this.constantButton('e', 'e', 'e'),
        this.basicButton('power', '^', '^', 'operator'),
      ],
      [
        this.functionButton('sqrt', '√', 'sqrt'),
        this.functionButton('square', 'x²', 'square', { tooltip: '平方' }),
        this.functionButton('factorial', 'x!', 'factorial'),
        this.basicButton('percent', '%', '%', 'operator'),
      ],
      [
        this.actionButton('base', '进制转换', ACTION_BASE_CONVERTER, 'btn-mode', { colspan: 2 }),
        this.functionButton('bin', 'BIN', 'bin'),
        this.functionButton('hex', 'HEX', 'hex'),
      ],
      [
        this.functionButton('mean', 'mean', 'mean'),
        this.functionButton('median', 'med', 'median'),
        this.functionButton('stdev', 'std', 'stdev'),
        this.functionButton('variance', 'var', 'variance'),
      ],
      [
        this.functionButton('min', 'min', 'min'),
        this.functionButton('max', 'max', 'max'),
        this.functionButton('sum', 'sum', 'sum'),
        this.functionButton('product', '∏', 'product'),
      ],
      [
        this.actionButton('matrix', '矩阵', ACTION_MATRIX_PANEL, 'btn-mode'),
        this.functionButton('transpose', 'T', 'transpose'),
        this.functionButton('determinant', 'det', 'determinant'),
        this.functionButton('inverse', 'inv', 'inverse'),
      ],
      [
        this.actionButton('units', '单位转换', ACTION_UNIT_PANEL, 'btn-mode'),
        this.actionButton('complex', '复数', ACTION_COMPLEX_PANEL, 'btn-mode'),
        this.actionButton('stats', '统计面板', ACTION_STATS_PANEL, 'btn-mode'),
        this.functionButton('percent-of', 'a%b', 'percentage'),
      ],
    ]
  }

  private basicButton(
    id: string,
    label: string,
    value: string,
    type: Operation,
    extra: Partial<AdvancedButtonConfig> = {}
  ): AdvancedButtonConfig {
    return {
      id,
      label,
      value,
      type,
      className: type === 'operator' ? 'btn-operator' : type === 'number' ? 'btn-number' : 'btn-symbol',
      ...extra,
    }
  }

  private constantButton(id: string, label: string, value: string): AdvancedButtonConfig {
    return {
      id,
      label,
      value,
      type: 'constant',
      className: 'btn-constant',
      tooltip: `插入常数 ${label}`,
    }
  }

  private functionButton(
    id: string,
    label: string,
    value: string,
    extra: Partial<AdvancedButtonConfig> = {}
  ): AdvancedButtonConfig {
    return {
      id,
      label,
      value,
      type: 'function',
      className: 'btn-function',
      tooltip: `${label} 函数`,
      ...extra,
    }
  }

  private actionButton(
    id: string,
    label: string,
    value: string,
    className: string,
    extra: Partial<AdvancedButtonConfig> = {}
  ): AdvancedButtonConfig {
    const config: AdvancedButtonConfig = {
      id,
      label,
      value,
      type: 'action',
      className,
    }

    if (extra.tooltip !== undefined) {
      config.tooltip = extra.tooltip
    }

    if (extra.colspan !== undefined) {
      config.colspan = extra.colspan
    }

    if (extra.rowspan !== undefined) {
      config.rowspan = extra.rowspan
    }

    return config
  }

  private getAngleLabel(): string {
    switch (this.config.angleMode) {
      case 'radians':
        return 'RAD'
      case 'gradians':
        return 'GRAD'
      default:
        return 'DEG'
    }
  }

  /* *
   * 主题更新 */
  updateTheme(theme: Theme): void {
    this.config.theme = theme
    this.root.querySelector('.calculator-keyboard')?.setAttribute('data-theme', theme.mode)
  }

  /* *
   * 更新角度按钮显示 */
  updateAngleMode(angleMode: 'degrees' | 'radians' | 'gradians'): void {
  this.config.angleMode = angleMode
    const label = this.getAngleLabel()
    const btn = this.root.querySelector('[data-id="angle-mode"] .keyboard-button__label') as HTMLElement | null
    if (btn) {
      btn.textContent = label
      const wrapper = btn.closest('.keyboard-button') as HTMLElement | null
      if (wrapper) {
        wrapper.setAttribute('title', `切换角度模式（当前：${label}）`)
        wrapper.setAttribute('aria-label', `切换角度模式（当前：${label}）`)
      }
    }
  }

  /* *
   * 高亮按钮（键盘输入反馈） */
  highlightButton(value: string): void {
    const button = this.root.querySelector(`.keyboard-button[data-value="${value}"]`) as HTMLButtonElement | null
    if (button) {
      this.applyFeedback(button)
    }
  }

  /* *
   * 响应布局变化 */
  handleResize(): void {
    // 根据容器宽度调整按钮大小
    const grid = this.root.querySelector('.keyboard-grid') as HTMLElement | null
    if (!grid) return
    const width = grid.clientWidth
    const size = width < 320 ? 'small' : width > 520 ? 'large' : 'medium'
    this.root.dataset.size = size
  }

  /* *
   * 更新配置 */
  updateConfig(partial: Partial<KeyboardConfig>): void {
    const prevDevice = this.config.deviceType
    Object.assign(this.config, partial)

    if (partial.theme) {
      this.updateTheme(partial.theme)
    }

    if (partial.angleMode) {
      this.updateAngleMode(partial.angleMode)
    }

    if (partial.showScientific !== undefined) {
      this.isScientificCollapsed = partial.showScientific
        ? this.config.deviceType === 'mobile'
        : true
      this.render()
    } else if (partial.deviceType && partial.deviceType !== prevDevice) {
      this.isScientificCollapsed = partial.deviceType === 'mobile'
      this.render()
    }
  }

  /* *
   * 销毁 */
  destroy(): void {
    this.pressedKeys.clear()
    this.root.remove()
  }
}
