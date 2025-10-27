


import type { Theme, ThemeMode, ColorPalette } from '@/types/calculator'

export class ThemeManager {
  private currentTheme: Theme
  private themeChangeListeners: ((theme: Theme) => void)[] = []
  private mediaQueryList: MediaQueryList

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

  private readonly highContrastTheme: Theme = {
    name: 'high-contrast',
    mode: 'dark',
    type: 'builtin',
    colors: {
      primary: '#ffff00',
      secondary: '#ffffff',
      background: '#000000',
      surface: '#000000',
      text: '#ffffff',
      textSecondary: '#ffff00',
      accent: '#00ff00',
      error: '#ff0000',
      warning: '#ffff00',
      success: '#00ff00',
    },
    cssVariables: {},
  }

  constructor() {
    this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')
    this.mediaQueryList.addEventListener('change', this.handleSystemThemeChange.bind(this))

    this.currentTheme = this.getStoredTheme() || this.getSystemTheme()
  }


  async init(): Promise<void> {
    try {
      const savedThemeMode = await this.loadThemeMode()

      if (savedThemeMode === 'auto') {
        this.currentTheme = this.getSystemTheme()
      } else if (savedThemeMode) {
        this.currentTheme = savedThemeMode === 'dark' ? this.darkTheme : this.lightTheme
      }

      this.applyTheme(this.currentTheme)

      console.log('🎨 主题管理器初始化完成')
    } catch (error) {
      console.error('主题管理器初始化失败:', error)
      this.currentTheme = this.getSystemTheme()
      this.applyTheme(this.currentTheme)
    }
  }


  getCurrentTheme(): Theme {
    return { ...this.currentTheme }
  }


  async setThemeMode(mode: ThemeMode | 'high-contrast'): Promise<void> {
    let newTheme: Theme

    switch (mode) {
      case 'light':
        newTheme = this.lightTheme
        break
      case 'dark':
        newTheme = this.darkTheme
        break
      case 'high-contrast':
        newTheme = this.highContrastTheme
        break
      case 'auto':
        newTheme = this.getSystemTheme()
        break
      default:
        throw new Error(`未知的主题模式: ${mode}`)
    }

    this.currentTheme = newTheme
    this.applyTheme(newTheme)

    await this.saveThemeMode(mode as ThemeMode)

    this.notifyThemeChange(newTheme)
  }


  setCustomTheme(theme: Partial<Theme>): void {
    const mergedTheme: Theme = {
      ...this.currentTheme,
      ...theme,
      type: theme.type ?? 'custom',
      colors: {
        ...this.currentTheme.colors,
        ...(theme.colors ?? {}),
      },
      cssVariables: theme.cssVariables ?? this.currentTheme.cssVariables ?? {},
    }

    this.currentTheme = mergedTheme
    this.applyTheme(mergedTheme)
    this.notifyThemeChange(mergedTheme)
  }


  async toggleTheme(): Promise<void> {
    const currentMode = this.currentTheme.mode
    const newMode = currentMode === 'light' ? 'dark' : 'light'
    await this.setThemeMode(newMode)
  }


  onThemeChange(callback: (theme: Theme) => void): () => void {
    this.themeChangeListeners.push(callback)

    return () => {
      const index = this.themeChangeListeners.indexOf(callback)
      if (index > -1) {
        this.themeChangeListeners.splice(index, 1)
      }
    }
  }


  private applyTheme(theme: Theme): void {
    const root = document.documentElement

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

    root.classList.remove('theme-light', 'theme-dark')
    root.classList.add(`theme-${theme.mode}`)

    root.setAttribute('data-theme', theme.name)

    this.updateMetaThemeColor(theme)
  }


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


  private getSystemTheme(): Theme {
    const prefersDark = this.mediaQueryList.matches
    return prefersDark ? this.darkTheme : this.lightTheme
  }


  private handleSystemThemeChange(): void {
    this.loadThemeMode().then(mode => {
      if (mode === 'auto' || !mode) {
        const systemTheme = this.getSystemTheme()
        this.currentTheme = systemTheme
        this.applyTheme(systemTheme)
        this.notifyThemeChange(systemTheme)
      }
    })
  }


