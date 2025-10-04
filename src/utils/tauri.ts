/* *
 * Tauri API 服务包装器
 * 提供类型安全的前端与后端通信接口 */

import { invoke } from '@tauri-apps/api/core'
import type { AppSettings, HistoryItem } from '../types/calculator'
import { createDefaultAppSettings } from './settings-defaults.js'

// 与后端保持一致的结果类型
export interface CalculationResult {
  success: boolean
  result?: string
  error?: string
  warnings?: string[]
}

type BackendSettingsDTO = {
  theme?: {
    name?: string
    mode?: string
    animationsEnabled?: boolean
    transparency?: number
    colors?: Record<string, string>
  }
  display?: {
    decimalPlaces?: number
    scientificNotation?: boolean
    thousandsSeparator?: boolean
    angleUnit?: 'degrees' | 'radians' | 'gradians'
    fontSize?: number
  }
  general?: {
    enableHaptic?: boolean
    enableHapticFeedback?: boolean
    maxHistoryItems?: number
    autoSaveHistory?: boolean
    autoSave?: boolean
    enableKeyboardShortcuts?: boolean
    enableAnimations?: boolean
  }
  layout?: {
    compactMode?: boolean
    showHistory?: boolean
    showMemory?: boolean
    buttonSize?: 'small' | 'medium' | 'large'
    keyboardLayout?: 'standard' | 'scientific' | 'programmer'
  }
}

// 重新导出 invoke 函数以供其他模块使用
export { invoke }

export class TauriService {
  /* *
   * 初始化服务（为了兼容性保留） */
  static async init(): Promise<void> {
    // 静态方法不需要初始化
  }

