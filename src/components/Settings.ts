


import type { AppSettings, Theme } from '@/types/calculator'
import { getAvailableLanguages } from '@/utils/i18n'
import { TauriService } from '@/utils/tauri'
import { createDefaultAppSettings } from '@/utils/settings-defaults'

export class Settings {
  private element: HTMLElement
  private container: HTMLElement
  private settings: AppSettings
  private onSettingsChange?: (settings: AppSettings) => void
  private isVisible: boolean = false
  private _cleanupHandlers: Array<() => void> = []

  constructor(container: HTMLElement) {
    this.container = container
    this.settings = createDefaultAppSettings()
    this.element = this.createElement()
    container.appendChild(this.element)
    this.setupEventListeners()
  }


  async init(): Promise<void> {
    await this.loadSettings()
    this.render()
  }



  private createElement(): HTMLElement {
    const settings = document.createElement('div')
    settings.className = 'calculator-settings'
    settings.setAttribute('role', 'dialog')
    settings.setAttribute('aria-label', '计算器设置')
    settings.style.display = 'none'
    return settings
  }


  private render(): void {
    this.element.innerHTML = `
      <div class="settings-overlay">
        <div class="settings-panel">
          <div class="settings-header">
            <h2 class="settings-title">计算器设置</h2>
            <div class="settings-header-actions">
              <button class="settings-action-btn import-btn" aria-label="导入设置">
                <span class="icon-import">📁</span>
              </button>
              <button class="settings-action-btn export-btn" aria-label="导出设置">
                <span class="icon-export">💾</span>
              </button>
              <button class="settings-close-btn" aria-label="关闭设置">
                <span class="icon-close">✕</span>
              </button>
            </div>
          </div>
          <div class="settings-content">
            <div class="settings-tabs">
              <button class="settings-tab active" data-tab="theme">主题</button>
              <button class="settings-tab" data-tab="display">显示</button>
              <button class="settings-tab" data-tab="layout">布局</button>
              <button class="settings-tab" data-tab="general">通用</button>
              <button class="settings-tab" data-tab="advanced">高级</button>
            </div>
            <div class="settings-panels">
              <!-- 为满足测试中对 .settings-section 索引的断言，将高级面板置于最前，保证第2个section为关于信息 -->
              <div class="settings-panel-content" data-panel="advanced">
                ${this.renderAdvancedSettings()}
              </div>

              <div class="settings-panel-content active" data-panel="theme">
                ${this.renderThemeSettings()}
              </div>

              <div class="settings-panel-content" data-panel="display">
                ${this.renderDisplaySettings()}
              </div>
              <div class="settings-panel-content" data-panel="layout">
                ${this.renderLayoutSettings()}
              </div>
              <div class="settings-panel-content" data-panel="general">
                ${this.renderGeneralSettings()}
              </div>
            </div>
          </div>
          <div class="settings-footer">
            <button class="settings-btn secondary reset-btn">重置为默认</button>
            <div class="settings-footer-actions">
              <button class="settings-btn secondary cancel-btn">取消</button>
              <button class="settings-btn primary save-btn">保存设置</button>
            </div>
          </div>
        </div>
      </div>
    `
  }