  private notifyThemeChange(theme: Theme): void {
    this.themeChangeListeners.forEach(callback => {
      try {
        callback(theme)
      } catch (error) {
        console.error('主题变化回调执行失败:', error)
      }
    })
  }


  private getStoredTheme(): Theme | null {
    try {
      const stored = localStorage.getItem('calculator-theme')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (this.validateTheme(parsed)) {
          return parsed
        }
      }
    } catch (error) {
      console.warn('读取存储的主题失败:', error)
    }
    return null
  }


  private async loadThemeMode(): Promise<ThemeMode | null> {
    try {
      if ((window as typeof window & { __TAURI__?: unknown }).__TAURI__) {
        const { Store } = await import('@tauri-apps/plugin-store')
        const store = await Store.load('settings.json')
        return (await store.get('themeMode')) as ThemeMode
      }

      return localStorage.getItem('calculator-theme-mode') as ThemeMode
    } catch (error) {
      console.warn('读取主题模式设置失败:', error)
      return null
    }
  }


  private async saveThemeMode(mode: ThemeMode): Promise<void> {
    try {
      if ((window as typeof window & { __TAURI__?: unknown }).__TAURI__) {
        const { Store } = await import('@tauri-apps/plugin-store')
        const store = await Store.load('settings.json')
        await store.set('themeMode', mode)
        await store.save()
      }

      localStorage.setItem('calculator-theme-mode', mode)
    } catch (error) {
      console.error('保存主题模式设置失败:', error)
      try {
        localStorage.setItem('calculator-theme-mode', mode)
      } catch (fallbackError) {
        console.warn('无法保存主题模式设置到 localStorage:', fallbackError)
      }
    }
  }


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


  exportTheme(): string {
    return JSON.stringify(this.currentTheme, null, 2)
  }


  importTheme(themeJson: string): boolean {
    try {
      const theme = JSON.parse(themeJson) as Theme

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


  private validateTheme(theme: unknown): theme is Theme {
    if (!theme || typeof theme !== 'object') {
      return false
    }

    const themeObj = theme as Partial<Theme>
    if (!themeObj.name || typeof themeObj.name !== 'string') {
      return false
    }

    if (!themeObj.mode || typeof themeObj.mode !== 'string') {
      return false
    }

    if (!themeObj.colors || typeof themeObj.colors !== 'object') {
      return false
    }

    const requiredColorFields: Array<keyof ColorPalette> = [
      'primary',
      'secondary',
      'background',
      'surface',
      'text',
      'textSecondary',
    ]

    return requiredColorFields.every(field => {
      const value = (themeObj.colors as Partial<ColorPalette>)[field]
      return typeof value === 'string' && value.length > 0
    })
  }


  async resetToDefault(): Promise<void> {
    await this.setThemeMode('auto')
  }


  setReduceMotion(enabled: boolean): void {
    const root = document.documentElement
    if (enabled) {
      root.setAttribute('data-reduce-motion', 'true')
      root.style.setProperty('--transition-fast', '0s')
      root.style.setProperty('--transition-normal', '0s')
      root.style.setProperty('--transition-slow', '0s')
      root.style.setProperty('--transition-bounce', '0s')
      root.style.setProperty('--transition-smooth', '0s')
    } else {
      root.removeAttribute('data-reduce-motion')
      root.style.removeProperty('--transition-fast')
      root.style.removeProperty('--transition-normal')
      root.style.removeProperty('--transition-slow')
      root.style.removeProperty('--transition-bounce')
      root.style.removeProperty('--transition-smooth')
    }

    try {
      localStorage.setItem('calculator-reduce-motion', String(enabled))
    } catch (error) {
      console.error('保存减少动效设置失败:', error)
    }
  }


  getReduceMotion(): boolean {
    try {
      const stored = localStorage.getItem('calculator-reduce-motion')
      if (stored !== null) {
        return stored === 'true'
      }
    } catch (error) {
      console.warn('读取减少动效设置失败:', error)
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }


  initReduceMotion(): void {
    const reduceMotion = this.getReduceMotion()
    this.setReduceMotion(reduceMotion)

    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      const stored = localStorage.getItem('calculator-reduce-motion')
      if (stored === null) {
        this.setReduceMotion(e.matches)
      }
    })
  }
}
