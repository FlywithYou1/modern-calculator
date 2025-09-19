/**
 * Tauri API 服务包装器
 * 提供类型安全的前端与后端通信接口
 */

import { invoke } from '@tauri-apps/api/core'
import type { HistoryItem } from '../types/calculator'

// 与后端保持一致的结果类型
export interface CalculationResult {
  success: boolean
  result?: string
  error?: string
  warnings?: string[]
}

// 重新导出 invoke 函数以供其他模块使用
export { invoke }

export class TauriService {
  /**
   * 初始化服务（为了兼容性保留）
   */
  static async init(): Promise<void> {
    // 静态方法不需要初始化
  }

  /**
   * 执行数学计算
   */
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

  /**
   * 返回原始计算结果对象
   */
  static async calculateRaw(expression: string): Promise<CalculationResult> {
    return invoke<CalculationResult>('calculate', { expression })
  }

  /**
   * 获取历史记录
   */
  static async getHistory(limit?: number): Promise<HistoryItem[]> {
    try {
      const history = await invoke<HistoryItem[]>('get_history', { limit })
      return history
    } catch (error) {
      console.error('获取历史记录失败:', error)
      return []
    }
  }

  /**
   * 保存历史记录到存储
   */
  static async saveHistory(): Promise<void> {
    try {
      await invoke<void>('save_history')
    } catch (error) {
      console.error('保存历史记录失败:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /**
   * 清空历史记录
   */
  static async clearHistory(): Promise<void> {
    try {
      await invoke<void>('clear_history')
    } catch (error) {
      console.error('清空历史记录失败:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /**
   * 更新历史记录项
   */
  static async updateHistoryItem(id: string, tags?: string[]): Promise<void> {
    try {
      await invoke<void>('update_history_item', { id, tags })
    } catch (error) {
      console.error('更新历史记录失败:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /**
   * 搜索历史记录
   */
  static async searchHistory(query: string): Promise<HistoryItem[]> {
    try {
      const results = await invoke<HistoryItem[]>('search_history', { query })
      return results
    } catch (error) {
      console.error('搜索历史记录失败:', error)
      return []
    }
  }

  /**
   * 获取历史记录统计信息
   */
  static async getHistoryStats(): Promise<Record<string, number>> {
    try {
      const stats = await invoke<Record<string, number>>('get_history_stats')
      return stats
    } catch (error) {
      console.error('获取历史统计失败:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /**
   * 导出历史记录
   */
  static async exportHistory(): Promise<string> {
    try {
      const data = await invoke<string>('export_history')
      return data
    } catch (error) {
      console.error('导出历史记录失败:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /**
   * 导入历史记录
   */
  static async importHistory(json: string): Promise<void> {
    try {
      await invoke<void>('import_history', { jsonData: json })
    } catch (error) {
      console.error('导入历史记录失败:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /**
   * 获取应用设置
   */
  static async getSettings(): Promise<unknown> {
    try {
      const settings = await invoke<unknown>('get_settings')
      return settings
    } catch (error) {
      console.error('获取设置失败:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /**
   * 保存应用设置
   */
  static async saveSettings(settings: unknown): Promise<void> {
    try {
      await invoke<void>('save_settings', { settings })
    } catch (error) {
      console.error('保存设置失败:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /**
   * 设置主题
   */
  static async setTheme(themeName: string): Promise<void> {
    try {
      await invoke<void>('set_theme', { themeName })
    } catch (error) {
      console.error('设置主题失败:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /**
   * 添加自定义主题
   */
  static async addCustomTheme(themeName: string, themeData: unknown): Promise<void> {
    try {
      await invoke<void>('add_custom_theme', { themeName, themeData })
    } catch (error) {
      console.error('添加自定义主题失败:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /**
   * 删除自定义主题
   */
  static async removeCustomTheme(themeName: string): Promise<void> {
    try {
      await invoke<void>('remove_custom_theme', { themeName })
    } catch (error) {
      console.error('删除自定义主题失败:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /**
   * 获取可用主题列表
   */
  static async getAvailableThemes(): Promise<string[]> {
    try {
      const themes = await invoke<string[]>('get_available_themes')
      return themes
    } catch (error) {
      console.error('获取主题列表失败:', error)
      return []
    }
  }

  /**
   * 更新显示设置
   */
  static async updateDisplaySettings(settings: unknown): Promise<void> {
    try {
      await invoke<void>('update_display_settings', { settings })
    } catch (error) {
      console.error('更新显示设置失败:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /**
   * 更新布局设置
   */
  static async updateLayoutSettings(settings: unknown): Promise<void> {
    try {
      await invoke<void>('update_layout_settings', { settings })
    } catch (error) {
      console.error('更新布局设置失败:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /**
   * 重置设置为默认值
   */
  static async resetSettings(): Promise<void> {
    try {
      await invoke<void>('reset_settings')
    } catch (error) {
      console.error('重置设置失败:', error)
      throw new Error(error as string)
    }
  }

  /**
   * 触发触觉反馈
   */
  static async triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
    try {
      // 在实际实现中，这里会调用平台特定的触觉反馈 API
      console.log('触觉反馈:', type)
    } catch (error) {
      console.warn('触觉反馈失败:', error)
    }
  }

  /**
   * 检查 Tauri 环境
   */
  static isTauriEnvironment(): boolean {
    return typeof window !== 'undefined' && '__TAURI__' in window
  }
}