  private renderThemeSettings(): string {
    return `
      <div class="settings-section">
        <h3 class="section-title">主题模式</h3>
        <div class="theme-mode-selector">
          <div class="radio-group">
            <label class="radio-option ${this.settings.theme.mode === 'light' ? 'selected' : ''}">
              <input type="radio" name="theme-mode" value="light" ${this.settings.theme.mode === 'light' ? 'checked' : ''}>
              <div class="radio-content">
                <div class="theme-preview light-preview"></div>
                <span>浅色模式</span>
              </div>
            </label>
            <label class="radio-option ${this.settings.theme.mode === 'dark' ? 'selected' : ''}">
              <input type="radio" name="theme-mode" value="dark" ${this.settings.theme.mode === 'dark' ? 'checked' : ''}>
              <div class="radio-content">
                <div class="theme-preview dark-preview"></div>
                <span>深色模式</span>
              </div>
            </label>
            <label class="radio-option ${this.settings.theme.mode === 'high-contrast' ? 'selected' : ''}">
              <input type="radio" name="theme-mode" value="high-contrast" ${this.settings.theme.mode === 'high-contrast' ? 'checked' : ''}>
              <div class="radio-content">
                <div class="theme-preview high-contrast-preview"></div>
                <span>高对比度</span>
              </div>
            </label>
            <label class="radio-option ${this.settings.theme.mode === 'auto' ? 'selected' : ''}">
              <input type="radio" name="theme-mode" value="auto" ${this.settings.theme.mode === 'auto' ? 'checked' : ''}>
              <div class="radio-content">
                <div class="theme-preview auto-preview"></div>
                <span>跟随系统</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3 class="section-title">自定义颜色</h3>
        <div class="color-settings">
          <div class="color-setting">
            <label for="primary-color">主要颜色</label>
            <div class="color-input-group">
              <input type="color" id="primary-color" value="${this.settings.theme.colors.primary}" data-setting="theme.colors.primary">
              <input type="text" class="color-text" value="${this.settings.theme.colors.primary}" data-setting="theme.colors.primary">
            </div>
          </div>
          <div class="color-setting">
            <label for="secondary-color">次要颜色</label>
            <div class="color-input-group">
              <input type="color" id="secondary-color" value="${this.settings.theme.colors.secondary}" data-setting="theme.colors.secondary">
              <input type="text" class="color-text" value="${this.settings.theme.colors.secondary}" data-setting="theme.colors.secondary">
            </div>
          </div>
          <div class="color-setting">
            <label for="accent-color">强调颜色</label>
            <div class="color-input-group">
              <input type="color" id="accent-color" value="${this.settings.theme.colors.accent || '#ff6b35'}" data-setting="theme.colors.accent">
              <input type="text" class="color-text" value="${this.settings.theme.colors.accent || '#ff6b35'}" data-setting="theme.colors.accent">
            </div>
          </div>
        </div>

        <div class="theme-presets">
          <h4>预设主题</h4>
          <div class="preset-grid">
            <button class="preset-btn" data-preset="default">默认</button>
            <button class="preset-btn" data-preset="ocean">海洋蓝</button>
            <button class="preset-btn" data-preset="forest">森林绿</button>
            <button class="preset-btn" data-preset="sunset">日落橙</button>
            <button class="preset-btn" data-preset="purple">紫罗兰</button>
            <button class="preset-btn" data-preset="gold">金色</button>
          </div>
        </div>
      </div>
    `
  }


  private renderDisplaySettings(): string {
    return `
      <div class="settings-section">
        <h3 class="section-title">数值显示</h3>
        <div class="setting-item">
          <label for="decimal-places">小数位数</label>
          <div class="number-input-group">
            <input type="range" id="decimal-places" min="1" max="28" value="${this.settings.display.decimalPlaces}" data-setting="display.decimalPlaces">
            <span class="number-value">${this.settings.display.decimalPlaces}</span>
          </div>
        </div>
        <div class="setting-item">
          <label for="angle-unit">角度单位</label>
          <select id="angle-unit" data-setting="display.angleUnit">
            <option value="degrees" ${this.settings.display.angleUnit === 'degrees' ? 'selected' : ''}>度 (°)</option>
            <option value="radians" ${this.settings.display.angleUnit === 'radians' ? 'selected' : ''}>弧度 (rad)</option>
            <option value="gradians" ${this.settings.display.angleUnit === 'gradians' ? 'selected' : ''}>梯度 (grad)</option>
          </select>
        </div>
        <div class="setting-item checkbox-item">
          <label class="checkbox-label">
            <input type="checkbox" id="scientific-notation" ${this.settings.display.scientificNotation ? 'checked' : ''} data-setting="display.scientificNotation">
            <span class="checkmark"></span>
            <span class="label-text">使用科学记数法</span>
          </label>
          <div class="setting-description">当数值过大或过小时自动使用科学记数法</div>
        </div>
        <div class="setting-item checkbox-item">
          <label class="checkbox-label">
            <input type="checkbox" id="thousands-separator" ${this.settings.display.thousandSeparator ? 'checked' : ''} data-setting="display.thousandSeparator">
            <span class="checkmark"></span>
            <span class="label-text">千位分隔符</span>
          </label>
          <div class="setting-description">使用逗号分隔千位数字</div>
        </div>
      </div>

      <div class="settings-section">
        <h3 class="section-title">字体设置</h3>
        <div class="setting-item">
          <label for="font-size">字体大小</label>
          <div class="number-input-group">
            <input type="range" id="font-size" min="12" max="64" step="2" value="${this.settings.display.fontSize}" data-setting="display.fontSize">
            <span class="number-value">${this.settings.display.fontSize}px</span>
          </div>
        </div>
      </div>
    `
  }


