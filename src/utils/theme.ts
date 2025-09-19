/**
 * 主题管理器
 * 负责管理应用的主题系统，支持浅色/深色模式和自定义主题
 */

import type { Theme, ThemeMode } from '../types/calculator'

export class ThemeManager {
  private currentTheme: Theme
  private themeChangeListeners: ((theme: Theme) => void)[] = []
  private mediaQueryList: MediaQueryList

  // 预定义主题
  private readonly lightTheme: Theme = {
    name: 'light',
    mode: 'light',
    type: 'builtin',
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      background: '#ffffff',
      surface: 'rgba(255, 255, 255, 0.95)',
      text: '#1e293b',
      textSecondary: '#64748b',
      accent: '#8b5cf6',
      error: '#ef4444',
      warning: '#f59e0b',
      success: '#10b981',
    },
    cssVariables: {},
  }

  private readonly darkTheme: Theme = {
    name: 'dark',
    mode: 'dark',
    type: 'builtin',
    colors: {
      primary: '#60a5fa',
      secondary: '#94a3b8',
      background: '#1e293b',
      surface: 'rgba(30, 41, 59, 0.95)',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      accent: '#a78bfa',
      error: '#f87171',
      warning: '#fbbf24',
      success: '#34d399',
    },
    cssVariables: {},
  }

  constructor() {
    // 监听系统主题变化
    this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')
    this.mediaQueryList.addEventListener('change', this.handleSystemThemeChange.bind(this))

    // 初始化主题
    this.currentTheme = this.getStoredTheme() || this.getSystemTheme()
  }

  /**
   * 初始化主题管理器
   */
  async init(): Promise<void> {
    try {
      // 加载保存的主题设置
      const savedThemeMode = await this.loadThemeMode()

      if (savedThemeMode === 'auto') {
        this.currentTheme = this.getSystemTheme()
      } else if (savedThemeMode) {
        this.currentTheme = savedThemeMode === 'dark' ? this.darkTheme : this.lightTheme
      }

      // 应用主题
      this.applyTheme(this.currentTheme)

      console.log('🎨 主题管理器初始化完成')
    } catch (error) {
      console.error('主题管理器初始化失败:', error)
      // 回退到系统主题
      this.currentTheme = this.getSystemTheme()
      this.applyTheme(this.currentTheme)
    }
  }

  /**
   * 获取当前主题
   */
  getCurrentTheme(): Theme {
    return { ...this.currentTheme }
  }

  /**
   * 设置主题模式
   */
  async setThemeMode(mode: ThemeMode): Promise<void> {
    let newTheme: Theme

    switch (mode) {
      case 'light':
        newTheme = this.lightTheme
        break
      case 'dark':
        newTheme = this.darkTheme
        break
      case 'auto':
        newTheme = this.getSystemTheme()
        break
      default:
        throw new Error(`未知的主题模式: ${mode}`)
    }

    this.currentTheme = newTheme
    this.applyTheme(newTheme)

    // 保存主题设置
    await this.saveThemeMode(mode)

    // 通知监听器
    this.notifyThemeChange(newTheme)
  }

  /**
   * 自定义主题
   */
  setCustomTheme(theme: Partial<Theme>): void {
    this.currentTheme = {
      ...this.currentTheme,
      ...theme,
    }

    this.applyTheme(this.currentTheme)
    this.notifyThemeChange(this.currentTheme)
  }

  /**
   * 切换主题模式
   */
  async toggleTheme(): Promise<void> {
    const currentMode = this.currentTheme.mode
    const newMode = currentMode === 'light' ? 'dark' : 'light'
    await this.setThemeMode(newMode)
  }

  /**
   * 监听主题变化
   */
  onThemeChange(callback: (theme: Theme) => void): () => void {
    this.themeChangeListeners.push(callback)

    // 返回取消监听的函数
    return () => {
      const index = this.themeChangeListeners.indexOf(callback)
      if (index > -1) {
        this.themeChangeListeners.splice(index, 1)
      }
    }
  }

  /**
   * 应用主题到页面
   */
  private applyTheme(theme: Theme): void {
    const root = document.documentElement

    // 设置 CSS 自定义属性
    root.style.setProperty('--color-primary', theme.colors.primary)
    root.style.setProperty('--color-secondary', theme.colors.secondary)
    root.style.setProperty('--color-background', theme.colors.background)
    root.style.setProperty('--color-surface', theme.colors.surface)
    root.style.setProperty('--color-text', theme.colors.text)
    root.style.setProperty('--color-text-secondary', theme.colors.textSecondary)
    root.style.setProperty('--color-accent', theme.colors.accent || theme.colors.primary)
    root.style.setProperty('--color-error', theme.colors.error || '#ef4444')
    root.style.setProperty('--color-warning', theme.colors.warning || '#f59e0b')
    root.style.setProperty('--color-success', theme.colors.success || '#10b981')

    // 添加主题类名
    root.classList.remove('theme-light', 'theme-dark')
    root.classList.add(`theme-${theme.mode}`)

    // 更新 meta 标签
    this.updateMetaThemeColor(theme)
  }

  /**
   * 更新浏览器主题颜色
   */
  private updateMetaThemeColor(theme: Theme): void {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]')

    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta')
      metaThemeColor.setAttribute('name', 'theme-color')
      document.head.appendChild(metaThemeColor)
    }

    const themeColor = theme.mode === 'dark' ? '#0f172a' : '#667eea'
    metaThemeColor.setAttribute('content', themeColor)
  }

  /**
   * 获取系统主题
   */
  private getSystemTheme(): Theme {
    const prefersDark = this.mediaQueryList.matches
    return prefersDark ? this.darkTheme : this.lightTheme
  }

  /**
   * 处理系统主题变化
   */
  private handleSystemThemeChange(): void {
    // 只有在自动模式下才响应系统主题变化
    this.loadThemeMode().then(mode => {
      if (mode === 'auto' || !mode) {
        const systemTheme = this.getSystemTheme()
        this.currentTheme = systemTheme
        this.applyTheme(systemTheme)
        this.notifyThemeChange(systemTheme)
      }
    })
  }

  /**
   * 通知主题变化
   */
  private notifyThemeChange(theme: Theme): void {
    this.themeChangeListeners.forEach(callback => {
      try {
        callback(theme)
      } catch (error) {
        console.error('主题变化回调执行失败:', error)
      }
    })
  }

  /**
   * 从本地存储获取主题
   */
  private getStoredTheme(): Theme | null {
    try {
      const stored = localStorage.getItem('calculator-theme')
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed
      }
    } catch (error) {
      console.warn('读取存储的主题失败:', error)
    }
    return null
  }

  /**
   * 加载主题模式设置
   */
  private async loadThemeMode(): Promise<ThemeMode | null> {
    try {
      // 优先从 Tauri 存储读取
      if ((window as typeof window & { __TAURI__?: unknown }).__TAURI__) {
        const { Store } = await import('@tauri-apps/plugin-store')
        const store = await Store.load('settings.json')
        return (await store.get('themeMode')) as ThemeMode
      }

      // 回退到 localStorage
      return localStorage.getItem('calculator-theme-mode') as ThemeMode
    } catch (error) {
      console.warn('读取主题模式设置失败:', error)
      return null
    }
  }

  /**
   * 保存主题模式设置
   */
  private async saveThemeMode(mode: ThemeMode): Promise<void> {
    try {
      // 优先保存到 Tauri 存储
      if ((window as typeof window & { __TAURI__?: unknown }).__TAURI__) {
        const { Store } = await import('@tauri-apps/plugin-store')
        const store = await Store.load('settings.json')
        await store.set('themeMode', mode)
        await store.save()
      }

      // 同时保存到 localStorage 作为备份
      localStorage.setItem('calculator-theme-mode', mode)
    } catch (error) {
      console.error('保存主题模式设置失败:', error)
      // 回退到 localStorage
      localStorage.setItem('calculator-theme-mode', mode)
    }
  }

  /**
   * 生成自定义主题的 CSS 变量
   */
  generateCSSVariables(theme: Theme): string {
    return `
      :root {
        --color-primary: ${theme.colors.primary};
        --color-secondary: ${theme.colors.secondary};
        --color-background: ${theme.colors.background};
        --color-surface: ${theme.colors.surface};
        --color-text: ${theme.colors.text};
        --color-text-secondary: ${theme.colors.textSecondary};
        --color-accent: ${theme.colors.accent || theme.colors.primary};
        --color-error: ${theme.colors.error || '#ef4444'};
        --color-warning: ${theme.colors.warning || '#f59e0b'};
        --color-success: ${theme.colors.success || '#10b981'};
      }
    `
  }

  /**
   * 导出当前主题配置
   */
  exportTheme(): string {
    return JSON.stringify(this.currentTheme, null, 2)
  }

  /**
   * 导入主题配置
   */
  importTheme(themeJson: string): boolean {
    try {
      const theme = JSON.parse(themeJson) as Theme

      // 验证主题格式
      if (!this.validateTheme(theme)) {
        throw new Error('无效的主题格式')
      }

      this.setCustomTheme(theme)
      return true
    } catch (error) {
      console.error('导入主题失败:', error)
      return false
    }
  }

  /**
   * 验证主题格式
   */
  private validateTheme(theme: unknown): theme is Theme {
    if (!theme || typeof theme !== 'object') {
      return false
    }

    const themeObj = theme as Record<string, unknown>
    const requiredFields = [
      'mode',
      'primary',
      'secondary',
      'background',
      'surface',
      'text',
      'textSecondary',
      'accent',
      'error',
      'warning',
      'success',
    ]

    return requiredFields.every(field => field in themeObj)
  }

  /**
   * 重置为默认主题
   */
  async resetToDefault(): Promise<void> {
    await this.setThemeMode('auto')
  }
}
