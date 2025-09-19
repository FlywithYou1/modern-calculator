import type { CalculatorState, AppSettings, HistoryItem, Operation } from '../types/calculator.js'
import { Display } from './Display.js'
import { Keyboard } from './Keyboard.js'
import { History } from './History.js'
import { Settings } from './Settings.js'
import { ThemeManager } from '../utils/theme.js'
import { DeviceDetector } from '../utils/device.js'
import { invoke } from '../utils/tauri.js'
import { trackState, trackPerformance, trackError } from '../utils/mcp-debugger.js'

/**
 * 主计算器组件
 * 协调所有子组件并管理整体状态
 */
export class Calculator {
  protected container: HTMLElement
  protected state: CalculatorState
  protected themeManager: ThemeManager
  private display!: Display
  private keyboard!: Keyboard
  private history!: History
  private settings!: Settings

  constructor(container: HTMLElement) {
    this.container = container
    this.themeManager = new ThemeManager()
    this.state = this.getInitialState()
  }

  private getInitialState(): CalculatorState {
    return {
      expression: '',
      result: '0',
      memory: '0',
      lastOperation: null,
      isCalculating: false,
      errorMessage: null,
      settings: {
        theme: 'dark',
        precision: 12,
        angleUnit: 'degrees',
        enableAnimations: true,
        enableHaptics: true,
        compactMode: false,
        showHistory: true,
        showMemory: true,
        enableKeyboardShortcuts: true,
      },
      history: [],
    }
  }

  /**
   * 从多个数据源加载应用状态
   * 优先级: Tauri后端 > localStorage > 默认值
   */
  private async loadState(): Promise<void> {
    const startTime = performance.now()
    
    try {
      // 1. 尝试从 Tauri 后端加载
      const backendData = await this.loadFromBackend()
      if (backendData.success) {
        console.log('✅ 后端状态加载成功')
        trackPerformance({
          operation: 'load-backend-state',
          duration: performance.now() - startTime
        })
        return
      }

      // 2. 回退到本地存储
      const localData = this.loadFromLocalStorage()
      if (localData.success) {
        console.log('✅ 本地状态加载成功')
      } else {
        console.log('ℹ️ 使用默认状态')
      }

      trackPerformance({
        operation: 'load-state-complete',
        duration: performance.now() - startTime
      })
    } catch (error) {
      console.error('❌ 状态加载失败:', error)
      trackError({
        type: 'state-load-error',
        message: error instanceof Error ? error.message : '未知错误',
        context: { startTime, currentTime: performance.now() }
      })
    }
  }

  /**
   * 从Tauri后端加载状态
   */
  private async loadFromBackend(): Promise<{ success: boolean }> {
    if (!invoke) {
      return { success: false }
    }

    try {
      // 并行加载设置和历史记录
      const [settingsResult, historyResult] = await Promise.allSettled([
        invoke<AppSettings>('get_settings'),
        invoke<HistoryItem[]>('get_history', { limit: 100 })
      ])

      // 处理设置加载结果
      if (settingsResult.status === 'fulfilled' && settingsResult.value) {
        this.mapBackendSettings(settingsResult.value)
      }

      // 处理历史记录加载结果
      if (historyResult.status === 'fulfilled' && Array.isArray(historyResult.value)) {
        this.state.history = historyResult.value
      }

      return { success: true }
    } catch (error) {
      console.warn('⚠️ 后端数据加载失败:', error)
      return { success: false }
    }
  }

  /**
   * 映射后端设置到前端格式
   */
  private mapBackendSettings(backendSettings: AppSettings): void {
    const mapped = { ...this.state.settings }

    // 使用类型安全的设置映射
    if (backendSettings.theme?.mode) {
      mapped.theme = backendSettings.theme.mode
    }
    
    if (typeof backendSettings.display?.decimalPlaces === 'number') {
      mapped.precision = Math.max(1, Math.min(20, backendSettings.display.decimalPlaces))
    }
    
    if (backendSettings.display?.angleUnit) {
      mapped.angleUnit = ['degrees', 'radians'].includes(backendSettings.display.angleUnit) 
        ? backendSettings.display.angleUnit as 'degrees' | 'radians'
        : 'degrees'
    }

    // 布尔值设置
    const booleanMappings = [
      ['general.enableAnimations', 'enableAnimations'],
      ['general.enableHapticFeedback', 'enableHaptics'],
      ['general.enableKeyboardShortcuts', 'enableKeyboardShortcuts'],
      ['layout.compactMode', 'compactMode'],
      ['layout.showHistory', 'showHistory'],
    ] as const

    booleanMappings.forEach(([backendPath, frontendKey]) => {
      const value = this.getNestedValue(backendSettings, backendPath)
      if (typeof value === 'boolean') {
        ;(mapped as Record<string, unknown>)[frontendKey] = value
      }
    })

    this.state.settings = mapped
  }