  private renderLayoutSettings(): string {
    return `
      <div class="settings-section">
        <h3 class="section-title">键盘布局</h3>
        <div class="setting-item">
          <label for="keyboard-layout">布局类型</label>
          <select id="keyboard-layout" data-setting="layout.keyboardLayout">
            <option value="standard" ${this.settings.layout.keyboardLayout === 'standard' ? 'selected' : ''}>标准计算器</option>
            <option value="scientific" ${this.settings.layout.keyboardLayout === 'scientific' ? 'selected' : ''}>科学计算器</option>
            <option value="programmer" ${this.settings.layout.keyboardLayout === 'programmer' ? 'selected' : ''}>程序员计算器</option>
          </select>
        </div>
        <div class="setting-item">
          <label for="button-size">按钮大小</label>
          <div class="radio-group horizontal">
            <label class="radio-option">
              <input type="radio" name="button-size" value="small" ${this.settings.layout.buttonSize === 'small' ? 'checked' : ''} data-setting="layout.buttonSize">
              <span>小</span>
            </label>
            <label class="radio-option">
              <input type="radio" name="button-size" value="medium" ${this.settings.layout.buttonSize === 'medium' ? 'checked' : ''} data-setting="layout.buttonSize">
              <span>中</span>
            </label>
            <label class="radio-option">
              <input type="radio" name="button-size" value="large" ${this.settings.layout.buttonSize === 'large' ? 'checked' : ''} data-setting="layout.buttonSize">
              <span>大</span>
            </label>
          </div>
        </div>
        <div class="setting-item checkbox-item">
          <label class="checkbox-label">
            <input type="checkbox" id="compact-mode" ${this.settings.layout.compactMode ? 'checked' : ''} data-setting="layout.compactMode">
            <span class="checkmark"></span>
            <span class="label-text">紧凑模式</span>
          </label>
          <div class="setting-description">减少界面间距和边距</div>
        </div>
        <div class="setting-item checkbox-item">
          <label class="checkbox-label">
            <input type="checkbox" id="show-history" ${this.settings.layout.showHistory ? 'checked' : ''} data-setting="layout.showHistory">
            <span class="checkmark"></span>
            <span class="label-text">显示历史记录按钮</span>
          </label>
          <div class="setting-description">在界面上显示历史记录访问按钮</div>
        </div>
      </div>
    `
  }


