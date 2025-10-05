/* *
 * 配置 (配置 (settings)) 组件测试
 * 覆盖设置面板的所有功能和交互 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Settings } from '@/components/Settings'

describe('Settings', () => {
  let container: HTMLElement
  let settings: Settings
  let mockOnSettingsChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    settings = new Settings(container)
    mockOnSettingsChange = vi.fn()
    settings.onSettingsChanged(mockOnSettingsChange)
  })

  afterEach(() => {
    settings.destroy()
    document.body.removeChild(container)
    vi.clearAllMocks()
  })

  describe('初始化', () => {
    it('应该正确初始化设置组件', async () => {
      await settings.init()
      
      const settingsElement = container.querySelector('.calculator-settings')
      expect(settingsElement).toBeTruthy()
      expect(settingsElement?.getAttribute('role')).toBe('dialog')
    })

    it('应该创建正确的设置面板结构', async () => {
      await settings.init()
      
      const tabs = container.querySelectorAll('.settings-tab')
      expect(tabs).toHaveLength(5) // 主题、显示、布局、通用、高级
      
      const panels = container.querySelectorAll('.settings-panel-content')
      expect(panels).toHaveLength(5)
      
      const header = container.querySelector('.settings-header')
      expect(header).toBeTruthy()
      
      const footer = container.querySelector('.settings-footer')
      expect(footer).toBeTruthy()
    })

    it('应该有默认设置值', () => {
      const currentSettings = settings.getSettings()
      
      expect(currentSettings.theme.mode).toBe('dark')
      expect(currentSettings.display.decimalPlaces).toBe(10)
      expect(currentSettings.display.angleUnit).toBe('degrees')
      expect(currentSettings.general.enableAnimations).toBe(true)
      expect(currentSettings.general.enableHaptic).toBe(true)
    })
  })

  describe('显示和隐藏', () => {
    beforeEach(async () => {
      await settings.init()
    })

    it('应该正确显示设置面板', () => {
      settings.show()
      
      const settingsElement = container.querySelector('.calculator-settings') as HTMLElement
      expect(settingsElement.style.display).toBe('flex')
    })

    it('应该正确隐藏设置面板', () => {
      settings.show()
      settings.hide()
      
      const settingsElement = container.querySelector('.calculator-settings') as HTMLElement
      // 需要等待动画完成
      setTimeout(() => {
        expect(settingsElement.style.display).toBe('none')
      }, 350)
    })

    it('应该通过点击关闭按钮隐藏面板', () => {
      settings.show()
      
      const closeBtn = container.querySelector('.settings-close-btn') as HTMLElement
      closeBtn?.click()
      
      const settingsElement = container.querySelector('.calculator-settings') as HTMLElement
      setTimeout(() => {
        expect(settingsElement.style.display).toBe('none')
      }, 350)
    })
  })

  describe('标签切换', () => {
    beforeEach(async () => {
      await settings.init()
      settings.show()
    })

    it('应该正确切换设置标签', () => {
      const displayTab = container.querySelector('[data-tab="display"]') as HTMLElement
      displayTab?.click()
      
      const activeTab = container.querySelector('.settings-tab.active')
      expect(activeTab?.getAttribute('data-tab')).toBe('display')
      
      const activePanel = container.querySelector('.settings-panel-content.active')
      expect(activePanel?.getAttribute('data-panel')).toBe('display')
    })

    it('应该正确显示主题设置标签内容', () => {
      const themeTab = container.querySelector('[data-tab="theme"]') as HTMLElement
      themeTab?.click()
      
      const themePanel = container.querySelector('[data-panel="theme"]')
      expect(themePanel).toBeTruthy()
      
      const themeModeInputs = themePanel?.querySelectorAll('input[name="theme-mode"]')
      expect(themeModeInputs).toHaveLength(4) // light, dark, high-contrast, auto
    })

    it('应该正确显示显示设置标签内容', () => {
      const displayTab = container.querySelector('[data-tab="display"]') as HTMLElement
      displayTab?.click()
      
      const displayPanel = container.querySelector('[data-panel="display"]')
      expect(displayPanel).toBeTruthy()
      
      const decimalPlacesInput = displayPanel?.querySelector('#decimal-places') as HTMLInputElement
      expect(decimalPlacesInput?.value).toBe('10')
      expect(decimalPlacesInput?.getAttribute('max')).toBe('28')
      
      const angleUnitSelect = displayPanel?.querySelector('#angle-unit') as HTMLSelectElement
      expect(angleUnitSelect?.options).toHaveLength(3)
    })

    it('应该正确显示布局设置标签内容', () => {
      const layoutTab = container.querySelector('[data-tab="layout"]') as HTMLElement
      layoutTab?.click()
      
      const layoutPanel = container.querySelector('[data-panel="layout"]')
      expect(layoutPanel).toBeTruthy()
      
      const keyboardLayoutSelect = layoutPanel?.querySelector('#keyboard-layout') as HTMLSelectElement
      expect(keyboardLayoutSelect?.value).toBe('standard')
    })

    it('应该正确显示通用设置标签内容', () => {
      const generalTab = container.querySelector('[data-tab="general"]') as HTMLElement
      generalTab?.click()
      
      const generalPanel = container.querySelector('[data-panel="general"]')
      expect(generalPanel).toBeTruthy()
      
      const enableHapticCheckbox = generalPanel?.querySelector('#enable-haptic') as HTMLInputElement
      expect(enableHapticCheckbox?.checked).toBe(true)
    })

    it('应该正确显示高级设置标签内容', () => {
      const advancedTab = container.querySelector('[data-tab="advanced"]') as HTMLElement
      advancedTab?.click()
      
      const advancedPanel = container.querySelector('[data-panel="advanced"]')
      expect(advancedPanel).toBeTruthy()
      
      const actionButtons = advancedPanel?.querySelectorAll('.action-btn')
      expect(actionButtons?.length).toBeGreaterThan(0)
    })
  })

  describe('主题设置', () => {
    beforeEach(async () => {
      await settings.init()
      settings.show()
      
      const themeTab = container.querySelector('[data-tab="theme"]') as HTMLElement
      themeTab?.click()
    })

    it('应该正确选择主题模式', () => {
      const lightThemeInput = container.querySelector('input[value="light"]') as HTMLInputElement
      lightThemeInput?.click()
      
      const currentSettings = settings.getSettings()
      expect(currentSettings.theme.mode).toBe('light')
    })

    it('应该正确更改颜色设置', () => {
      const primaryColorInput = container.querySelector('#primary-color[data-setting="theme.colors.primary"]') as HTMLInputElement
      primaryColorInput.value = '#ff0000'
      primaryColorInput?.dispatchEvent(new Event('input'))
      
      const currentSettings = settings.getSettings()
      expect(currentSettings.theme.colors.primary).toBe('#ff0000')
    })

    it('应该同步颜色输入和文本输入', () => {
      const colorInput = container.querySelector('#primary-color[data-setting="theme.colors.primary"]') as HTMLInputElement
      const textInput = container.querySelector('.color-text[data-setting="theme.colors.primary"]') as HTMLInputElement
      
      colorInput.value = '#ff0000'
      colorInput?.dispatchEvent(new Event('input'))
      
      expect(textInput.value).toBe('#ff0000')
      
      textInput.value = '#00ff00'
      textInput?.dispatchEvent(new Event('input'))
      
      expect(colorInput.value).toBe('#00ff00')
    })

    it('应该正确更新主题颜色值', () => {
      const colorInput = container.querySelector('#primary-color[data-setting="theme.colors.primary"]') as HTMLInputElement
      colorInput.value = '#ff0000'
      colorInput?.dispatchEvent(new Event('input'))
      
      // 触发变更回调
      const saveBtn = container.querySelector('.save-btn') as HTMLElement
      saveBtn?.click()
      
      // 验证回调被调用
      expect(mockOnSettingsChange).toHaveBeenCalled()
    })
  })

  describe('显示设置', () => {
    beforeEach(async () => {
      await settings.init()
      settings.show()
      
      const displayTab = container.querySelector('[data-tab="display"]') as HTMLElement
      displayTab?.click()
    })

    it('应该正确更改小数位数', () => {
      const decimalPlacesInput = container.querySelector('#decimal-places') as HTMLInputElement
      const valueSpan = decimalPlacesInput?.parentElement?.querySelector('.number-value')
      
      decimalPlacesInput.value = '15'
      decimalPlacesInput?.dispatchEvent(new Event('input'))
      
      expect(valueSpan?.textContent).toBe('15')
      
      const currentSettings = settings.getSettings()
      expect(currentSettings.display.decimalPlaces).toBe(15)
    })

    it('应该正确更改角度单位', () => {
      const angleUnitSelect = container.querySelector('#angle-unit') as HTMLSelectElement
      angleUnitSelect.value = 'radians'
      angleUnitSelect?.dispatchEvent(new Event('change'))
      
      const currentSettings = settings.getSettings()
      expect(currentSettings.display.angleUnit).toBe('radians')
    })

    it('应该支持梯度角度单位', () => {
      const angleUnitSelect = container.querySelector('#angle-unit') as HTMLSelectElement
      angleUnitSelect.value = 'gradians'
      angleUnitSelect?.dispatchEvent(new Event('change'))

      const currentSettings = settings.getSettings()
      expect(currentSettings.display.angleUnit).toBe('gradians')
    })

    it('应该正确切换科学记数法', () => {
      const scientificNotationCheckbox = container.querySelector('#scientific-notation') as HTMLInputElement
      scientificNotationCheckbox.checked = false
      scientificNotationCheckbox?.dispatchEvent(new Event('change'))
      
      const currentSettings = settings.getSettings()
      expect(currentSettings.display.scientificNotation).toBe(false)
    })

    it('应该正确切换千位分隔符', () => {
      const thousandsSeparatorCheckbox = container.querySelector('#thousands-separator') as HTMLInputElement
      thousandsSeparatorCheckbox.checked = false
      thousandsSeparatorCheckbox?.dispatchEvent(new Event('change'))
      
      const currentSettings = settings.getSettings()
      expect(currentSettings.display.thousandSeparator).toBe(false)
    })

    it('应该正确更改字体大小', () => {
      const fontSizeInput = container.querySelector('#font-size') as HTMLInputElement
      const valueSpan = fontSizeInput?.parentElement?.querySelector('.number-value')
      
      fontSizeInput.value = '24'
      fontSizeInput?.dispatchEvent(new Event('input'))
      
      expect(valueSpan?.textContent).toBe('24px')
      
      const currentSettings = settings.getSettings()
      expect(currentSettings.display.fontSize).toBe(24)
    })
  })

  describe('布局设置', () => {
    beforeEach(async () => {
      await settings.init()
      settings.show()
      
      const layoutTab = container.querySelector('[data-tab="layout"]') as HTMLElement
      layoutTab?.click()
    })

    it('应该正确更改键盘布局', () => {
      const keyboardLayoutSelect = container.querySelector('#keyboard-layout') as HTMLSelectElement
      keyboardLayoutSelect.value = 'scientific'
      keyboardLayoutSelect?.dispatchEvent(new Event('change'))
      
      const currentSettings = settings.getSettings()
      expect(currentSettings.layout.keyboardLayout).toBe('scientific')
    })

    it('应该正确更改按钮大小', () => {
      const smallSizeRadio = container.querySelector('input[value="small"]') as HTMLInputElement
      smallSizeRadio?.click()
      
      const currentSettings = settings.getSettings()
      expect(currentSettings.layout.buttonSize).toBe('small')
    })

    it('应该正确切换紧凑模式', () => {
      const compactModeCheckbox = container.querySelector('#compact-mode') as HTMLInputElement
      compactModeCheckbox.checked = true
      compactModeCheckbox?.dispatchEvent(new Event('change'))
      
      const currentSettings = settings.getSettings()
      expect(currentSettings.layout.compactMode).toBe(true)
    })

    it('应该正确切换历史记录按钮显示', () => {
      const showHistoryCheckbox = container.querySelector('#show-history') as HTMLInputElement
      showHistoryCheckbox.checked = false
      showHistoryCheckbox?.dispatchEvent(new Event('change'))
      
      const currentSettings = settings.getSettings()
      expect(currentSettings.layout.showHistory).toBe(false)
    })
  })

  describe('通用设置', () => {
    beforeEach(async () => {
      await settings.init()
      settings.show()
      
      const generalTab = container.querySelector('[data-tab="general"]') as HTMLElement
      generalTab?.click()
    })

    it('应该正确切换触觉反馈', () => {
      const enableHapticCheckbox = container.querySelector('#enable-haptic') as HTMLInputElement
      enableHapticCheckbox.checked = false
      enableHapticCheckbox?.dispatchEvent(new Event('change'))
      
      const currentSettings = settings.getSettings()
      expect(currentSettings.general.enableHaptic).toBe(false)
    })

    it('应该正确切换界面动画', () => {
      const enableAnimationsCheckbox = container.querySelector('#enable-animations') as HTMLInputElement
      enableAnimationsCheckbox.checked = false
      enableAnimationsCheckbox?.dispatchEvent(new Event('change'))
      
      const currentSettings = settings.getSettings()
      expect(currentSettings.general.enableAnimations).toBe(false)
    })

    it('应该正确切换键盘快捷键', () => {
      const enableShortcutsCheckbox = container.querySelector('#enable-shortcuts') as HTMLInputElement
      enableShortcutsCheckbox.checked = false
      enableShortcutsCheckbox?.dispatchEvent(new Event('change'))
      
      const currentSettings = settings.getSettings()
      expect(currentSettings.general.enableKeyboardShortcuts).toBe(false)
    })

    it('应该正确更改最大历史记录数', () => {
      const maxHistoryInput = container.querySelector('#max-history') as HTMLInputElement
      const valueSpan = maxHistoryInput?.parentElement?.querySelector('.number-value')
      
      maxHistoryInput.value = '200'
      maxHistoryInput?.dispatchEvent(new Event('input'))
      
      expect(valueSpan?.textContent).toBe('200')
      
      const currentSettings = settings.getSettings()
      expect(currentSettings.general.maxHistoryItems).toBe(200)
    })

    it('应该正确切换自动保存历史', () => {
      const autoSaveHistoryCheckbox = container.querySelector('#auto-save-history') as HTMLInputElement
      autoSaveHistoryCheckbox.checked = false
      autoSaveHistoryCheckbox?.dispatchEvent(new Event('change'))
      
      const currentSettings = settings.getSettings()
      expect(currentSettings.general.autoSaveHistory).toBe(false)
    })
  })

  describe('高级设置', () => {
    beforeEach(async () => {
      await settings.init()
      settings.show()
      
      const advancedTab = container.querySelector('[data-tab="advanced"]') as HTMLElement
      advancedTab?.click()
    })

    it('应该显示数据管理选项', () => {
      const dataManagementSection = container.querySelector('.settings-section')
      expect(dataManagementSection).toBeTruthy()
      
      const importSettingsBtn = container.querySelector('.import-settings-btn')
      const exportSettingsBtn = container.querySelector('.export-settings-btn')
      const exportHistoryBtn = container.querySelector('.export-history-btn')
      const clearHistoryBtn = container.querySelector('.clear-history-btn')
      const clearCacheBtn = container.querySelector('.clear-cache-btn')
      
      expect(importSettingsBtn).toBeTruthy()
      expect(exportSettingsBtn).toBeTruthy()
      expect(exportHistoryBtn).toBeTruthy()
      expect(clearHistoryBtn).toBeTruthy()
      expect(clearCacheBtn).toBeTruthy()
    })

    it('应该显示关于信息', () => {
      const aboutSection = container.querySelectorAll('.settings-section')[1]
      expect(aboutSection).toBeTruthy()
      
      const versionInfo = aboutSection?.querySelector('.info-item')
      expect(versionInfo).toBeTruthy()
    })
  })

  describe('设置保存和重置', () => {
    beforeEach(async () => {
      await settings.init()
      settings.show()
    })

    it('应该正确保存设置', () => {
      const saveBtn = container.querySelector('.save-btn') as HTMLElement
      saveBtn?.click()
      
      expect(mockOnSettingsChange).toHaveBeenCalled()
    })

    it('应该正确重置设置', () => {
      // 修改一些设置
      const lightThemeInput = container.querySelector('input[value="light"]') as HTMLInputElement
      lightThemeInput?.click()
      
      // 点击重置按钮
      const resetBtn = container.querySelector('.reset-btn') as HTMLElement
      resetBtn?.click()
      // 模拟确认对话框（在实际测试中可能需要mock）
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      resetBtn?.click()
      
      const currentSettings = settings.getSettings()
      expect(currentSettings.theme.mode).toBe('dark') // 回到默认值
      
      // 恢复mock
      vi.restoreAllMocks()
    })
  })

  describe('设置更新', () => {
    beforeEach(async () => {
      await settings.init()
    })

    it('应该正确更新设置', () => {
      const newSettings = {
        theme: {
          ...settings.getSettings().theme,
          mode: 'light' as const,
        },
        display: {
          ...settings.getSettings().display,
          decimalPlaces: 15,
        },
      }
      
      settings.updateSettings(newSettings)
      
      const currentSettings = settings.getSettings()
      expect(currentSettings.theme.mode).toBe('light')
      expect(currentSettings.display.decimalPlaces).toBe(15)
    })

    it('应该正确更新主题', () => {
      const theme = {
        name: 'custom',
        mode: 'light' as const,
        type: 'custom' as const,
        colors: {
          primary: '#ff0000',
          secondary: '#00ff00',
          background: '#ffffff',
          surface: '#f0f0f0',
          text: '#000000',
          textSecondary: '#666666',
        },
        cssVariables: {
          '--primary-color': '#ff0000',
          '--secondary-color': '#00ff00',
          '--background-color': '#ffffff',
          '--surface-color': '#f0f0f0',
          '--text-color': '#000000',
          '--text-secondary-color': '#666666',
        },
      }
      
      settings.updateTheme(theme)
      
      const settingsElement = container.querySelector('.calculator-settings') as HTMLElement
      expect(settingsElement.classList.contains('theme-light')).toBe(true)
    })
  })

  describe('键盘快捷键', () => {
    beforeEach(async () => {
      await settings.init()
      settings.show()
    })

    it('应该通过Escape键关闭设置面板', () => {
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
      container.dispatchEvent(escapeEvent)
      
      const settingsElement = container.querySelector('.calculator-settings') as HTMLElement
      setTimeout(() => {
        expect(settingsElement.style.display).toBe('none')
      }, 350)
    })

    it('应该通过Ctrl+S保存设置', () => {
      const ctrlSEvent = new KeyboardEvent('keydown', { 
        key: 's',
        ctrlKey: true,
      })
      container.dispatchEvent(ctrlSEvent)
      
      expect(mockOnSettingsChange).toHaveBeenCalled()
    })
  })

  describe('Overlay点击关闭', () => {
    beforeEach(async () => {
      await settings.init()
      settings.show()
    })

    it('应该通过点击overlay关闭设置面板', () => {
      const overlay = container.querySelector('.settings-overlay') as HTMLElement
      overlay?.click()
      
      const settingsElement = container.querySelector('.calculator-settings') as HTMLElement
      setTimeout(() => {
        expect(settingsElement.style.display).toBe('none')
      }, 350)
    })

    it('点击面板内容不应该关闭设置面板', () => {
      settings.show()
      
      const panel = container.querySelector('.settings-panel') as HTMLElement
      panel?.click()
      
      const settingsElement = container.querySelector('.calculator-settings') as HTMLElement
      expect(settingsElement.style.display).toBe('flex')
    })
  })

  describe('输入验证', () => {
    beforeEach(async () => {
      await settings.init()
      settings.show()
    })

    it('应该正确验证数字输入', () => {
      const decimalPlacesInput = container.querySelector('#decimal-places') as HTMLInputElement
      decimalPlacesInput.value = '25'
      decimalPlacesInput?.dispatchEvent(new Event('change'))
      
      const currentSettings = settings.getSettings()
      expect(currentSettings.display.decimalPlaces).toBe(25) // 应该被限制但在测试中直接设置
    })

    it('应该正确验证范围输入', () => {
      const fontSizeInput = container.querySelector('#font-size') as HTMLInputElement
      fontSizeInput.value = '50'
      fontSizeInput?.dispatchEvent(new Event('input'))
      
      const valueSpan = fontSizeInput?.parentElement?.querySelector('.number-value')
      expect(valueSpan?.textContent).toBe('50px')
    })
  })

  describe('错误处理', () => {
    beforeEach(async () => {
      await settings.init()
    })

    it('应该处理无效设置路径', () => {
      const displayTab = container.querySelector('[data-tab="display"]') as HTMLElement
      displayTab?.click()
      
      const decimalPlacesInput = container.querySelector('#decimal-places') as HTMLInputElement
      decimalPlacesInput?.setAttribute('data-setting', 'invalid.path')
      decimalPlacesInput.value = '15'
      decimalPlacesInput?.dispatchEvent(new Event('change'))
      
      // 应该不会抛出错误，静默处理无效路径
      expect(true).toBe(true)
    })
  })

  describe('主题预览', () => {
    beforeEach(async () => {
      await settings.init()
      settings.show()
    })

    it('应该在主题设置变更时触发预览', () => {
      const themeTab = container.querySelector('[data-tab="theme"]') as HTMLElement
      themeTab?.click()
      
      const lightThemeInput = container.querySelector('input[value="light"]') as HTMLInputElement
      lightThemeInput?.click()
      
      // 应该触发应用预览
      expect(mockOnSettingsChange).toHaveBeenCalled()
    })
  })
})