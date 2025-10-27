


import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ThemeManager } from '@/utils/theme'
import type { Theme } from '@/types/calculator'


const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()


vi.mock('@tauri-apps/plugin-store', () => ({
  Store: {
    load: vi.fn().mockResolvedValue({
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined)
    })
  }
}))


Object.defineProperty(window, '__TAURI__', {
  value: undefined,
  writable: true
})


Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' ? false : true,
    media: query,
    onchange: null,
    addListener: vi.fn(), 
    removeListener: vi.fn(), 
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
})

describe('ThemeManager', () => {
  let themeManager: ThemeManager

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-theme')
    const root = document.documentElement
    root.style.removeProperty('--color-primary')
    root.style.removeProperty('--color-background')
    root.style.removeProperty('--color-text')
    vi.clearAllMocks()
    themeManager = new ThemeManager()
  })

  afterEach(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.remove()
    }
  })

  describe('初始化', () => {
    it('应该正确初始化主题管理器', () => {
      expect(themeManager).toBeDefined()
    })

    it('应该异步初始化并应用主题', async () => {
      await themeManager.init()
      const currentTheme = themeManager.getCurrentTheme()
      expect(currentTheme).toBeDefined()
      expect(currentTheme.colors).toBeDefined()
      expect(currentTheme.mode).toMatch(/^(light|dark)$/)
    })

    it('应该处理初始化错误并回退到系统主题', async () => {
      const originalGetItem = localStorage.getItem
      localStorage.getItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage access denied')
      })

      await themeManager.init()

      const currentTheme = themeManager.getCurrentTheme()
      expect(currentTheme).toBeDefined()

      localStorage.getItem = originalGetItem
    })
  })

  describe('当前主题获取', () => {
    beforeEach(async () => {
      await themeManager.init()
    })

    it('应该返回当前主题的副本', () => {
      const theme1 = themeManager.getCurrentTheme()
      const theme2 = themeManager.getCurrentTheme()
      expect(theme1).toEqual(theme2)
      expect(theme1).not.toBe(theme2) 
    })

    it('返回的主题应该包含必要的属性', () => {
      const theme = themeManager.getCurrentTheme()
      expect(theme).toHaveProperty('name')
      expect(theme).toHaveProperty('mode')
      expect(theme).toHaveProperty('type')
      expect(theme).toHaveProperty('colors')
      expect(theme.colors).toHaveProperty('primary')
      expect(theme.colors).toHaveProperty('background')
      expect(theme.colors).toHaveProperty('text')
    })
  })

  describe('主题模式设置', () => {
    beforeEach(async () => {
      await themeManager.init()
    })

    it('应该正确设置浅色主题', async () => {
      await themeManager.setThemeMode('light')
      const theme = themeManager.getCurrentTheme()
      expect(theme.mode).toBe('light')
      expect(theme.name).toBe('light')
      expect(document.documentElement.classList.contains('theme-light')).toBe(true)
    })

    it('应该正确设置深色主题', async () => {
      await themeManager.setThemeMode('dark')
      const theme = themeManager.getCurrentTheme()
      expect(theme.mode).toBe('dark')
      expect(theme.name).toBe('dark')
      expect(document.documentElement.classList.contains('theme-dark')).toBe(true)
    })

    it('应该正确设置高对比度主题', async () => {
      await themeManager.setThemeMode('high-contrast')
      const theme = themeManager.getCurrentTheme()
      expect(theme.mode).toBe('dark') 
      expect(theme.name).toBe('high-contrast')
    })

    it('应该正确设置自动主题', async () => {
      await themeManager.setThemeMode('auto')
      const theme = themeManager.getCurrentTheme()
      expect(['light', 'dark']).toContain(theme.mode)
    })

    it('应该拒绝无效的主题模式', async () => {
      await expect(themeManager.setThemeMode('invalid' as any)).rejects.toThrow('未知的主题模式')
    })
  })

  describe('自定义主题', () => {
    beforeEach(async () => {
      await themeManager.init()
    })

    it('应该允许设置自定义主题', () => {
      const customTheme: Partial<Theme> = {
        name: 'custom',
        colors: {
          primary: '#ff6b6b',
          secondary: '#4ecdc4',
          background: '#1a1a1a',
          surface: 'rgba(255, 255, 255, 0.1)',
          text: '#ffffff',
          textSecondary: '#cccccc',
          accent: '#ffd93d',
          error: '#ff6b6b',
          warning: '#ffd93d',
          success: '#6bcf7f',
        }
      }

      themeManager.setCustomTheme(customTheme)
      const theme = themeManager.getCurrentTheme()
      expect(theme.name).toBe('custom')
      expect(theme.colors.primary).toBe('#ff6b6b')
    })

    it('应该部分更新自定义主题', () => {
      const partialCustomTheme: Partial<Theme> = {
        colors: {
          primary: '#ff6b6b',
          secondary: '#4ecdc4',
          background: '#1a1a1a',
          surface: 'rgba(255, 255, 255, 0.1)',
          text: '#ffffff',
          textSecondary: '#cccccc',
          accent: '#ffd93d',
          error: '#ff6b6b',
          warning: '#ffd93d',
          success: '#6bcf7f',
        }
      }

      themeManager.setCustomTheme(partialCustomTheme)
      const theme = themeManager.getCurrentTheme()
      expect(theme.colors.primary).toBe('#ff6b6b')
      expect(theme.colors.accent).toBe('#ffd93d')
      expect(theme.colors.background).toBe('#1a1a1a')
    })
  })

  describe('主题切换', () => {
    beforeEach(async () => {
      await themeManager.init()
    })

    it('应该正确切换主题模式', async () => {
      await themeManager.setThemeMode('light')
      expect(themeManager.getCurrentTheme().mode).toBe('light')
      await themeManager.toggleTheme()
      expect(themeManager.getCurrentTheme().mode).toBe('dark')
      await themeManager.toggleTheme()
      expect(themeManager.getCurrentTheme().mode).toBe('light')
    })
  })

  describe('主题变化监听', () => {
    beforeEach(async () => {
      await themeManager.init()
    })

    it('应该在主题变化时调用监听器', () => {
      const mockCallback = vi.fn()
      themeManager.onThemeChange(mockCallback)
      themeManager.setCustomTheme({ name: 'test' })
      expect(mockCallback).toHaveBeenCalledTimes(1)
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({
        name: 'test'
      }))
    })

    it('应该返回取消监听的函数', () => {
      const mockCallback = vi.fn()
      const unsubscribe = themeManager.onThemeChange(mockCallback)
      themeManager.setCustomTheme({ name: 'test1' })
      expect(mockCallback).toHaveBeenCalledTimes(1)
      unsubscribe()
      themeManager.setCustomTheme({ name: 'test2' })
      expect(mockCallback).toHaveBeenCalledTimes(1) 
    })

    it('应该处理监听器回调中的错误', () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error')
      })
      const normalCallback = vi.fn()
      themeManager.onThemeChange(errorCallback)
      themeManager.onThemeChange(normalCallback)
      expect(() => {
        themeManager.setCustomTheme({ name: 'test' })
      }).not.toThrow()
      expect(errorCallback).toHaveBeenCalled()
      expect(normalCallback).toHaveBeenCalled()
    })
  })

  describe('CSS 变量生成', () => {
    beforeEach(async () => {
      await themeManager.init()
    })

    it('应该生成正确的 CSS 变量', () => {
      const theme = themeManager.getCurrentTheme()
      const cssVars = themeManager.generateCSSVariables(theme)
      expect(cssVars).toContain('--color-primary:')
      expect(cssVars).toContain('--color-secondary:')
      expect(cssVars).toContain('--color-background:')
      expect(cssVars).toContain('--color-surface:')
      expect(cssVars).toContain('--color-text:')
      expect(cssVars).toContain('--color-text-secondary:')
      expect(cssVars).toContain('--color-accent:')
      expect(cssVars).toContain('--color-error:')
      expect(cssVars).toContain('--color-warning:')
      expect(cssVars).toContain('--color-success:')
      expect(cssVars).toContain(theme.colors.primary)
      expect(cssVars).toContain(theme.colors.background)
    })
  })

  describe('主题导入导出', () => {
    beforeEach(async () => {
      await themeManager.init()
    })

    it('应该正确导出主题', () => {
      const themeJson = themeManager.exportTheme()
      const parsedTheme = JSON.parse(themeJson) as Theme
      expect(parsedTheme).toHaveProperty('name')
      expect(parsedTheme).toHaveProperty('colors')
      expect(parsedTheme.colors).toHaveProperty('primary')
    })

    it('应该正确导入有效的主题', () => {
      const themeJson = JSON.stringify({
        name: 'imported',
        mode: 'dark' as const,
        type: 'custom' as const,
        colors: {
          primary: '#ff6b6b',
          secondary: '#4ecdc4',
          background: '#1a1a1a',
          surface: 'rgba(255, 255, 255, 0.1)',
          text: '#ffffff',
          textSecondary: '#cccccc',
          accent: '#ffd93d',
          error: '#ff6b6b',
          warning: '#ffd93d',
          success: '#6bcf7f',
        },
        cssVariables: {}
      })

      const result = themeManager.importTheme(themeJson)
      expect(result).toBe(true)

      const theme = themeManager.getCurrentTheme()
      expect(theme.name).toBe('imported')
      expect(theme.colors.primary).toBe('#ff6b6b')
    })

    it('应该拒绝无效的主题格式', () => {
      const invalidThemeJson = JSON.stringify({
        name: 'invalid',
      })

      const result = themeManager.importTheme(invalidThemeJson)
      expect(result).toBe(false)
    })

    it('应该处理 JSON 解析错误', () => {
      const malformedJson = '{ invalid json }'

      const result = themeManager.importTheme(malformedJson)
      expect(result).toBe(false)
    })
  })

  describe('主题重置', () => {
    beforeEach(async () => {
      await themeManager.init()
      await themeManager.setThemeMode('dark')
    })

    it('应该重置为默认主题', async () => {
      await themeManager.resetToDefault()
      const theme = themeManager.getCurrentTheme()
      expect(['light', 'dark']).toContain(theme.mode)
      expect(theme.name).toMatch(/^(light|dark)$/)
    })
  })

  describe('减少动效模式', () => {
    beforeEach(async () => {
      await themeManager.init()
    })

    it('应该启用减少动效模式', () => {
      themeManager.setReduceMotion(true)
      expect(document.documentElement.getAttribute('data-reduce-motion')).toBe('true')
      expect(localStorage.getItem('calculator-reduce-motion')).toBe('true')
      const root = document.documentElement
      expect(root.style.getPropertyValue('--transition-fast')).toBe('0s')
      expect(root.style.getPropertyValue('--transition-normal')).toBe('0s')
    })

    it('应该禁用减少动效模式', () => {
      themeManager.setReduceMotion(false)
      expect(document.documentElement.getAttribute('data-reduce-motion')).toBeNull()
      expect(localStorage.getItem('calculator-reduce-motion')).toBe('false')
      const root = document.documentElement
      expect(root.style.getPropertyValue('--transition-fast')).toBe('')
    })

    it('应该正确检测减少动效设置', () => {
      themeManager.setReduceMotion(true)
      expect(themeManager.getReduceMotion()).toBe(true)
      themeManager.setReduceMotion(false)
      expect(themeManager.getReduceMotion()).toBe(false)
    })

    it('应该回退到系统偏好', () => {
      localStorage.clear()
      const originalMatchMedia = window.matchMedia
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })) as unknown as typeof window.matchMedia
      const reduceMotion = themeManager.getReduceMotion()
      expect(reduceMotion).toBe(true)

      window.matchMedia = originalMatchMedia
    })
  })

  describe('DOM 操作', () => {
    beforeEach(async () => {
      await themeManager.init()
    })

    it('应该正确设置 data-theme 属性', async () => {
      await themeManager.setThemeMode('dark')
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
      await themeManager.setThemeMode('light')
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    })

    it('应该正确设置 CSS 自定义属性', async () => {
      await themeManager.setThemeMode('dark')
      const root = document.documentElement
      const primaryColor = root.style.getPropertyValue('--color-primary')
      const backgroundColor = root.style.getPropertyValue('--color-background')
      expect(primaryColor).toBe('#60a5fa') 
      expect(backgroundColor).toBe('#1e293b') 
    })

    it('应该创建或更新 meta theme-color 标签', async () => {
      await themeManager.setThemeMode('dark')
      let metaThemeColor = document.querySelector('meta[name="theme-color"]')
      expect(metaThemeColor).toBeTruthy()
      expect(metaThemeColor?.getAttribute('content')).toBe('#0f172a')
      await themeManager.setThemeMode('light')
      metaThemeColor = document.querySelector('meta[name="theme-color"]')
      expect(metaThemeColor?.getAttribute('content')).toBe('#667eea')
    })
  })

  describe('边缘情况处理', () => {
    it('应该处理 localStorage 访问错误', async () => {
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const themeManager = new ThemeManager()
      await expect(themeManager.setThemeMode('dark')).resolves.not.toThrow()
      localStorage.setItem = originalSetItem
    })

    it('应该处理多个监听器的注册和注销', async () => {
      await themeManager.init()
      const callbacks = Array.from({ length: 5 }, () => vi.fn())
      const unsubscribers = callbacks.map(callback => 
        themeManager.onThemeChange(callback)
      )
      themeManager.setCustomTheme({ name: 'test' })
      callbacks.forEach(callback => {
        expect(callback).toHaveBeenCalledTimes(1)
      })
      unsubscribers.slice(0, 3).forEach(unsubscribe => unsubscribe())
      themeManager.setCustomTheme({ name: 'test2' })
      callbacks.slice(3).forEach(callback => {
        expect(callback).toHaveBeenCalledTimes(2)
      })
      callbacks.slice(0, 3).forEach(callback => {
        expect(callback).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('性能测试', () => {
    it('主题切换应该在合理时间内完成', async () => {
      await themeManager.init()
      const startTime = performance.now()
      for (let i = 0; i < 50; i++) {
        await themeManager.setThemeMode(i % 2 === 0 ? 'light' : 'dark')
      }
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(500) 
    })

    it('CSS 变量生成应该在合理时间内完成', async () => {
      await themeManager.init()
      const theme = themeManager.getCurrentTheme()
      const startTime = performance.now()
      for (let i = 0; i < 100; i++) {
        themeManager.generateCSSVariables(theme)
      }
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(50) 
    })
  })
})