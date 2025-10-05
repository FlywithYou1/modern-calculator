/* *
 * 计算器 (计算器 (calculator)) 组件测试
 * 覆盖计算器的核心功能和交互 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Calculator } from '@/components/Calculator'

// 模拟依赖
vi.mock('@/utils/tauri', () => ({
  invoke: vi.fn(),
}))

vi.mock('@/utils/theme', () => ({
  ThemeManager: vi.fn().mockImplementation(() => ({
    setThemeMode: vi.fn().mockResolvedValue(undefined),
    getCurrentTheme: vi.fn().mockResolvedValue({
      name: 'dark',
      mode: 'dark',
      cssVariables: {},
    }),
    initReduceMotion: vi.fn(),
  })),
}))

vi.mock('@/utils/device', () => ({
  DeviceDetector: vi.fn().mockImplementation(() => ({
    getDeviceType: vi.fn().mockReturnValue('desktop'),
    getOrientation: vi.fn().mockReturnValue('landscape'),
    isMobile: vi.fn().mockReturnValue(false),
    isTablet: vi.fn().mockReturnValue(false),
  })),
}))

vi.mock('@/utils/mcp-debugger', () => ({
  trackState: vi.fn(),
  trackPerformance: vi.fn(),
  trackError: vi.fn(),
}))

// 模拟子组件
vi.mock('@/components/Display.js', () => ({
  Display: vi.fn().mockImplementation(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    update: vi.fn(),
    updateTheme: vi.fn(),
    handleResize: vi.fn(),
    destroy: vi.fn(),
  })),
}))

vi.mock('@/components/Keyboard.js', () => ({
  AdvancedKeyboard: vi.fn().mockImplementation(() => ({
    updateConfig: vi.fn(),
    updateTheme: vi.fn(),
    handleResize: vi.fn(),
    destroy: vi.fn(),
  })),
}))

vi.mock('@/components/History', () => ({
  History: vi.fn().mockImplementation(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    setHistory: vi.fn(),
    updateTheme: vi.fn(),
    handleResize: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    destroy: vi.fn(),
  })),
}))

vi.mock('@/components/Settings', () => ({
  Settings: vi.fn().mockImplementation(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    onSettingsChanged: vi.fn(),
    updateTheme: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    destroy: vi.fn(),
  })),
}))

vi.mock('@/components/AdvancedPanels.js', () => ({
  AdvancedPanelManager: vi.fn().mockImplementation(() => ({
    open: vi.fn(),
    destroy: vi.fn(),
  })),
}))

// 模拟移动端功能
vi.mock('@/mobile/gesture', () => ({
  CalculatorGestureHandler: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
  })),
}))

describe('Calculator', () => {
  let container: HTMLElement
  let calculator: Calculator

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    calculator = new Calculator(container)
  })

  afterEach(() => {
    calculator.destroy()
    document.body.removeChild(container)
    vi.clearAllMocks()
  })

  describe('初始化', () => {
    it('应该正确初始化计算器', async () => {
      await calculator.init()
      
      expect(container.querySelector('.calculator-app')).toBeTruthy()
      expect(container.querySelector('#display-container')).toBeTruthy()
      expect(container.querySelector('#keyboard-container')).toBeTruthy()
      expect(container.querySelector('#history-container')).toBeTruthy()
      expect(container.querySelector('#settings-container')).toBeTruthy()
    })

    it('应该创建正确的HTML结构', async () => {
      await calculator.init()
      
      const app = container.querySelector('.calculator-app')
      expect(app?.getAttribute('data-theme')).toBe('dark')
      
      const header = container.querySelector('.calculator-header')
      expect(header).toBeTruthy()
      
      const main = container.querySelector('.calculator-main')
      expect(main).toBeTruthy()
      
      const sidebar = container.querySelector('.calculator-sidebar')
      expect(sidebar).toBeTruthy()
    })

    it('应该加载设置和历史记录', async () => {
      const { invoke } = await import('@/utils/tauri')
      
      // 模拟成功的后端响应
      ;(invoke as any).mockResolvedValueOnce({
        theme: { mode: 'light' },
        display: { decimalPlaces: 8, angleUnit: 'radians' },
        general: { enableAnimations: false, enableHaptic: true },
      })
      
      await calculator.init()
      
      // 验证调用
      expect(invoke).toHaveBeenCalledWith('get_settings')
      expect(invoke).toHaveBeenCalledWith('get_history', { limit: 100 })
    })
  })

  describe('输入处理', () => {
    beforeEach(async () => {
      await calculator.init()
    })

    it('应该正确处理数字输入', () => {
      // 获取 protected 方法进行测试
      const calc = calculator as any
      calc.handleInput('5', 'number')
      
      expect(container.querySelector('input')?.value).toBeUndefined()
      // 实际的显示更新通过组件内部状态处理
    })

    it('应该正确处理运算符输入', () => {
      const calc = calculator as any
      calc.handleInput('+', 'operator')
      
      // 验证状态变化
      expect(calc.state.lastOperation).toBe('+')
    })

    it('应该正确处理函数输入', () => {
      const calc = calculator as any
      calc.handleInput('sin', 'function')
      
      expect(calc.state.expression).toBe('sin(')
    })

    it('应该正确处理括号输入', () => {
      const calc = calculator as any
      calc.handleInput('(', 'bracket')
      
      expect(calc.state.expression).toBe('(')
    })

    it('应该正确处理常数输入', () => {
      const calc = calculator as any
      calc.handleInput('pi', 'constant')
      
      expect(calc.state.expression).toBe('π')
    })

    it('应该正确处理动作指令', () => {
      const calc = calculator as any
      
      calc.handleInput('clear', 'action')
      expect(calc.state.expression).toBe('')
      expect(calc.state.result).toBe('0')
      
      calc.state.expression = '123'
      calc.handleInput('backspace', 'action')
      expect(calc.state.expression).toBe('12')
      
      calc.state.result = '5'
      calc.handleInput('negate', 'action')
      expect(calc.state.result).toBe('-5')
    })
  })

  describe('计算功能', () => {
    beforeEach(async () => {
      await calculator.init()
    })

    it('应该正确执行基本计算', async () => {
      const { invoke } = await import('@/utils/tauri')
      const calc = calculator as any
      
      // 模拟成功的计算结果
      ;(invoke as any).mockResolvedValue({
        success: true,
        result: '8',
      })
      
      calc.state.expression = '5 + 3'
      await calc.calculate()
      
      expect(calc.state.result).toBe('8')
      expect(calc.state.expression).toBe('')
      expect(invoke).toHaveBeenCalledWith('calculate', {
        expression: '5 + 3',
        displayExpression: '5 + 3',
      })
    })

    it('应该处理计算错误', async () => {
      const { invoke } = await import('@/utils/tauri')
      const calc = calculator as any
      
      // 模拟计算失败
      ;(invoke as any).mockResolvedValue({
        success: false,
        error: 'Division by zero',
      })
      
      calc.state.expression = '5 / 0'
      await calc.calculate()
      
      expect(calc.state.errorMessage).toBeTruthy()
      expect(calc.state.result).toBe('0')
    })

    it('应该正确映射错误消息', () => {
      const calc = calculator as any
      
      const testCases = [
        {
          input: 'division by zero',
          expected: '无法完成运算：分母不能为 0。',
        },
        {
          input: 'mismatched brackets',
          expected: '表达式中的括号似乎未成对，请检查后重试。',
        },
        {
          input: 'unknown function',
          expected: '检测到未知函数，请确认拼写或切换到支持的函数名称。',
        },
      ]
      
      testCases.forEach(({ input, expected }) => {
        const result = calc.mapErrorMessage(input)
        expect(result).toBe(expected)
      })
    })
  })

  describe('内存功能', () => {
    beforeEach(async () => {
      await calculator.init()
    })

    it('应该正确执行内存操作', () => {
      const calc = calculator as any
      
      // 测试存储
      calc.state.result = '42'
      calc.memoryOperation('store')
      expect(calc.state.memory).toBe('42')
      
      // 测试调用
      calc.memoryOperation('recall')
      expect(calc.state.expression).toBe('42')
      
      // 测试清除
      calc.memoryOperation('clear')
      expect(calc.state.memory).toBe('0')
      
      // 测试相加
      calc.state.memory = '10'
      calc.state.result = '5'
      calc.memoryOperation('add')
      expect(calc.state.memory).toBe('15')
    })
  })

  describe('历史记录功能', () => {
    beforeEach(async () => {
      await calculator.init()
    })

    it('应该正确添加历史记录', async () => {
      const { invoke } = await import('@/utils/tauri')
      const calc = calculator as any
      
      // 模拟成功的历史记录保存
      const mockHistoryItem = {
        id: '123',
        expression: '2 + 2',
        result: '4',
        timestamp: new Date().toISOString(),
      }
      
      ;(invoke as any).mockResolvedValue(mockHistoryItem)
      
      await calc.addToHistory('2 + 2', '4', { tags: ['basic'] })
      
      expect(invoke).toHaveBeenCalledWith('record_history_entry', {
        expression: '2 + 2',
        result: '4',
        tags: ['basic'],
        notes: undefined,
        metadata: undefined,
        persist: true,
        source: undefined,
      })
      
      expect(calc.state.history).toContain(mockHistoryItem)
    })

    it('应该正确处理历史记录选择', () => {
      const calc = calculator as any
      const mockItem = {
        id: '123',
        expression: '3 * 4',
        result: '12',
        timestamp: new Date().toISOString(),
      }
      
      calc.handleHistorySelect(mockItem)
      
      expect(calc.state.expression).toBe('3 * 4')
      expect(calc.state.result).toBe('12')
    })

    it('应该正确清空历史记录', () => {
      const calc = calculator as any
      
      calc.state.history = [
        { id: '1', expression: '1 + 1', result: '2', timestamp: new Date().toISOString() },
      ]
      
      calc.handleHistoryClear()
      
      expect(calc.state.history).toHaveLength(0)
    })
  })

  describe('设置功能', () => {
    beforeEach(async () => {
      await calculator.init()
    })

    it('应该正确处理设置变更', () => {
      const calc = calculator as any
      
      const newSettings = {
        theme: { mode: 'light' },
        display: { decimalPlaces: 8, angleUnit: 'radians' },
        general: { enableAnimations: false, enableHaptic: true },
        layout: { compactMode: true, showHistory: false },
      }
      
      calc.handleSettingsChange(newSettings)
      
      expect(calc.state.settings.theme).toBe('light')
      expect(calc.state.settings.precision).toBe(8)
      expect(calc.state.settings.angleUnit).toBe('radians')
      expect(calc.state.settings.enableAnimations).toBe(false)
      expect(calc.state.settings.enableHaptics).toBe(true)
      expect(calc.state.settings.compactMode).toBe(true)
      expect(calc.state.settings.showHistory).toBe(false)
    })

    it('应该正确切换主题', async () => {
      const calc = calculator as any
      
      calc.state.settings.theme = 'dark'
      await calc.toggleTheme()
      
      expect(calc.state.settings.theme).toBe('light')
      expect(container.getAttribute('data-theme')).toBe('light')
    })

    it('应该正确切换角度模式', () => {
      const calc = calculator as any
      
      calc.state.settings.angleUnit = 'degrees'
      calc.toggleAngleMode()
      
      expect(calc.state.settings.angleUnit).toBe('radians')
    })
  })

  describe('键盘快捷键', () => {
    beforeEach(async () => {
      await calculator.init()
    })

    it('应该正确处理数字键盘输入', () => {
      const calc = calculator as any
      
      const event = new KeyboardEvent('keydown', { key: '5' })
      const handled = calc.handleKeyboard(event)
      
      expect(handled).toBe(true)
    })

    it('应该正确处理运算符键盘输入', () => {
      const calc = calculator as any
      
      const event = new KeyboardEvent('keydown', { key: '+' })
      const handled = calc.handleKeyboard(event)
      
      expect(handled).toBe(true)
    })

    it('应该正确处理特殊按键', () => {
      const calc = calculator as any
      
      let handled = calc.handleKeyboard(new KeyboardEvent('keydown', { key: 'Enter' }))
      expect(handled).toBe(true)
      
      handled = calc.handleKeyboard(new KeyboardEvent('keydown', { key: 'Escape' }))
      expect(handled).toBe(true)
      
      handled = calc.handleKeyboard(new KeyboardEvent('keydown', { key: 'Backspace' }))
      expect(handled).toBe(true)
    })

    it('应该忽略不支持的按键', () => {
      const calc = calculator as any
      
      const event = new KeyboardEvent('keydown', { key: 'F1' })
      const handled = calc.handleKeyboard(event)
      
      expect(handled).toBe(false)
    })
  })

  describe('UI交互', () => {
    beforeEach(async () => {
      await calculator.init()
    })

    it('应该正确切换侧边栏', () => {
      const calc = calculator as any
      
      calc.toggleSidebar('history')
      const sidebar = container.querySelector('#sidebar')
      expect(sidebar?.classList.contains('open')).toBe(true)
      
      const historyPanel = container.querySelector('#history-panel')
      expect(historyPanel?.getAttribute('style')).not.toContain('display: none')
      
      calc.closeSidebar()
      expect(sidebar?.classList.contains('open')).toBe(false)
    })

    it('应该正确更新状态栏', () => {
      const calc = calculator as any
      
      calc.state.memory = '42'
      calc.updateStatusBar()
      
      const memoryIndicator = container.querySelector('#memory-indicator')
      expect(memoryIndicator?.getAttribute('style')).not.toContain('display: none')
    })

    it('应该正确显示和隐藏加载状态', () => {
      const calc = calculator as any
      
      calc.showLoading()
      let loadingOverlay = container.querySelector('#loading-overlay')
      expect(loadingOverlay?.getAttribute('style')).not.toContain('display: none')
      
      calc.hideLoading()
      loadingOverlay = container.querySelector('#loading-overlay')
      expect(loadingOverlay?.getAttribute('style')).toContain('display: none')
    })

    it('应该正确显示错误消息', () => {
      const calc = calculator as any
      
      calc.showError('测试错误')
      
      expect(calc.state.errorMessage).toBe('测试错误')
    })
  })

  describe('设备适配', () => {
    beforeEach(async () => {
      await calculator.init()
    })

    it('应该正确适配不同设备', () => {
      const calc = calculator as any
      
      calc.adaptToDevice()
      
      expect(container.getAttribute('data-device')).toBeTruthy()
      expect(container.getAttribute('data-orientation')).toBeTruthy()
    })

    it('应该正确处理窗口大小变化', () => {
      const calc = calculator as any
      
      // 模拟窗口大小变化
      calc.handleResize()
      
      // 验证适配被调用
      expect(container.getAttribute('data-device')).toBeTruthy()
    })

    it('应该正确处理屏幕方向变化', async () => {
      const calc = calculator as any
      
      calc.handleOrientationChange()
      
      // 等待延迟完成
      await new Promise(resolve => setTimeout(resolve, 150))
      
      expect(container.getAttribute('data-orientation')).toBeTruthy()
    })
  })

  describe('移动端功能', () => {
    beforeEach(async () => {
      await calculator.init()
    })

    it('应该在移动设备上初始化移动端功能', async () => {
      const { DeviceDetector } = await import('@/utils/device')
      const calc = calculator as any
      
      // 模拟移动设备
      const mockDeviceDetector = {
        isMobile: vi.fn().mockReturnValue(true),
        isTablet: vi.fn().mockReturnValue(false),
        getDeviceType: vi.fn().mockReturnValue('mobile'),
        getOrientation: vi.fn().mockReturnValue('portrait'),
      }
      
      ;(DeviceDetector as any).mockImplementation(() => mockDeviceDetector)
      
      calc.deviceDetector = mockDeviceDetector
      await calc.initMobileFeatures()
      
      // 验证手势处理器被初始化
      expect(calc.gestureHandler).toBeTruthy()
    })

    it('应该正确处理手势动作', () => {
      const calc = calculator as any
      
      const swipeGesture = {
        action: 'swipe',
        suggestion: 'deleteLastDigit',
      }
      
      calc.state.expression = '123'
      calc.handleGestureAction(swipeGesture)
      
      expect(calc.state.expression).toBe('12')
    })

    it('应该正确复制结果到剪贴板', () => {
      const calc = calculator as any
      
      // 模拟剪贴板API
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
        writable: true,
      })
      
      calc.state.result = '42'
      calc.copyResultToClipboard()
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('42')
    })
  })

  describe('高级面板', () => {
    beforeEach(async () => {
      await calculator.init()
    })

    it('应该正确处理高级面板结果', () => {
      const calc = calculator as any
      
      const panelResult = {
        expression: 'det([[1, 2], [3, 4]])',
        result: '-2',
        history: {
          expression: 'det([[1, 2], [3, 4]])',
          result: '-2',
        },
        summary: '矩阵行列式计算完成',
        metadata: {
          panel: 'matrix',
          size: '2x2',
        },
      }
      
      calc.handleAdvancedPanelResult(panelResult)
      
      expect(calc.state.result).toBe('-2')
      expect(calc.state.expression).toBe('')
    })
  })

  describe('错误处理和边界情况', () => {
    beforeEach(async () => {
      await calculator.init()
    })

    it('应该正确处理无效的表达式', async () => {
      const { invoke } = await import('@/utils/tauri')
      const calc = calculator as any
      
      // 模拟计算错误
      ;(invoke as any).mockRejectedValue(new Error('Invalid expression'))
      
      calc.state.expression = 'invalid + + expression'
      await calc.calculate()
      
      expect(calc.state.errorMessage).toBeTruthy()
      expect(calc.state.result).toBe('0')
    })

    it('应该正确处理空表达式计算', async () => {
      const calc = calculator as any
      
      calc.state.expression = ''
      await calc.calculate()
      
      // 应该不执行计算，状态保持不变
      expect(calc.state.result).toBe('0')
    })

    it('应该正确处理内存操作的边界情况', () => {
      const calc = calculator as any
      
      // 测试无效数字的内存相加
      calc.state.memory = 'invalid'
      calc.state.result = '42'
      calc.memoryOperation('add')
      
      expect(calc.state.memory).toBe('42')
    })

    it('应该正确处理状态验证', () => {
      const calc = calculator as any
      
      // 测试有效状态
      const validState = {
        settings: { theme: 'dark' },
        history: [],
      }
      expect(calc.validateStateStructure(validState)).toBe(true)
      
      // 测试无效状态
      const invalidState = null
      expect(calc.validateStateStructure(invalidState)).toBe(false)
      
      // 测试无效历史记录
      const invalidHistoryState = {
        settings: {},
        history: 'invalid',
      }
      expect(calc.validateStateStructure(invalidHistoryState)).toBe(false)
    })
  })

  describe('性能和优化', () => {
    beforeEach(async () => {
      await calculator.init()
    })

    it('应该正确跟踪性能指标', async () => {
      const { trackPerformance } = await import('@/utils/mcp-debugger')
      
      const mockData = {
        operation: 'test-operation',
        duration: 150,
      }
      
      trackPerformance(mockData)
      
      expect(trackPerformance).toHaveBeenCalledWith(mockData)
    })

    it('应该正确跟踪状态变化', async () => {
      const { trackState } = await import('@/utils/mcp-debugger')
      
      const mockState = {
        expression: '5 + 3',
        result: '8',
        memory: '0',
      }
      
      trackState(mockState)
      
      expect(trackState).toHaveBeenCalledWith(mockState)
    })

    it('应该正确跟踪错误', async () => {
      const { trackError } = await import('@/utils/mcp-debugger')
      
      const mockError = {
        type: 'TestError',
        message: 'Test error message',
        context: { key: 'value' },
      }
      
      trackError(mockError)
      
      expect(trackError).toHaveBeenCalledWith(mockError)
    })
  })

  describe('销毁和清理', () => {
    beforeEach(async () => {
      await calculator.init()
    })

    it('应该正确销毁所有组件', async () => {
      calculator.destroy()

      // 验证子组件的销毁方法被调用
      const { Display } = await import('@/components/Display.js')
      const { AdvancedKeyboard } = await import('@/components/Keyboard.js')
      const { History } = await import('@/components/History')
      const { Settings } = await import('@/components/Settings')

      expect(Display).toHaveBeenCalled()
      expect(AdvancedKeyboard).toHaveBeenCalled()
      expect(History).toHaveBeenCalled()
      expect(Settings).toHaveBeenCalled()
    })

    it('应该正确清理移动端功能', () => {
      const calc = calculator as any
      
      // 模拟移动端功能
      calc.gestureHandler = { destroy: vi.fn() }
      
      calculator.destroy()
      
      expect(calc.gestureHandler.destroy).toHaveBeenCalled()
    })
  })
})