  /**
   * 从本地存储加载状态
   */
  private loadFromLocalStorage(): { success: boolean } {
    try {
      const savedState = localStorage.getItem('calculator-state')
      if (!savedState) {
        return { success: false }
      }

      const parsedState = JSON.parse(savedState)
      
      // 验证状态结构
      if (this.validateStateStructure(parsedState)) {
        this.state = { ...this.state, ...parsedState }
        return { success: true }
      } else {
        console.warn('⚠️ 本地状态结构无效，已忽略')
        return { success: false }
      }
    } catch (error) {
      console.warn('⚠️ 本地状态解析失败:', error)
      return { success: false }
    }
  }

  /**
   * 验证状态结构有效性
   */
  private validateStateStructure(state: unknown): boolean {
    return (
      typeof state === 'object' &&
      state !== null &&
      (!(state as Record<string, unknown>).settings || typeof (state as Record<string, unknown>).settings === 'object') &&
      (!(state as Record<string, unknown>).history || Array.isArray((state as Record<string, unknown>).history))
    )
  }

  /**
   * 获取嵌套对象属性值
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: Record<string, unknown> | undefined, key) => current?.[key] as Record<string, unknown>, obj)
  }

  /**
   * 初始化计算器组件
   */
  async init(): Promise<void> {
    try {
      await this.loadState()
      this.createLayout()
      await this.initializeComponents()
      this.setupEventListeners()
      await this.themeManager.setThemeMode(this.state.settings.theme)
      this.adaptToDevice()
      console.log('✅ 计算器初始化完成')
    } catch (error) {
      console.error('❌ 计算器初始化失败:', error)
    }
  }

  protected createLayout(): void {
    this.container.innerHTML = `
      <div class="calculator-app" data-theme="${this.state.settings.theme}">
        <!-- 标题栏 -->
        <header class="calculator-header">
          <div class="header-title">
            <span class="title-icon">🧮</span>
            <span class="title-text">科学计算器</span>
          </div>
          <div class="header-controls">
            <button class="header-btn" id="history-btn" title="历史记录" aria-label="打开历史记录">
              📚
            </button>
            <button class="header-btn" id="settings-btn" title="设置" aria-label="打开设置">
              ⚙️
            </button>
            <button class="header-btn" id="theme-btn" title="切换主题" aria-label="切换深色/浅色主题">
              🌓
            </button>
          </div>
        </header>

        <!-- 主体区域 -->
        <main class="calculator-main">
          <!-- 显示屏区域 -->
          <section class="display-section">
            <div class="display-container" id="display-container"></div>
            
            <!-- 状态栏 -->
            <div class="status-bar">
              <div class="status-indicators">
                <span class="memory-indicator" id="memory-indicator" style="display: none;" title="内存中有数据">M</span>
                <span class="angle-indicator" id="angle-indicator" title="角度单位">DEG</span>
              </div>
              <div class="status-message" id="status-message">准备就绪</div>
            </div>
          </section>

          <!-- 控制面板 -->
          <section class="control-panel">
            <div class="memory-controls">
              <button class="memory-btn" id="memory-clear" title="清除内存">MC</button>
              <button class="memory-btn" id="memory-recall" title="调用内存">MR</button>
              <button class="memory-btn" id="memory-store" title="存储到内存">MS</button>
              <button class="memory-btn" id="memory-add" title="内存加">M+</button>
            </div>
          </section>

          <!-- 键盘区域 -->
          <section class="keyboard-section">
            <div class="keyboard-container" id="keyboard-container"></div>
          </section>
        </main>

        <!-- 侧边栏 -->
        <aside class="calculator-sidebar" id="sidebar">
          <div class="sidebar-header">
            <button class="sidebar-close" id="sidebar-close" aria-label="关闭侧边栏">×</button>
          </div>
          
          <div class="sidebar-content">
            <!-- 历史记录面板 -->
            <div class="sidebar-panel history-panel" id="history-panel" style="display: none;">
              <h3>计算历史</h3>
              <div class="history-container" id="history-container"></div>
            </div>
            
            <!-- 设置面板 -->
            <div class="sidebar-panel settings-panel" id="settings-panel" style="display: none;">
              <h3>设置</h3>
              <div class="settings-container" id="settings-container"></div>
            </div>
          </div>
        </aside>

        <!-- 加载指示器 -->
        <div class="loading-overlay" id="loading-overlay" style="display: none;">
          <div class="loading-spinner"></div>
          <div class="loading-text">计算中...</div>
        </div>
      </div>
    `
  }