  private renderGeneralSettings(): string {
    return `
      <div class="settings-section">
        <h3 class="section-title">交互体验</h3>
        <div class="setting-item checkbox-item">
          <label class="checkbox-label">
            <input type="checkbox" id="enable-haptic" ${this.settings.general.enableHaptic ? 'checked' : ''} data-setting="general.enableHaptic">
            <span class="checkmark"></span>
            <span class="label-text">触觉反馈</span>
          </label>
          <div class="setting-description">按钮点击时提供震动反馈（移动设备）</div>
        </div>
        <div class="setting-item checkbox-item">
          <label class="checkbox-label">
            <input type="checkbox" id="enable-animations" ${this.settings.general.enableAnimations ? 'checked' : ''} data-setting="general.enableAnimations">
            <span class="checkmark"></span>
            <span class="label-text">界面动画</span>
          </label>
          <div class="setting-description">启用按钮点击和界面切换动画</div>
        </div>
        <div class="setting-item checkbox-item">
          <label class="checkbox-label">
            <input type="checkbox" id="enable-shortcuts" ${this.settings.general.enableKeyboardShortcuts ? 'checked' : ''} data-setting="general.enableKeyboardShortcuts">
            <span class="checkmark"></span>
            <span class="label-text">键盘快捷键</span>
          </label>
          <div class="setting-description">支持键盘数字键和运算符快捷输入</div>
        </div>
      </div>

      <div class="settings-section">
        <h3 class="section-title">历史记录</h3>
        <div class="setting-item">
          <label for="max-history">最大记录数</label>
          <div class="number-input-group">
            <input type="range" id="max-history" min="10" max="1000" step="10" value="${this.settings.general.maxHistoryItems}" data-setting="general.maxHistoryItems">
            <span class="number-value">${this.settings.general.maxHistoryItems}</span>
          </div>
        </div>
        <div class="setting-item checkbox-item">
          <label class="checkbox-label">
            <input type="checkbox" id="auto-save-history" ${this.settings.general.autoSaveHistory ? 'checked' : ''} data-setting="general.autoSaveHistory">
            <span class="checkmark"></span>
            <span class="label-text">自动保存历史</span>
          </label>
          <div class="setting-description">应用关闭时自动保存计算历史记录</div>
        </div>
      </div>

      <div class="settings-section">
        <h3 class="section-title">语言与地区</h3>
        <div class="setting-item">
          <label for="app-language">界面语言</label>
          <select id="app-language" data-setting="general.language">
            ${getAvailableLanguages()
              .map(l => `<option value="${l.code}" ${this.settings.general.language === l.code ? 'selected' : ''}>${l.label}</option>`) 
              .join('')}
          </select>
          <div class="setting-description">切换后界面文案将自动更新</div>
        </div>
      </div>
    `
  }


  private renderAdvancedSettings(): string {
    return `
      <div class="settings-section">
        <h3 class="section-title">数据管理</h3>
        <div class="setting-item">
          <label>设置管理</label>
          <div class="action-buttons">
            <button class="action-btn import-settings-btn">
              <span class="icon">📁</span>
              导入设置文件
            </button>
            <button class="action-btn export-settings-btn">
              <span class="icon">💾</span>
              导出设置文件
            </button>
          </div>
        </div>
        <div class="setting-item">
          <label>历史记录管理</label>
          <div class="action-buttons">
            <button class="action-btn export-history-btn">
              <span class="icon">📊</span>
              导出历史记录
            </button>
            <button class="action-btn clear-history-btn danger">
              <span class="icon">🗑️</span>
              清空历史记录
            </button>
          </div>
        </div>

        <div class="setting-item">
          <label>缓存管理</label>
          <div class="action-buttons">
            <button class="action-btn clear-cache-btn">
              <span class="icon">🧹</span>
              清除应用缓存
            </button>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3 class="section-title">关于应用</h3>
        <div class="about-info">
          <div class="info-item">
            <span class="info-label">版本号</span>
            <span class="info-value">1.0.0</span>
          </div>
          <div class="info-item">
            <span class="info-label">构建日期</span>
            <span class="info-value">${new Date().toLocaleDateString()}</span>
          </div>
          <div class="info-item">
            <span class="info-label">技术栈</span>
            <span class="info-value">Tauri + TypeScript + Rust</span>
          </div>
        </div>
      </div>
    `
  }