  /* *
   * 执行数学计算 */
  static async calculate(expression: string): Promise<string> {
    try {
      const res = await invoke<CalculationResult>('calculate', { expression })
      if (res.success && res.result != null) return res.result
      throw new Error(res.error || '计算失败')
    } catch (error) {
      console.error('计算错误:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /* *
   * 返回原始计算结果对象 */
  static async calculateRaw(expression: string): Promise<CalculationResult> {
    return invoke<CalculationResult>('calculate', { expression })
  }

  /* *
   * 获取历史记录 */
  static async getHistory(limit?: number): Promise<HistoryItem[]> {
    try {
      const history = await invoke<HistoryItem[]>('get_history', { limit })
      return history
    } catch (error) {
      console.error('获取历史记录失败:', error)
      return []
    }
  }

  /* *
   * 保存历史记录到存储 */
  static async saveHistory(): Promise<void> {
    try {
      await invoke<void>('save_history')
    } catch (error) {
      console.error('保存历史记录失败:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /* *
   * 清空历史记录 */
  static async clearHistory(): Promise<void> {
    try {
      await invoke<void>('clear_history')
    } catch (error) {
      console.error('清空历史记录失败:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /* *
   * 更新历史记录项 */
  static async updateHistoryItem(id: string, tags?: string[]): Promise<void> {
    try {
      await invoke<void>('update_history_item', { id, tags })
    } catch (error) {
      console.error('更新历史记录失败:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /* *
   * 搜索历史记录 */
  static async searchHistory(query: string): Promise<HistoryItem[]> {
    try {
      const results = await invoke<HistoryItem[]>('search_history', { query })
      return results
    } catch (error) {
      console.error('搜索历史记录失败:', error)
      return []
    }
  }

  /* *
   * 获取历史记录统计信息 */
  static async getHistoryStats(): Promise<Record<string, number>> {
    try {
      const stats = await invoke<Record<string, number>>('get_history_stats')
      return stats
    } catch (error) {
      console.error('获取历史统计失败:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /* *
   * 导出历史记录 */
  static async exportHistory(): Promise<string> {
    try {
      const data = await invoke<string>('export_history')
      return data
    } catch (error) {
      console.error('导出历史记录失败:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /* *
   * 导入历史记录 */
  static async importHistory(json: string): Promise<void> {
    try {
      await invoke<void>('import_history', { jsonData: json })
    } catch (error) {
      console.error('导入历史记录失败:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /* *
   * 新增历史记录条目（高级面板等自定义来源使用） */
  static async recordHistoryEntry(payload: {
    expression: string
    result: string
    tags?: string[]
    notes?: string
    metadata?: Record<string, unknown>
    source?: string
  }): Promise<HistoryItem> {
    try {
      const item = await invoke<HistoryItem>('record_history_entry', payload)
      return item
    } catch (error) {
      console.error('记录历史条目失败:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /* *
   * 获取应用设置 */
  static async getSettings(): Promise<AppSettings> {
    try {
      const payload = await invoke<BackendSettingsDTO>('get_settings')
      return TauriService.mergeSettings(payload)
    } catch (error) {
      console.error('获取设置失败:', error)
      return createDefaultAppSettings()
    }
  }

  /* *
   * 保存应用设置 */
  static async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await invoke<void>('save_settings', { settings })
    } catch (error) {
      console.error('保存设置失败:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /* *
   * 设置主题 */
  static async setTheme(themeName: string): Promise<void> {
    try {
      await invoke<void>('set_theme', { themeName })
    } catch (error) {
      console.error('设置主题失败:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /* *
   * 添加自定义主题 */
  static async addCustomTheme(themeName: string, themeData: unknown): Promise<void> {
    try {
      await invoke<void>('add_custom_theme', { themeName, themeData })
    } catch (error) {
      console.error('添加自定义主题失败:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /* *
   * 删除自定义主题 */
  static async removeCustomTheme(themeName: string): Promise<void> {
    try {
      await invoke<void>('remove_custom_theme', { themeName })
    } catch (error) {
      console.error('删除自定义主题失败:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /* *
   * 获取可用主题列表 */
  static async getAvailableThemes(): Promise<string[]> {
    try {
      const themes = await invoke<string[]>('get_available_themes')
      return themes
    } catch (error) {
      console.error('获取主题列表失败:', error)
      return []
    }
  }

  /* *
   * 更新显示设置 */
  static async updateDisplaySettings(settings: unknown): Promise<void> {
    try {
      await invoke<void>('update_display_settings', { settings })
    } catch (error) {
      console.error('更新显示设置失败:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /* *
   * 更新布局设置 */
  static async updateLayoutSettings(settings: unknown): Promise<void> {
    try {
      await invoke<void>('update_layout_settings', { settings })
    } catch (error) {
      console.error('更新布局设置失败:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /* *
   * 重置设置为默认值 */
  static async resetSettings(): Promise<void> {
    try {
      await invoke<void>('reset_settings')
    } catch (error) {
      console.error('重置设置失败:', error)
      throw new Error(error as string)
    }
  }

  /* *
   * 触发触觉反馈 */
  static async triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
    try {
      // 在实际实现中，这里会调用平台特定的触觉反馈 API
      console.log('触觉反馈:', type)
    } catch (error) {
      console.warn('触觉反馈失败:', error)
    }
  }

  /* *
   * 检查 Tauri 环境 */
  static isTauriEnvironment(): boolean {
    return (
      typeof window !== 'undefined' &&
      // 仅当 __TAURI__ 为对象且可用时才认为在 Tauri 环境
      typeof (window as typeof window & { __TAURI__?: unknown }).__TAURI__ === 'object' &&
      (window as typeof window & { __TAURI__?: unknown }).__TAURI__ !== null
    )
  }

  private static mergeSettings(payload: BackendSettingsDTO | null | undefined): AppSettings {
    const defaults = createDefaultAppSettings()
    if (!payload) return defaults

    const theme = payload.theme ?? {}
    const display = payload.display ?? {}
    const general = payload.general ?? {}
    const layout = payload.layout ?? {}

    const mergedTheme = {
      ...defaults.theme,
      name: theme.name ?? defaults.theme.name,
      mode: TauriService.mapThemeMode(theme.mode, defaults.theme.mode),
      cssVariables: { ...defaults.theme.cssVariables },
      colors: theme.colors ? { ...defaults.theme.colors, ...theme.colors } : defaults.theme.colors,
    }

    if (typeof theme.animationsEnabled === 'boolean') {
      defaults.general.enableAnimations = theme.animationsEnabled
    }

    const mergedDisplay = {
      ...defaults.display,
      decimalPlaces: typeof display.decimalPlaces === 'number' ? display.decimalPlaces : defaults.display.decimalPlaces,
      scientificNotation:
        typeof display.scientificNotation === 'boolean'
          ? display.scientificNotation
          : defaults.display.scientificNotation,
      thousandSeparator:
        typeof display.thousandsSeparator === 'boolean'
          ? display.thousandsSeparator
          : defaults.display.thousandSeparator,
      angleUnit: TauriService.mapAngleUnit(display.angleUnit, defaults.display.angleUnit),
      fontSize: typeof display.fontSize === 'number' ? display.fontSize : defaults.display.fontSize,
    }

    const mergedGeneral = {
      ...defaults.general,
      enableHaptic:
        typeof general.enableHaptic === 'boolean'
          ? general.enableHaptic
          : typeof general.enableHapticFeedback === 'boolean'
            ? general.enableHapticFeedback
            : defaults.general.enableHaptic,
      maxHistoryItems:
        typeof general.maxHistoryItems === 'number'
          ? general.maxHistoryItems
          : defaults.general.maxHistoryItems,
      autoSaveHistory:
        typeof general.autoSaveHistory === 'boolean'
          ? general.autoSaveHistory
          : typeof general.autoSave === 'boolean'
            ? general.autoSave
            : defaults.general.autoSaveHistory,
      enableKeyboardShortcuts:
        typeof general.enableKeyboardShortcuts === 'boolean'
          ? general.enableKeyboardShortcuts
          : defaults.general.enableKeyboardShortcuts,
      enableAnimations:
        typeof general.enableAnimations === 'boolean'
          ? general.enableAnimations
          : defaults.general.enableAnimations,
    }

    const mergedLayout = {
      ...defaults.layout,
      compactMode:
        typeof layout.compactMode === 'boolean' ? layout.compactMode : defaults.layout.compactMode,
      showHistory:
        typeof layout.showHistory === 'boolean' ? layout.showHistory : defaults.layout.showHistory,
      showMemory:
        typeof layout.showMemory === 'boolean' ? layout.showMemory : defaults.layout.showMemory,
      buttonSize: layout.buttonSize ?? defaults.layout.buttonSize,
      keyboardLayout: layout.keyboardLayout ?? defaults.layout.keyboardLayout,
    }

    return {
      ...defaults,
      theme: mergedTheme,
      display: mergedDisplay,
      general: mergedGeneral,
      layout: mergedLayout,
    }
  }

  private static mapThemeMode(value: string | undefined, fallback: AppSettings['theme']['mode']): AppSettings['theme']['mode'] {
    switch (value) {
      case 'light':
        return 'light'
      case 'dark':
        return 'dark'
      case 'auto':
        return 'auto'
      case 'high-contrast':
        return 'high-contrast'
      case undefined:
        return fallback
      default:
        return 'high-contrast'
    }
  }

  private static mapAngleUnit(
    value: 'degrees' | 'radians' | 'gradians' | undefined,
    fallback: AppSettings['display']['angleUnit']
  ): AppSettings['display']['angleUnit'] {
    return value ?? fallback
  }
}