  protected async initializeComponents(): Promise<void> {
    const displayContainer = this.container.querySelector('#display-container') as HTMLElement
    const keyboardContainer = this.container.querySelector('#keyboard-container') as HTMLElement
    const historyContainer = this.container.querySelector('#history-container') as HTMLElement
    const settingsContainer = this.container.querySelector('#settings-container') as HTMLElement

    // 初始化显示器
    this.display = new Display(displayContainer, {
      precision: this.state.settings.precision,
      theme: await this.themeManager.getCurrentTheme(),
    })
    await this.display.init()

    // 初始化键盘
    this.keyboard = new Keyboard(keyboardContainer, {
      theme: await this.themeManager.getCurrentTheme(),
      enableHaptic: this.state.settings.enableHaptics,
      onInput: this.handleInput.bind(this),
    })
    await this.keyboard.init()

    // 初始化历史记录
    this.history = new History(historyContainer, {
      maxItems: 100,
      onHistoryItemSelect: this.handleHistorySelect.bind(this),
      onHistoryClear: this.handleHistoryClear.bind(this),
    })
    await this.history.init()

    // 初始化设置
    this.settings = new Settings(settingsContainer)
    await this.settings.init()
    this.settings.onSettingsChanged(this.handleSettingsChange.bind(this))

    // 设置初始显示状态
    this.updateDisplay()
    this.updateStatusBar()
  }

  private setupEventListeners(): void {
    // 标题栏按钮
    this.container
      .querySelector('#history-btn')
      ?.addEventListener('click', () => this.toggleSidebar('history'))
    this.container
      .querySelector('#settings-btn')
      ?.addEventListener('click', () => this.toggleSidebar('settings'))
    this.container.querySelector('#theme-btn')?.addEventListener('click', () => this.toggleTheme())

    // 侧边栏控制
    this.container
      .querySelector('#sidebar-close')
      ?.addEventListener('click', () => this.closeSidebar())

    // 内存控制按钮
    this.container
      .querySelector('#memory-clear')
      ?.addEventListener('click', () => this.memoryOperation('clear'))
    this.container
      .querySelector('#memory-recall')
      ?.addEventListener('click', () => this.memoryOperation('recall'))
    this.container
      .querySelector('#memory-store')
      ?.addEventListener('click', () => this.memoryOperation('store'))
    this.container
      .querySelector('#memory-add')
      ?.addEventListener('click', () => this.memoryOperation('add'))

    // 键盘快捷键
    if (this.state.settings.enableKeyboardShortcuts) {
      document.addEventListener('keydown', this.handleKeyboard.bind(this))
    }

    // 窗口事件
    window.addEventListener('resize', this.handleResize.bind(this))
    window.addEventListener('orientationchange', this.handleOrientationChange.bind(this))

    // 侧边栏外部点击关闭
    document.addEventListener('click', e => {
      const sidebar = this.container.querySelector('#sidebar')
      const target = e.target as Element
      if (
        sidebar?.classList.contains('open') &&
        !sidebar.contains(target) &&
        !target.closest('.header-btn')
      ) {
        this.closeSidebar()
      }
    })
  }

  private handleInput(value: string, type: Operation): void {
    try {
      this.setStatus('输入中...')

      switch (type) {
        case 'number':
          this.appendNumber(value)
          break
        case 'operator':
          this.appendOperator(value)
          break
        case 'function':
          this.applyFunction(value)
          break
        case 'constant':
          this.appendConstant(value)
          break
        case 'action':
          this.handleAction(value)
          break
        case 'bracket':
          this.appendBracket(value)
          break
      }

      this.updateDisplay()
      this.updateStatusBar()
    } catch (error) {
      this.showError(error instanceof Error ? error.message : '输入错误')
    }
  }

