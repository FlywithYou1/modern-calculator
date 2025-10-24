import type {
  CalculatorState,
  AppSettings,
  HistoryItem,
  Operation,
  KeyboardConfig,
  ThemeMode,
} from '@/types/calculator'
import type {
  SimpleVoiceInputController,
  VoiceInputStatus as SimpleVoiceInputStatus,
} from '@/mobile/voice-input-simple'
import { Display } from './Display.js'
import { AdvancedKeyboard } from './Keyboard.js'
import { History } from './History.js'
import { Settings } from './Settings.js'
import { AdvancedPanelManager, type AdvancedPanelResult } from './AdvancedPanels.js'
import { ThemeManager } from '@/utils/theme'
import { DeviceDetector } from '@/utils/device'
import { invoke, TauriService } from '@/utils/tauri'
import { trackState, trackPerformance, trackError } from '@/utils/mcp-debugger'

/**
 * 主计算器组件
 * 协调所有子组件并管理整体状态
 */
export class Calculator {
  protected container: HTMLElement
  protected state: CalculatorState
  protected themeManager: ThemeManager
  private display!: Display
  private keyboard!: AdvancedKeyboard
  private history!: History
  private settings!: Settings
  private advancedPanels!: AdvancedPanelManager
  private gestureHandler: import('@/mobile/gesture').CalculatorGestureHandler | null = null
  private voiceInput: SimpleVoiceInputController | null = null
  private voiceInputButton: HTMLButtonElement | null = null
  private voiceToggleHandler: (() => void | Promise<void>) | null = null
  private voicePreviewResetTimer: number | null = null
  private deviceDetector: DeviceDetector