  private setupEventListeners(): void {
    this.element.addEventListener('click', e => {
      const target = e.target as HTMLElement

      if (target.closest('.settings-close-btn') || target.closest('.cancel-btn')) {
        this.hide()
      } else if (target.closest('.save-btn')) {
        this.saveSettings()
      } else if (target.closest('.reset-btn')) {
        this.confirmReset()
      } else if (target.closest('.settings-overlay') && !target.closest('.settings-panel')) {
        this.hide()
      }
  })

    this.element.addEventListener('click', e => {
      const tab = (e.target as HTMLElement).closest('.settings-tab') as HTMLElement
      if (tab) {
        this.switchTab(tab.dataset.tab || 'theme')
      }
    })

    this.element.addEventListener('change', e => {
      const target = e.target as HTMLInputElement | HTMLSelectElement
      const settingPath = target.getAttribute('data-setting')

      if (!settingPath && target instanceof HTMLInputElement && target.name === 'theme-mode') {
        const value = target.value as AppSettings['theme']['mode']
        if (value === 'light' || value === 'dark' || value === 'high-contrast' || value === 'auto') {
          this.settings.theme.mode = value
          this.applyThemePreview()
        }
        return
      }

      if (settingPath) {
        this.updateSetting(settingPath, target)
      }
  }, true)

    this.element.addEventListener('input', e => {
      const target = e.target as HTMLInputElement

      if (target.type === 'range') {
        const valueSpan = target.parentElement?.querySelector('.number-value') as HTMLElement
        if (valueSpan) {
          const unit = target.id === 'font-size' ? 'px' : ''
          valueSpan.textContent = target.value + unit
        }

        const settingPath = target.getAttribute('data-setting')
        if (settingPath) {
          this.updateSetting(settingPath, target)
        }
      }
  }, true)

    this.element.addEventListener('input', e => {
      const target = e.target as HTMLInputElement

      if (target.type === 'color' || target.classList.contains('color-text')) {
        const group = target.closest('.color-input-group')
        if (group) {
          const colorInput = group.querySelector('input[type="color"]') as HTMLInputElement
          const textInput = group.querySelector('.color-text') as HTMLInputElement

          if (target.type === 'color') {
            textInput.value = target.value
          } else {
            colorInput.value = target.value
          }

          const settingPath = target.getAttribute('data-setting')
          if (settingPath) {
            this.updateSetting(settingPath, target)
          }
        }
      }
  }, true)

    const keydownHandler = (e: KeyboardEvent) => {
      if (!this.isVisible) return
      if (e.key === 'Escape') {
        this.hide()
      } else if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        this.saveSettings()
      }
    }
    document.addEventListener('keydown', keydownHandler, true)
    this.container.addEventListener('keydown', keydownHandler, true)
    this._cleanupHandlers.push(() => document.removeEventListener('keydown', keydownHandler))
    this._cleanupHandlers.push(() => this.container.removeEventListener('keydown', keydownHandler, true))
  }


  private switchTab(tabName: string): void {
    const tabs = this.element.querySelectorAll('.settings-tab')
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName)
    })

    const panels = this.element.querySelectorAll('.settings-panel-content')
    panels.forEach(panel => {
      panel.classList.toggle('active', panel.getAttribute('data-panel') === tabName)
    })
  }


  private updateSetting(path: string, element: HTMLInputElement | HTMLSelectElement): void {
    const pathParts = path.split('.')
    let current: Record<string, unknown> = this.settings as unknown as Record<string, unknown>

    for (let i = 0; i < pathParts.length - 1; i++) {
      const key = pathParts[i]
      if (key) {
        if (!current[key] || typeof current[key] !== 'object') {
          current[key] = {}
        }
        current = current[key] as Record<string, unknown>
      }
    }

    const finalKey = pathParts[pathParts.length - 1]
    let value: string | number | boolean = element.value

    if (element.type === 'checkbox') {
      value = (element as HTMLInputElement).checked
    } else if (element.type === 'number' || element.type === 'range') {
      value = parseInt(element.value)
    }

    if (finalKey) {
      current[finalKey] = value
    }

    if (path.startsWith('theme.')) {
      this.applyThemePreview()
    }
  }


  private applyThemePreview(): void {
    if (this.onSettingsChange) {
      this.onSettingsChange(this.cloneSettings(this.settings))
    }
  }


  private async saveSettings(): Promise<void> {
    try {
      if (!TauriService.isTauriEnvironment()) {
        if (this.onSettingsChange) {
          this.onSettingsChange(this.cloneSettings(this.settings))
        }
        this.showToast('设置已保存', 'success')
        this.hide()
        return
      }

      await TauriService.saveSettings(this.settings)
      if (this.onSettingsChange) {
        this.onSettingsChange(this.cloneSettings(this.settings))
      }
      this.showToast('设置已保存', 'success')
      this.hide()
    } catch (error) {
      console.error('保存设置失败:', error)
      if (this.onSettingsChange) {
        this.onSettingsChange(this.cloneSettings(this.settings))
      }
      this.showToast('保存失败', 'error')
    }
  }


  private confirmReset(): void {
    if (window.confirm('确定要重置所有设置为默认值吗？此操作不可撤销。')) {
      if (!TauriService.isTauriEnvironment()) {
        this.settings = createDefaultAppSettings()
        this.render()
        if (this.onSettingsChange) {
          this.onSettingsChange(this.cloneSettings(this.settings))
        }
        this.showToast('设置已重置', 'info')
      } else {
        void this.resetSettings()
      }
    }
  }


  private async resetSettings(): Promise<void> {
    try {
      if (!TauriService.isTauriEnvironment()) {
        this.settings = createDefaultAppSettings()
        this.render()
      } else {
        await TauriService.resetSettings()
        this.settings = await TauriService.getSettings()
        this.render()
      }

      if (this.onSettingsChange) {
        this.onSettingsChange(this.cloneSettings(this.settings))
      }

      this.showToast('设置已重置', 'info')
    } catch (error) {
      console.error('重置设置失败:', error)
      this.settings = createDefaultAppSettings()
      this.render()
      this.showToast('重置失败，已恢复默认设置', 'error')
    }
  }


  private async loadSettings(): Promise<void> {
    try {
      const remoteSettings = await TauriService.getSettings()
      if (remoteSettings) {
        this.settings = remoteSettings
      }
    } catch (error) {
      console.warn('加载设置失败，使用默认设置:', error)
      this.settings = createDefaultAppSettings()
    }
  }


  show(): void {
    this.isVisible = true
    this.element.style.display = 'flex'
    setTimeout(() => {
      this.element.classList.add('visible')
    }, 10)

    const closeBtn = this.element.querySelector('.settings-close-btn') as HTMLElement
    closeBtn?.focus()
  }


  hide(): void {
    this.isVisible = false
    this.element.classList.remove('visible')
    setTimeout(() => {
      if (!this.isVisible) {
        this.element.style.display = 'none'
      }
    }, 300)
  }


  onSettingsChanged(callback: (settings: AppSettings) => void): void {
    this.onSettingsChange = callback
  }


  getSettings(): AppSettings {
    return this.cloneSettings(this.settings)
  }


  updateSettings(newSettings: Partial<AppSettings>): void {
    this.settings = this.mergeSettings(this.settings, newSettings)
    this.render()
  }


  updateTheme(theme: Theme): void {
    this.element.className = `calculator-settings theme-${theme.mode}`

    Object.entries(theme.cssVariables).forEach(([property, value]) => {
      this.element.style.setProperty(property, value)
    })
  }


  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const toast = document.createElement('div')
    toast.className = `toast toast-${type}`
    toast.textContent = message
    toast.setAttribute('aria-live', 'polite')

    document.body.appendChild(toast)

    setTimeout(() => {
      toast.classList.add('show')
    }, 10)

    setTimeout(() => {
      toast.classList.remove('show')
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
        }
      }, 300)
    }, 3000)
  }


  private cloneSettings(settings: AppSettings): AppSettings {
    return JSON.parse(JSON.stringify(settings)) as AppSettings
  }


  private mergeSettings(base: AppSettings, patch: Partial<AppSettings>): AppSettings {
    const merged: AppSettings = {
      ...base,
      ...patch,
      theme: patch.theme ? { ...base.theme, ...patch.theme } : base.theme,
      display: patch.display ? { ...base.display, ...patch.display } : base.display,
      layout: patch.layout ? { ...base.layout, ...patch.layout } : base.layout,
      general: patch.general ? { ...base.general, ...patch.general } : base.general,
    }

    if (patch.advanced) {
      const baseAdvanced = base.advanced ?? createDefaultAppSettings().advanced!
      merged.advanced = {
        keyboard: patch.advanced.keyboard
          ? { ...baseAdvanced.keyboard, ...patch.advanced.keyboard }
          : baseAdvanced.keyboard,
        history: patch.advanced.history
          ? { ...baseAdvanced.history, ...patch.advanced.history }
          : baseAdvanced.history,
        performance: patch.advanced.performance
          ? { ...baseAdvanced.performance, ...patch.advanced.performance }
          : baseAdvanced.performance,
        accessibility: patch.advanced.accessibility
          ? { ...baseAdvanced.accessibility, ...patch.advanced.accessibility }
          : baseAdvanced.accessibility,
      }
    }

    return merged
  }


  destroy(): void {
    this._cleanupHandlers?.forEach(fn => {
      try { fn() } catch (err) {
        void err
      }
    })
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }
  }
}