  private handleAction(action: string): void {
    switch (action) {
      case 'clear':
        this.clear()
        this.setStatus('已清空')
        break
      case 'backspace':
        this.backspace()
        this.setStatus('已删除')
        break
      case 'equals':
        this.calculate()
        break
      case 'negate':
        this.negate()
        this.setStatus('已取反')
        break
    }
  }

  private appendNumber(digit: string): void {
    if (this.state.errorMessage) {
      this.clear()
    }

    if (this.state.expression === '0' && digit !== '.') {
      this.state.expression = digit
    } else {
      this.state.expression += digit
    }
  }

  private appendOperator(operator: string): void {
    if (this.state.errorMessage) {
      this.clear()
    }

    if (!this.state.expression && this.state.result !== '0') {
      this.state.expression = this.state.result
    }

    this.state.expression += ` ${operator} `
    this.state.lastOperation = operator
  }

  private applyFunction(func: string): void {
    if (this.state.errorMessage) {
      this.clear()
    }

    this.state.expression += `${func}(`
  }

  private appendConstant(constant: string): void {
    if (this.state.errorMessage) {
      this.clear()
    }

    const constantValues: { [key: string]: string } = {
      pi: 'π',
      e: 'e',
    }

    this.state.expression += constantValues[constant] || constant
  }

  private appendBracket(bracket: string): void {
    if (this.state.errorMessage) {
      this.clear()
    }

    this.state.expression += bracket
  }

  private async calculate(): Promise<void> {
    if (!this.state.expression || this.state.errorMessage) {
      return
    }

    const startTime = performance.now()

    try {
      this.state.isCalculating = true
      this.setStatus('计算中...')
      this.showLoading()
      this.updateDisplay()

      // MCP调试：记录计算开始
      trackState({
        expression: this.state.expression,
        result: '计算中...',
        memory: this.state.memory,
      })

      // 模拟计算延迟
      await new Promise(resolve => setTimeout(resolve, 100))

      const result = await this.evaluateExpression(this.state.expression)
      const duration = performance.now() - startTime

      this.state.result = result
      this.state.errorMessage = null
      await this.addToHistory(this.state.expression, result)
      this.state.expression = ''
      this.setStatus('计算完成')

      // MCP调试：记录计算成功
      trackState({
        expression: this.state.expression,
        result: this.state.result,
        memory: this.state.memory,
      })

      trackPerformance({
        operation: 'calculate',
        duration,
      })
    } catch (error) {
      const duration = performance.now() - startTime
      const errorMessage = error instanceof Error ? error.message : '计算错误'

      this.state.errorMessage = errorMessage
      this.state.result = '0'
      this.setStatus('计算错误')

      // MCP调试：记录计算错误
      trackError({
        type: 'CalculationError',
        message: errorMessage,
        context: {
          expression: this.state.expression,
          duration,
        },
      })

      trackState({
        expression: this.state.expression,
        result: this.state.result,
        memory: this.state.memory,
        error: errorMessage,
      })
    } finally {
      this.state.isCalculating = false
      this.hideLoading()
      this.updateDisplay()
    }
  }

  private async evaluateExpression(expression: string): Promise<string> {
    try {
      // 使用 Tauri 后端的高精度计算
      const result = await invoke<{ success: boolean; result?: string; error?: string }>(
        'calculate',
        { expression }
      )

      if (result.success && result.result) {
        return result.result
      } else {
        throw new Error(result.error || '计算失败')
      }
    } catch (error) {
      // 如果 Tauri 调用失败，回退到 JavaScript 计算（开发模式）
      console.warn('Tauri 调用失败，使用回退计算:', error)
      const { evaluateExpressionSafe } = await import('../utils/evaluator')
      const angleUnit = this.state.settings.angleUnit
      return evaluateExpressionSafe(expression, {
        angleUnit,
        precision: this.state.settings.precision,
      })
    }
  }

  private clear(): void {
    this.state.expression = ''
    this.state.result = '0'
    this.state.errorMessage = null
    this.state.lastOperation = null
  }

  private backspace(): void {
    if (this.state.errorMessage) {
      this.clear()
      return
    }

    this.state.expression = this.state.expression.slice(0, -1)
    if (!this.state.expression) {
      this.state.result = '0'
    }
  }