  constructor(container: HTMLElement) {
    this.container = container
    this.themeManager = new ThemeManager()
    this.deviceDetector = new DeviceDetector()
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
          duration: performance.now() - startTime,
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
        duration: performance.now() - startTime,
      })
    } catch (error) {
      console.error('❌ 状态加载失败:', error)
      trackError({
        type: 'state-load-error',
        message: error instanceof Error ? error.message : '未知错误',
        context: { startTime, currentTime: performance.now() },
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

    const loadSettings = async () => {
      try {
        return await invoke<AppSettings>('get_settings')
      } catch (directError) {
        if (typeof TauriService?.getSettings === 'function') {
          try {
            return await TauriService.getSettings()
          } catch (serviceError) {
            console.warn('⚠️ TauriService.getSettings 调用失败:', serviceError)
          }
        }
        console.warn('⚠️ 获取设置失败，使用默认值:', directError)
        return null
      }
    }

    try {
      // 并行加载设置和历史记录
      const [settingsResult, historyResult] = await Promise.allSettled([
        loadSettings(),
        invoke<HistoryItem[]>('get_history', { limit: 100 }),
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
      mapped.precision = Math.max(1, Math.min(28, backendSettings.display.decimalPlaces))
    }

    if (backendSettings.display?.angleUnit) {
      mapped.angleUnit = ['degrees', 'radians', 'gradians'].includes(backendSettings.display.angleUnit)
        ? (backendSettings.display.angleUnit as 'degrees' | 'radians' | 'gradians')
        : 'degrees'
    }

    // 布尔值设置
    const booleanMappings = [
      ['general.enableAnimations', 'enableAnimations'],
      ['general.enableHaptic', 'enableHaptics'],
      ['general.enableHapticFeedback', 'enableHaptics'],
      ['general.enableKeyboardShortcuts', 'enableKeyboardShortcuts'],
      ['layout.compactMode', 'compactMode'],
      ['layout.showHistory', 'showHistory'],
      ['layout.showMemory', 'showMemory'],
    ] as const

    booleanMappings.forEach(([backendPath, frontendKey]) => {
      const value = this.getNestedValue(
        backendSettings as unknown as Record<string, unknown>,
        backendPath
      )
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
      (!(state as Record<string, unknown>).settings ||
        typeof (state as Record<string, unknown>).settings === 'object') &&
      (!(state as Record<string, unknown>).history ||
        Array.isArray((state as Record<string, unknown>).history))
    )
  }

  /**
   * 获取嵌套对象属性值
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path
      .split('.')
      .reduce(
        (current: Record<string, unknown> | undefined, key) =>
          current?.[key] as Record<string, unknown>,
        obj
      )
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
      this.themeManager.initReduceMotion() // 初始化减少动效模式
      this.adaptToDevice()
      
      // 移动端专属功能
      if (this.deviceDetector.isMobile() || this.deviceDetector.isTablet()) {
        await this.initMobileFeatures()
      }
      
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
            <div class="mobile-action-controls">
              <button
                type="button"
                class="voice-input-btn"
                id="voice-input-btn"
                title="语音输入"
                aria-label="语音输入"
              >
                🎙️
              </button>
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

        <!-- 高级功能面板容器 -->
        <div class="advanced-panel-root" id="advanced-panel-root"></div>
      </div>
    `
  }

  protected async initializeComponents(): Promise<void> {
    const displayContainer = this.container.querySelector('#display-container') as HTMLElement
    const keyboardContainer = this.container.querySelector('#keyboard-container') as HTMLElement
    const historyContainer = this.container.querySelector('#history-container') as HTMLElement
    const settingsContainer = this.container.querySelector('#settings-container') as HTMLElement
  const panelRoot = this.container.querySelector('#advanced-panel-root') as HTMLElement

    // 初始化显示器
    this.display = new Display(displayContainer, {
      precision: this.state.settings.precision,
      theme: await this.themeManager.getCurrentTheme(),
    })
    await this.display.init()

    // 初始化键盘
    const currentTheme = await this.themeManager.getCurrentTheme()
    const deviceDetector = new DeviceDetector()
    const keyboardConfig: KeyboardConfig = {
      theme: currentTheme,
      enableHaptic: this.state.settings.enableHaptics,
      buttonSize: this.state.settings.compactMode ? 'small' : 'medium',
      layout: this.state.settings.compactMode ? 'standard' : 'scientific',
      showScientific: !this.state.settings.compactMode,
      deviceType: deviceDetector.getDeviceType(),
      angleMode: this.state.settings.angleUnit,
      onInput: this.handleInput.bind(this),
    }

    this.keyboard = new AdvancedKeyboard(keyboardContainer, keyboardConfig)

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

    this.advancedPanels = new AdvancedPanelManager(panelRoot, {
      onResult: this.handleAdvancedPanelResult.bind(this),
      onError: message => this.setStatus(`错误: ${message}`),
    })

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

  private async handleAdvancedPanelResult(result: AdvancedPanelResult): Promise<void> {
    this.state.errorMessage = null

    if (result.history) {
      this.state.expression = ''
    } else if (result.expression) {
      this.state.expression = result.expression
    } else {
      this.state.expression = ''
    }

    if (result.result) {
      this.state.result = result.result
    }

    this.updateDisplay()
    this.updateStatusBar()
    this.setStatus(result.summary)

    if (result.history) {
      const metadataPanel =
        result.metadata && typeof (result.metadata as { panel?: unknown }).panel === 'string'
          ? String((result.metadata as { panel?: unknown }).panel)
          : undefined

      const tags = metadataPanel ? [metadataPanel, 'advanced'] : ['advanced']
      const historyOptions: {
        tags?: string[]
        metadata?: Record<string, unknown>
        persist?: boolean
        source?: string
      } = {
        persist: true,
        source: 'advanced-panel',
        tags,
      }

      if (result.metadata) {
        historyOptions.metadata = result.metadata as Record<string, unknown>
      }

      await this.addToHistory(result.history.expression, result.history.result, historyOptions)
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
      case 'toggle-angle-mode':
        this.toggleAngleMode()
        break
      case 'open-matrix-panel':
        this.advancedPanels.open('matrix')
        this.setStatus('已打开矩阵面板')
        break
      case 'open-unit-panel':
        this.advancedPanels.open('unit')
        this.setStatus('单位转换面板')
        break
      case 'open-complex-panel':
        this.advancedPanels.open('complex')
        this.setStatus('复数运算面板')
        break
      case 'open-stats-panel':
        this.advancedPanels.open('statistics')
        this.setStatus('统计分析面板')
        break
      case 'open-base-converter':
        this.advancedPanels.open('base')
        this.setStatus('进制转换面板')
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

  private toggleAngleMode(): void {
    const modes: Array<'degrees' | 'radians' | 'gradians'> = ['degrees', 'radians', 'gradians']
  const currentIndex = modes.indexOf(this.state.settings.angleUnit)
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % modes.length : 0
  const nextMode = modes[nextIndex] as 'degrees' | 'radians' | 'gradians'

    this.state.settings.angleUnit = nextMode
    this.keyboard.updateConfig({ angleMode: nextMode })
    this.updateStatusBar()
    this.setStatus(`角度单位已切换为${this.getAngleLabel(nextMode)}`)
  }

  private getAngleLabel(mode: 'degrees' | 'radians' | 'gradians'): string {
    switch (mode) {
      case 'radians':
        return '弧度'
      case 'gradians':
        return '梯度'
      default:
        return '角度'
    }
  }

  private mapErrorMessage(message: string): string {
    const normalized = message.toLowerCase()

    if (normalized.includes('division by zero') || normalized.includes('divide by zero')) {
      return '无法完成运算：分母不能为 0。'
    }

    if (normalized.includes('mismatched') || normalized.includes('括号')) {
      return '表达式中的括号似乎未成对，请检查后重试。'
    }

    if (normalized.includes('unknown function')) {
      return '检测到未知函数，请确认拼写或切换到支持的函数名称。'
    }

    if (normalized.includes('invalid number') || normalized.includes('无效数字')) {
      return '存在无法识别的数字，请检查输入格式。'
    }

    if (normalized.includes('function argument')) {
      return '函数参数数量不匹配，请确认函数需要的参数个数。'
    }

    return message
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
  const rawExpression = this.state.expression
  const expressionForEvaluation = rawExpression

    try {
      this.state.isCalculating = true
      this.setStatus('计算中...')
      this.showLoading()
      this.updateDisplay()

      // MCP调试：记录计算开始
      trackState({
        expression: rawExpression,
        result: '计算中...',
        memory: this.state.memory,
      })

      // 模拟计算延迟
      await new Promise(resolve => setTimeout(resolve, 100))

      const result = await this.evaluateExpression(expressionForEvaluation, rawExpression)
      const duration = performance.now() - startTime

      this.state.result = result
      this.state.errorMessage = null
      await this.addToHistory(rawExpression, result)
      this.state.expression = ''
      this.setStatus('计算完成')

      // MCP调试：记录计算成功
      trackState({
        expression: rawExpression,
        result: this.state.result,
        memory: this.state.memory,
      })

      trackPerformance({
        operation: 'calculate',
        duration,
      })
    } catch (error) {
      const duration = performance.now() - startTime
      const rawError = error instanceof Error ? error.message : '计算错误'
      const friendlyError = this.mapErrorMessage(rawError)

      this.state.result = '0'
      this.showError(friendlyError)

      // MCP调试：记录计算错误
      trackError({
        type: 'CalculationError',
        message: friendlyError,
        context: {
          expression: rawExpression,
          duration,
          rawError,
        },
      })

      trackState({
        expression: rawExpression,
        result: this.state.result,
        memory: this.state.memory,
        error: friendlyError,
      })
    } finally {
      this.state.isCalculating = false
      this.hideLoading()
      this.updateDisplay()
    }
  }

  private async evaluateExpression(expression: string, displayExpression: string): Promise<string> {
    if (typeof invoke !== 'function') {
      const { evaluateExpressionSafe } = await import('@/utils/evaluator')
      const angleUnit = this.state.settings.angleUnit
      return evaluateExpressionSafe(expression, {
        angleUnit,
        precision: this.state.settings.precision,
      })
    }

    // 使用 Tauri 后端的高精度计算
    const result = await invoke<{ success: boolean; result?: string; error?: string }>('calculate', {
      expression,
      displayExpression,
    })

    if (result.success && result.result) {
      return result.result
    }

    if (result.error) {
      throw new Error(result.error)
    }

    throw new Error('计算失败')
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

  private async addToHistory(
    expression: string,
    result: string,
    options: {
      tags?: string[]
      notes?: string
      metadata?: Record<string, unknown>
      persist?: boolean
      source?: string
    } = {}
  ): Promise<void> {
  const { tags, notes, metadata, persist = true, source } = options

    let historyItem: HistoryItem | null = null

    if (persist) {
      try {
        historyItem = await invoke<HistoryItem>('record_history_entry', {
          expression,
          result,
          tags,
          notes,
          metadata,
          source,
          persist,
        })
      } catch (error) {
        console.warn('持久化历史记录失败，退回本地缓存:', error)
      }
    }

    if (!historyItem) {
      const fallbackItem: HistoryItem = {
        id: Date.now().toString(),
        expression,
        result,
        timestamp: new Date().toISOString(),
      }

      if (tags && tags.length) {
        fallbackItem.tags = Array.from(new Set(tags))
      }

      if (typeof notes === 'string' && notes.trim()) {
        fallbackItem.notes = notes
      }

      if (metadata) {
        fallbackItem.metadata = metadata
      }

      if (source) {
        fallbackItem.source = source
      }

      historyItem = fallbackItem
    }

    this.pushHistoryItem(historyItem)

    if (!persist && this.state.history.length % 10 === 0) {
      try {
        const backendHistory = await invoke<HistoryItem[]>('get_history', { limit: 100 })
        if (Array.isArray(backendHistory) && backendHistory.length) {
          this.state.history = backendHistory
          this.history.setHistory(this.state.history)
        }
      } catch (error) {
        console.warn('同步历史记录失败:', error)
      }
    }
  }

  private pushHistoryItem(item: HistoryItem): void {
    this.state.history = this.state.history.filter(existing => existing.id !== item.id)
    this.state.history.unshift(item)
    if (this.state.history.length > 100) {
      this.state.history = this.state.history.slice(0, 100)
    }
    this.history.setHistory(this.state.history)
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
    switch (this.state.settings.angleUnit) {
      case 'radians':
        angleIndicator.textContent = 'RAD'
        break
      case 'gradians':
        angleIndicator.textContent = 'GRAD'
        break
      default:
        angleIndicator.textContent = 'DEG'
        break
    }
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
  const themes: ThemeMode[] = ['dark', 'light', 'auto']
    const currentThemeMode = this.state.settings.theme
    const currentIndex = themes.indexOf(currentThemeMode)
    const nextIndex = (currentIndex + 1 + themes.length) % themes.length
    const nextTheme: ThemeMode = themes[nextIndex] ?? 'light'

    this.state.settings.theme = nextTheme
    await this.themeManager.setThemeMode(nextTheme)
    const resolvedTheme = await this.themeManager.getCurrentTheme()
  const appliedTheme = nextTheme === 'auto' ? resolvedTheme.name : nextTheme
  this.container.setAttribute('data-theme', appliedTheme)
  this.setStatus(`已切换到${this.getThemeLabel(appliedTheme)}主题`)
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
      precision: Math.max(1, Math.min(28, settings.display.decimalPlaces)),
      angleUnit: settings.display.angleUnit,
      enableAnimations: settings.general.enableAnimations,
      enableHaptics: settings.general.enableHaptic ?? settings.general.enableHapticFeedback,
      compactMode: settings.layout.compactMode,
      showHistory: settings.layout.showHistory,
      showMemory: settings.layout.showMemory ?? true,
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
    this.keyboard.updateConfig({
      enableHaptic: this.state.settings.enableHaptics,
      buttonSize: this.state.settings.compactMode ? 'small' : 'medium',
      layout: this.state.settings.compactMode ? 'standard' : 'scientific',
      showScientific: !this.state.settings.compactMode,
      angleMode: this.state.settings.angleUnit,
    })
    this.history.updateTheme(currentTheme)
    this.settings.updateTheme(currentTheme)
    this.container.setAttribute('data-theme', currentTheme.name)

    this.adaptToDevice()
    this.updateStatusBar()
  }

  private getThemeLabel(mode: string): string {
    switch (mode) {
      case 'dark':
        return '深色'
      case 'light':
        return '浅色'
      case 'high-contrast':
        return '高对比度'
      default:
        return mode
    }
  }

  private adaptToDevice(): void {
    const deviceDetector = new DeviceDetector()
    const deviceType = deviceDetector.getDeviceType()
    const isLandscape = deviceDetector.getOrientation() === 'landscape'

    this.container.setAttribute('data-device', deviceType)
    this.container.setAttribute('data-orientation', isLandscape ? 'landscape' : 'portrait')

    this.keyboard.updateConfig({
      deviceType,
      buttonSize: this.state.settings.compactMode ? 'small' : 'medium',
      showScientific: !this.state.settings.compactMode,
    })
  }

  /**
   * 初始化移动端专属功能
   */
  private async initMobileFeatures(): Promise<void> {
    try {
      // 初始化手势操作
      const { CalculatorGestureHandler } = await import('@/mobile/gesture')
      this.gestureHandler = new CalculatorGestureHandler(this.container)
      
      // 监听手势事件
      this.container.addEventListener('calculatorGesture', ((event: CustomEvent) => {
        this.handleGestureAction(event.detail)
      }) as EventListener)
      
      console.log('✅ 手势操作已启用')
      await this.setupVoiceInput()
    } catch (error) {
      console.error('❌ 手势功能初始化失败:', error)
    }
  }

  /**
   * 处理手势动作
   */
  private handleGestureAction(detail: { action: string; direction?: string; suggestion: string }): void {
    const { action, suggestion } = detail

    switch (action) {
      case 'swipe':
        this.handleSwipeGesture(suggestion)
        break
      case 'doubleTap':
        if (suggestion === 'copyResult') {
          this.copyResultToClipboard()
        }
        break
      case 'longPress':
        this.handleLongPressGesture(suggestion)
        break
      case 'pinch':
        this.handlePinchGesture(suggestion)
        break
    }
  }

  /**
   * 处理滑动手势
   */
  private handleSwipeGesture(suggestion: string): void {
    switch (suggestion) {
      case 'deleteLastDigit':
        this.backspace()
        break
      case 'undoLastOperation':
        // TODO: 实现撤销功能
        console.log('撤销操作')
        break
      case 'showHistory':
        {
          // 打开历史记录面板（显示侧边栏）
          const historyBtn = document.getElementById('history-btn')
          if (historyBtn) {
            historyBtn.click()
          }
        }
        break
      case 'hideExtendedPanel':
        // TODO: 关闭扩展面板
        console.log('关闭扩展面板')
        break
    }
  }

  /**
   * 处理长按手势
   */
  private handleLongPressGesture(suggestion: string): void {
    switch (suggestion) {
      case 'editExpression':
        // TODO: 编辑表达式
        console.log('编辑表达式')
        break
      case 'showButtonMenu':
        // TODO: 显示按钮菜单
        console.log('显示按钮菜单')
        break
    }
  }

  /**
   * 处理缩放手势
   */
  private handlePinchGesture(suggestion: string): void {
    // TODO: 实现缩放功能
    console.log('缩放:', suggestion)
  }

  private async setupVoiceInput(): Promise<void> {
    const button = this.container.querySelector('#voice-input-btn') as HTMLButtonElement | null
    if (!button) {
      return
    }

    this.voiceInputButton = button

    try {
      const { createVoiceInputController } = await import('@/mobile/voice-input-factory')
      const preferNative = this.deviceDetector.isAndroid() && this.deviceDetector.isTauri()
      this.voiceInput = await createVoiceInputController(
        {
          locale: navigator.language,
          continuous: true,
          interimResults: true,
          autoRestart: true,
          onResult: (transcript: string, isFinal: boolean) => this.handleVoiceResult(transcript, isFinal),
          onError: (error: unknown) => {
            const message = error instanceof Error ? error.message : String(error)
            this.setStatus(`语音输入错误: ${message}`)
            this.updateVoiceButton('error')
          },
          onStatusChange: (status: SimpleVoiceInputStatus) => this.updateVoiceButton(status),
        },
        { preferNative }
      )

      if (!this.voiceInput.isSupported) {
        button.disabled = true
        button.setAttribute('aria-disabled', 'true')
        button.classList.add('is-disabled')
        button.title = '当前环境不支持语音输入'
        return
      }

      this.updateVoiceButton(this.voiceInput.status())

      this.voiceToggleHandler = () => {
        if (!this.voiceInput) {
          return
        }

        if (this.voiceInput.status() === 'listening') {
          this.voiceInput
            .stop()
            .catch((toggleError: unknown) => {
              const message = toggleError instanceof Error ? toggleError.message : '停止语音输入失败'
              this.setStatus(`语音输入错误: ${message}`)
              this.updateVoiceButton('error')
            })
        } else {
          this.voiceInput
            .start()
            .catch((toggleError: unknown) => {
              const message = toggleError instanceof Error ? toggleError.message : '启动语音输入失败'
              this.setStatus(`语音输入错误: ${message}`)
              this.updateVoiceButton('error')
            })
        }
      }

      button.addEventListener('click', this.voiceToggleHandler)
      this.setStatus('语音输入已就绪')
    } catch (error) {
      console.error('❌ 语音输入初始化失败:', error)
      button.disabled = true
      button.setAttribute('aria-disabled', 'true')
      button.classList.add('is-disabled')
    }
  }

  private updateVoiceButton(status: SimpleVoiceInputStatus): void {
    const button = this.voiceInputButton
    if (!button) {
      return
    }

    button.classList.remove('is-listening', 'has-error')
    button.dataset.voiceStatus = status

    switch (status) {
      case 'listening':
        button.classList.add('is-listening')
        button.setAttribute('aria-pressed', 'true')
        button.textContent = '⏹️'
        button.title = '停止语音输入'
        this.clearVoicePreview()
        this.setStatus('正在倾听，请开始讲话')
        break
      case 'error':
        button.classList.add('has-error')
        button.setAttribute('aria-pressed', 'false')
        button.textContent = '🎙️'
        button.title = '语音输入'
        break
      default:
        button.setAttribute('aria-pressed', 'false')
        button.textContent = '🎙️'
        button.title = '语音输入'
        break
    }
  }

  private handleVoiceResult(transcript: string, isFinal: boolean): void {
    const normalized = transcript.trim()
    if (!normalized) {
      return
    }

    if (!isFinal) {
      this.showVoicePreview(normalized)
      return
    }

    this.clearVoicePreview()
    const tokens = this.parseVoiceTranscript(normalized)
    this.applyVoiceTokens(tokens)
  }

  private showVoicePreview(transcript: string): void {
    const statusElement = this.container.querySelector('#status-message') as HTMLElement | null
    if (!statusElement) {
      return
    }

    const content = transcript.trim()
    statusElement.textContent = content ? `语音识别中：${content}` : '语音识别中...'

    if (this.voicePreviewResetTimer !== null) {
      window.clearTimeout(this.voicePreviewResetTimer)
    }

    this.voicePreviewResetTimer = window.setTimeout(() => {
      statusElement.textContent = '准备就绪'
      this.voicePreviewResetTimer = null
    }, 4000)
  }

  private clearVoicePreview(): void {
    if (this.voicePreviewResetTimer !== null) {
      window.clearTimeout(this.voicePreviewResetTimer)
      this.voicePreviewResetTimer = null
    }
  }

  private parseVoiceTranscript(transcript: string): string[] {
    let working = transcript.trim().toLowerCase()
    if (!working) {
      return []
    }

    working = working.replace(/[，。！？,.!?、；;：:]/g, ' ')

    const englishPhraseMap: Record<string, string> = {
      'divided by': '÷',
      'divide by': '÷',
      'multiplied by': '×',
      'multiply by': '×',
      times: '×',
      plus: '+',
      minus: '-',
      'equal to': '=',
      equals: '=',
      equal: '=',
      calculate: '=',
      result: '=',
      'clear all': 'clear',
      'clear entry': 'clear',
      clear: 'clear',
      delete: 'backspace',
      'delete last': 'backspace',
      backspace: 'backspace',
      undo: 'backspace',
      point: '.',
      dot: '.',
      'decimal point': '.',
      'open bracket': '(',
      'open parenthesis': '(',
      'close bracket': ')',
      'close parenthesis': ')',
      'left bracket': '(',
      'right bracket': ')',
      'stop listening': 'stop',
      stop: 'stop',
    }

    Object.entries(englishPhraseMap).forEach(([phrase, symbol]) => {
      const pattern = phrase.replace(/\s+/g, '\\s+')
      const regex = new RegExp(`\\b${pattern}\\b`, 'gi')
      working = working.replace(regex, ` ${symbol} `)
    })

    const chinesePhraseMap: Record<string, string> = {
      乘以: '×',
      乘号: '×',
      除以: '÷',
      除号: '÷',
      加上: '+',
      加: '+',
      减去: '-',
      减: '-',
      等于: '=',
      等號: '=',
      等号: '=',
      结果: '=',
      清除: 'clear',
      清空: 'clear',
      删除: 'backspace',
      退格: 'backspace',
      回退: 'backspace',
      左括号: '(',
      左括弧: '(',
      左圆括号: '(',
      右括号: ')',
      右括弧: ')',
      右圆括号: ')',
      小数点: '.',
      点: '.',
      停止: 'stop',
      结束: 'stop',
    }

    Object.entries(chinesePhraseMap).forEach(([phrase, symbol]) => {
      const regex = new RegExp(phrase, 'g')
      working = working.replace(regex, ` ${symbol} `)
    })

    working = working.replace(/([零一二两三四五六七八九壹贰叁肆伍陆柒捌玖〇十拾])/g, ' $1 ')

    const rawTokens = working.split(/\s+/).filter(Boolean)
    const tokens: string[] = []

    const englishNumberMap: Record<string, string> = {
      zero: '0',
      one: '1',
      two: '2',
      three: '3',
      four: '4',
      five: '5',
      six: '6',
      seven: '7',
      eight: '8',
      nine: '9',
      ten: '10',
    }

    const chineseDigitMap: Record<string, string> = {
      零: '0',
      一: '1',
      二: '2',
      两: '2',
      三: '3',
      四: '4',
      五: '5',
      六: '6',
      七: '7',
      八: '8',
      九: '9',
      〇: '0',
      壹: '1',
      贰: '2',
      叁: '3',
      肆: '4',
      伍: '5',
      陆: '6',
      柒: '7',
      捌: '8',
      玖: '9',
      十: '10',
      拾: '10',
    }

  const commandTokens = new Set(['+', '-', '×', '÷', '.', '(', ')', '=', 'clear', 'backspace', 'stop'])

    rawTokens.forEach(token => {
      const lower = token.toLowerCase()

      if (englishNumberMap[lower]) {
        tokens.push(englishNumberMap[lower])
        return
      }

      if (lower === 'pi') {
        tokens.push('π')
        return
      }

      if (lower === 'e') {
        tokens.push('e')
        return
      }

      if (commandTokens.has(lower)) {
        tokens.push(lower)
        return
      }

      if (/^\d+(?:\.\d+)?$/.test(lower)) {
        tokens.push(lower)
        return
      }

      if (chineseDigitMap[token]) {
        tokens.push(chineseDigitMap[token])
      }
    })

    return tokens
  }

  private applyVoiceTokens(tokens: string[]): void {
    if (!tokens.length) {
      this.setStatus('未识别到有效指令')
      return
    }

    let hasEffect = false
    let requestCalculation = false

    tokens.forEach(token => {
      switch (token) {
        case '+':
        case '-':
        case '×':
        case '÷':
          this.appendOperator(token)
          hasEffect = true
          break
        case '.':
          this.appendNumber('.')
          hasEffect = true
          break
        case '(':
        case ')':
          this.appendBracket(token)
          hasEffect = true
          break
        case 'clear':
          this.clear()
          hasEffect = true
          break
        case 'backspace':
          this.backspace()
          hasEffect = true
          break
        case 'stop':
          if (this.voiceInput && this.voiceInput.status() === 'listening') {
            this.voiceInput.stop().catch(() => undefined)
          }
          hasEffect = true
          break
        case '=':
          requestCalculation = true
          hasEffect = true
          break
        default:
          if (token === 'π') {
            this.appendConstant('pi')
            hasEffect = true
          } else if (token === 'e') {
            this.appendConstant('e')
            hasEffect = true
          } else if (/^\d+(?:\.\d+)?$/.test(token)) {
            this.appendNumber(token)
            hasEffect = true
          }
          break
      }
    })

    if (hasEffect && !requestCalculation) {
      this.updateDisplay()
      this.setStatus('语音输入已应用')
    }

    if (requestCalculation) {
      void this.calculate()
    }

    if (!hasEffect) {
      this.setStatus('未识别到有效指令')
    }
  }

  /**
   * 复制结果到剪贴板
   */
  private copyResultToClipboard(): void {
    const result = this.state.result
    navigator.clipboard.writeText(result).then(() => {
      this.showToast('✅ 已复制到剪贴板')
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }).catch(() => {
      this.showToast('❌ 复制失败')
    })
  }


  /**
   * 显示Toast提示
   */
  private showToast(message: string): void {
    const toast = document.createElement('div')
    toast.className = 'toast-message'
    toast.textContent = message
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--color-surface);
      color: var(--color-text);
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: var(--shadow-large);
      z-index: 9999;
      animation: slideDown 0.3s ease, fadeOut 0.3s ease 2.7s;
    `
    
    document.body.appendChild(toast)
    
    setTimeout(() => {
      toast.remove()
    }, 3000)
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
      this.keyboard.handleResize()
    }, 100)
  }

  destroy(): void {
    this.display?.destroy()
    this.keyboard?.destroy()
    this.history?.destroy()
    this.settings?.destroy()

    // 清理移动端功能
    if (this.gestureHandler) {
      this.gestureHandler.destroy()
      ;(this.gestureHandler as unknown as { destroyed?: boolean }).destroyed = true
    }

    document.removeEventListener('keydown', this.handleKeyboard.bind(this))
    window.removeEventListener('resize', this.handleResize.bind(this))
    window.removeEventListener('orientationchange', this.handleOrientationChange.bind(this))
  }
}