  private negate(): void {
    if (this.state.result !== '0') {
      const num = parseFloat(this.state.result)
      this.state.result = (-num).toString()
    }
  }

  private memoryOperation(operation: string): void {
    switch (operation) {
      case 'clear':
        this.state.memory = '0'
        this.setStatus('内存已清空')
        break
      case 'recall':
        this.state.expression += this.state.memory
        this.setStatus('已调用内存值')
        break
      case 'store':
        this.state.memory = this.state.result
        this.setStatus('已存储到内存')
        break
      case 'add':
        {
          // 避免在 case 中使用词法声明引起的 lint 告警
          let currentNum = parseFloat(this.state.memory)
          if (Number.isNaN(currentNum)) currentNum = 0
          let addNum = parseFloat(this.state.result)
          if (Number.isNaN(addNum)) addNum = 0
          this.state.memory = (currentNum + addNum).toString()
          this.setStatus('已添加到内存')
        }
        break
    }
    this.updateStatusBar()
    this.updateDisplay()
  }

  private async addToHistory(expression: string, result: string): Promise<void> {
    const historyItem: HistoryItem = {
      id: Date.now().toString(),
      expression,
      result,
      timestamp: new Date().toISOString(),
      tags: [],
      notes: '',
    }

    // 后端计算时已经自动保存到历史，这里只更新前端状态
    this.state.history.unshift(historyItem)
    if (this.state.history.length > 100) {
      this.state.history = this.state.history.slice(0, 100)
    }

    this.history.setHistory(this.state.history)

    // 定期从后端同步历史记录
    if (this.state.history.length % 10 === 0) {
      try {
        const backendHistory = await invoke<HistoryItem[]>('get_history', { limit: 100 })
        if (Array.isArray(backendHistory)) {
          this.state.history = backendHistory
          this.history.setHistory(this.state.history)
        }
      } catch (error) {
        console.warn('同步历史记录失败:', error)
      }
    }
  }

  private updateDisplay(): void {
    this.display.update({
      expression: this.state.expression,
      result: this.state.result,
      isCalculating: this.state.isCalculating,
      error: this.state.errorMessage,
    })
  }

  private updateStatusBar(): void {
    const memoryIndicator = this.container.querySelector('#memory-indicator') as HTMLElement
    const angleIndicator = this.container.querySelector('#angle-indicator') as HTMLElement

    // 更新内存指示器
    if (this.state.memory !== '0') {
      memoryIndicator.style.display = 'inline'
    } else {
      memoryIndicator.style.display = 'none'
    }

    // 更新角度单位指示器
    angleIndicator.textContent = this.state.settings.angleUnit === 'degrees' ? 'DEG' : 'RAD'
  }

  protected setStatus(message: string): void {
    const statusElement = this.container.querySelector('#status-message') as HTMLElement
    if (statusElement) {
      statusElement.textContent = message
      // 自动清除状态消息
      setTimeout(() => {
        if (statusElement.textContent === message) {
          statusElement.textContent = '准备就绪'
        }
      }, 2000)
    }
  }

  protected showError(message: string): void {
    this.state.errorMessage = message
    this.setStatus(`错误: ${message}`)
    this.updateDisplay()
  }

  protected showLoading(): void {
    const loadingOverlay = this.container.querySelector('#loading-overlay') as HTMLElement
    if (loadingOverlay) {
      loadingOverlay.style.display = 'flex'
    }
  }

  protected hideLoading(): void {
    const loadingOverlay = this.container.querySelector('#loading-overlay') as HTMLElement
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none'
    }
  }

  private toggleSidebar(panel: 'history' | 'settings'): void {
    const sidebar = this.container.querySelector('#sidebar') as HTMLElement
    const historyPanel = this.container.querySelector('#history-panel') as HTMLElement
    const settingsPanel = this.container.querySelector('#settings-panel') as HTMLElement

    // 隐藏所有面板
    historyPanel.style.display = 'none'
    settingsPanel.style.display = 'none'

    // 显示选中的面板
    if (panel === 'history') {
      historyPanel.style.display = 'block'
      this.history.show()
    } else {
      settingsPanel.style.display = 'block'
      this.settings.show()
    }

    sidebar.classList.add('open')
  }

  private closeSidebar(): void {
    const sidebar = this.container.querySelector('#sidebar') as HTMLElement
    sidebar.classList.remove('open')
    this.history.hide()
    this.settings.hide()
  }

  private async toggleTheme(): Promise<void> {
    const themes: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto']
    const currentIndex = themes.indexOf(this.state.settings.theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]

    if (nextTheme) {
      this.state.settings.theme = nextTheme
      await this.themeManager.setThemeMode(nextTheme)
      this.container.setAttribute('data-theme', nextTheme)
      this.setStatus(`已切换到${nextTheme}主题`)
    }
  }

  private handleHistorySelect(item: HistoryItem): void {
    this.state.expression = item.expression
    this.state.result = item.result
    this.updateDisplay()
    this.closeSidebar()
    this.setStatus('已选择历史记录')
  }

  private handleHistoryClear(): void {
    this.state.history = []
    this.history.setHistory([])
    this.setStatus('历史记录已清空')
  }

  private handleSettingsChange(settings: AppSettings): void {
    this.state.settings = {
      theme: settings.theme.mode,
      precision: settings.display.decimalPlaces,
      angleUnit: settings.display.angleUnit,
      enableAnimations: settings.general.enableAnimations,
      enableHaptics: settings.general.enableHaptic,
      compactMode: settings.layout.compactMode,
      showHistory: settings.layout.showHistory,
      showMemory: true,
      enableKeyboardShortcuts: settings.general.enableKeyboardShortcuts,
    }

    this.applySettings()
    this.setStatus('设置已更新')
  }

  private async applySettings(): Promise<void> {
    await this.themeManager.setThemeMode(this.state.settings.theme)
    const currentTheme = await this.themeManager.getCurrentTheme()

    this.display.updateTheme(currentTheme)
    this.keyboard.updateTheme(currentTheme)
    this.history.updateTheme(currentTheme)
    this.settings.updateTheme(currentTheme)

    this.adaptToDevice()
    this.updateStatusBar()
  }

  private adaptToDevice(): void {
    const deviceDetector = new DeviceDetector()
    const deviceType = deviceDetector.getDeviceType()
    const isLandscape = deviceDetector.getOrientation() === 'landscape'

    this.container.setAttribute('data-device', deviceType)
    this.container.setAttribute('data-orientation', isLandscape ? 'landscape' : 'portrait')

    if (deviceType === 'mobile') {
      this.keyboard.setLayout('standard')
    }
  }

  private handleKeyboard(event: KeyboardEvent): boolean {
    if (!this.state.settings.enableKeyboardShortcuts) {
      return false
    }

    const keyMap: { [key: string]: () => void } = {
      Escape: () => this.clear(),
      Backspace: () => this.backspace(),
      Enter: () => this.calculate(),
      '=': () => this.calculate(),
      '+': () => this.appendOperator('+'),
      '-': () => this.appendOperator('-'),
      '*': () => this.appendOperator('×'),
      '/': () => this.appendOperator('÷'),
      '(': () => this.appendBracket('('),
      ')': () => this.appendBracket(')'),
      '.': () => this.appendNumber('.'),
    }

    if (/^[0-9]$/.test(event.key)) {
      event.preventDefault()
      this.appendNumber(event.key)
      this.updateDisplay()
      return true
    }

    if (keyMap[event.key]) {
      event.preventDefault()
      const handler = keyMap[event.key]
      if (handler) {
        handler()
      }
      this.updateDisplay()
      return true
    }

    return false
  }

  private handleResize(): void {
    this.display.handleResize()
    this.keyboard.handleResize()
    this.history.handleResize()
    this.adaptToDevice()
  }

  private handleOrientationChange(): void {
    setTimeout(() => {
      const deviceDetector = new DeviceDetector()
      const isLandscape = deviceDetector.getOrientation() === 'landscape'
      this.container.setAttribute('data-orientation', isLandscape ? 'landscape' : 'portrait')
      this.keyboard.handleOrientationChange()
    }, 100)
  }

  destroy(): void {
    this.display?.destroy()
    this.keyboard?.destroy()
    this.history?.destroy()
    this.settings?.destroy()

    document.removeEventListener('keydown', this.handleKeyboard.bind(this))
    window.removeEventListener('resize', this.handleResize.bind(this))
    window.removeEventListener('orientationchange', this.handleOrientationChange.bind(this))
  }
}
