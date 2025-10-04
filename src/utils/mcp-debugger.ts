/* *
 * MCP (Model Context Protocol) 调试工具
 * 提供实时性能监控、状态追踪、错误诊断等开发辅助功能 */

import { invoke } from './tauri.js'

export interface MCPPerformanceStats {
  totalCalculations: number
  totalCalculationTimeMs: number
  peakMemoryUsageMb: number
  errorCount: number
  lastUpdate: number
  averageCalculationTimeMs: number
}

export type MCPDebugEventType = 
  | 'StateChanged'
  | 'ExpressionParsed'
  | 'CalculationExecuted'
  | 'ErrorOccurred'
  | 'PerformanceMetrics'
  | 'button-click'
  | 'keydown'
  | 'panel-open'
  | 'panel-close'
  | 'panel-switch'
  | 'input-start'
  | 'error-displayed'

export interface MCPDebugEvent {
  type: MCPDebugEventType | string
  timestamp: number
  target?: string
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

export interface MCPStateRecord {
  expression: string
  result: string
  memory: string
  error?: string
  timestamp: string
}

export interface MCPPerformanceRecord {
  operation: string
  duration: number
  memoryUsage?: number
  timestamp: string
}

export interface MCPErrorRecord {
  type: string
  message: string
  stack?: string
  context?: Record<string, unknown>
  timestamp: string
}

export interface MCPDebugSnapshot {
  timestamp: string
  states: MCPStateRecord[]
  performance: MCPPerformanceRecord[]
  errors: MCPErrorRecord[]
  events: MCPDebugEvent[]
  system: {
    userAgent: string
    timestamp: string
    url: string
  }
}

export interface MCPPerformanceMetrics {
  [operation: string]: {
    count: number
    average: number
    min: number
    max: number
    total: number
  }
}

/* *
 * MCP 调试器类 */
export class MCPDebugger {
  private isEnabled: boolean = false
  private statsUpdateInterval: number | null = null
  private eventCallbacks: Map<string, ((data: unknown) => void)[]> = new Map()
  
  // 本地调试数据存储
  private states: MCPStateRecord[] = []
  private performanceRecords: MCPPerformanceRecord[] = []
  private errorRecords: MCPErrorRecord[] = []
  private eventRecords: MCPDebugEvent[] = []
  
  // 存储限制
  private readonly MAX_STATES = 100
  private readonly MAX_PERFORMANCE = 200
  private readonly MAX_ERRORS = 50
  private readonly MAX_EVENTS = 100

  constructor() {
    this.isEnabled = import.meta.env.DEV // 开发环境下默认启用
  }

  /* *
   * 启用/禁用调试功能 */
  async setEnabled(enabled: boolean): Promise<void> {
    this.isEnabled = enabled

    if (enabled) {
      // 启动性能监控
      this.startPerformanceMonitoring()
      console.log('🔧 MCP 调试器已启用')
    } else {
      // 停止性能监控
      this.stopPerformanceMonitoring()
      console.log('🔧 MCP 调试器已禁用')
    }

    try {
      await invoke('set_mcp_debugging', { enabled })
    } catch (error) {
      console.warn('设置后端MCP调试状态失败:', error)
    }
  }

  /* *
   * 获取性能统计数据 */
  async getPerformanceStats(): Promise<MCPPerformanceStats | null> {
    if (!this.isEnabled) return null

    try {
      const stats = await invoke<MCPPerformanceStats>('get_mcp_performance_stats')
      return stats
    } catch (error) {
      console.warn('获取MCP性能统计失败:', error)
      return null
    }
  }

  /* *
   * 启动性能监控 */
  private startPerformanceMonitoring(): void {
    if (this.statsUpdateInterval) return

    this.statsUpdateInterval = window.setInterval(async () => {
      const stats = await this.getPerformanceStats()
      if (stats) {
        this.emitEvent('performance-update', stats)
      }
    }, 2000) // 每2秒更新一次
  }

  /* *
   * 停止性能监控 */
  private stopPerformanceMonitoring(): void {
    if (this.statsUpdateInterval) {
      clearInterval(this.statsUpdateInterval)
      this.statsUpdateInterval = null
    }
  }

  /* *
   * 监听调试事件 */
  on(eventType: string, callback: (data: unknown) => void): void {
    if (!this.eventCallbacks.has(eventType)) {
      this.eventCallbacks.set(eventType, [])
    }
    this.eventCallbacks.get(eventType)!.push(callback)
  }

  /* *
   * 移除事件监听器 */
  off(eventType: string, callback: (data: unknown) => void): void {
    const callbacks = this.eventCallbacks.get(eventType)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /* *
   * 发出调试事件 */
  private emitEvent(eventType: string, data: unknown): void {
    const callbacks = this.eventCallbacks.get(eventType)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('MCP事件回调执行失败:', error)
        }
      })
    }
  }

  /* *
   * 记录前端状态变化 */
  trackFrontendState(state: {
    expression: string
    result: string
    memory: string
    error?: string
  }): void {
    if (!this.isEnabled) return

    const record: MCPStateRecord = {
      ...state,
      timestamp: new Date().toISOString(),
    }

    this.states.unshift(record)
    if (this.states.length > this.MAX_STATES) {
      this.states = this.states.slice(0, this.MAX_STATES)
    }

    console.debug('📊 [MCP] 前端状态变化:', state)
    this.emitEvent('frontend-state-change', record)
  }

  /* *
   * 记录前端性能指标 */
  trackFrontendPerformance(metrics: {
    operation: string
    duration: number
    memoryUsage?: number
  }): void {
    if (!this.isEnabled) return

    const record: MCPPerformanceRecord = {
      ...metrics,
      timestamp: new Date().toISOString(),
    }

    this.performanceRecords.unshift(record)
    if (this.performanceRecords.length > this.MAX_PERFORMANCE) {
      this.performanceRecords = this.performanceRecords.slice(0, this.MAX_PERFORMANCE)
    }

    console.debug('⚡ [MCP] 前端性能:', metrics)
    this.emitEvent('frontend-performance', record)
  }

  /* *
   * 记录前端错误 */
  trackFrontendError(error: {
    type: string
    message: string
    stack?: string
    context?: Record<string, unknown>
  }): void {
    if (!this.isEnabled) return

    const record: MCPErrorRecord = {
      ...error,
      timestamp: new Date().toISOString(),
    }

    this.errorRecords.unshift(record)
    if (this.errorRecords.length > this.MAX_ERRORS) {
      this.errorRecords = this.errorRecords.slice(0, this.MAX_ERRORS)
    }

    console.error('❌ [MCP] 前端错误:', error)
    this.emitEvent('frontend-error', record)
  }

  /* *
   * 记录事件 */
  trackEvent(event: {
    type: string
    target?: string
    metadata?: Record<string, unknown>
  }): void {
    if (!this.isEnabled) return

    const record: MCPDebugEvent = {
      type: event.type,
      timestamp: Date.now(),
    }

    if (event.target !== undefined) {
      record.target = event.target
    }

    if (event.metadata !== undefined) {
      record.metadata = event.metadata
    }

    this.eventRecords.unshift(record)
    if (this.eventRecords.length > this.MAX_EVENTS) {
      this.eventRecords = this.eventRecords.slice(0, this.MAX_EVENTS)
    }

    console.debug('🎯 [MCP] 事件:', event)
    this.emitEvent('event-tracked', record)
  }

  /* *
   * 获取调试数据快照 */
  getDebugSnapshot(): MCPDebugSnapshot {
    return {
      timestamp: new Date().toISOString(),
      states: [...this.states],
      performance: [...this.performanceRecords],
      errors: [...this.errorRecords],
      events: [...this.eventRecords],
      system: {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      },
    }
  }

  /* *
   * 获取性能统计 */
  getPerformanceMetrics(): MCPPerformanceMetrics {
    const metrics: MCPPerformanceMetrics = {}

    for (const record of this.performanceRecords) {
      const { operation, duration } = record
      
      if (!metrics[operation]) {
        metrics[operation] = {
          count: 0,
          average: 0,
          min: Infinity,
          max: -Infinity,
          total: 0,
        }
      }

      const metric = metrics[operation]
      metric.count++
      metric.total += duration
      metric.min = Math.min(metric.min, duration)
      metric.max = Math.max(metric.max, duration)
      metric.average = metric.total / metric.count
    }

    return metrics
  }

  /* *
   * 清除所有调试数据 */
  clearDebugData(): void {
    this.states = []
    this.performanceRecords = []
    this.errorRecords = []
    this.eventRecords = []
    
    console.log('🧹 [MCP] 调试数据已清除')
  }

  /* *
   * 创建性能监控装饰器 */
  createPerformanceDecorator(operationName: string) {
    return (target: unknown, propertyName: string, descriptor: PropertyDescriptor) => {
      const method = descriptor.value

      descriptor.value = async function (...args: unknown[]) {
        if (!mcpDebugger.isEnabled) {
          return method.apply(this, args)
        }

        const startTime = performance.now()

        try {
          const result = await method.apply(this, args)
          const duration = performance.now() - startTime

          mcpDebugger.trackFrontendPerformance({
            operation: `${(target as { constructor: { name: string } }).constructor.name}.${propertyName}`,
            duration,
          })

          return result
        } catch (error) {
          const duration = performance.now() - startTime

          mcpDebugger.trackFrontendError({
            type: 'MethodError',
            message: error instanceof Error ? error.message : String(error),
            ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
            context: {
              className: (target as { constructor: { name: string } }).constructor.name,
              methodName: propertyName,
              operationName,
              duration,
              args: args.length,
            },
          })

          throw error
        }
      }
    }
  }

  /* *
   * 销毁调试器 */
  destroy(): void {
    this.stopPerformanceMonitoring()
    this.eventCallbacks.clear()
    console.log('🔧 MCP 调试器已销毁')
  }
}

// 创建全局调试器实例
export const mcpDebugger = new MCPDebugger()

// 开发环境下自动启用
if (import.meta.env.DEV) {
  mcpDebugger.setEnabled(true)

  // 在控制台提供全局访问
  ;(window as unknown as Record<string, unknown>).mcpDebugger = mcpDebugger

  // 提供便捷的调试命令
  ;(window as unknown as Record<string, unknown>).mcpStats = () => mcpDebugger.getPerformanceStats()
  ;(window as unknown as Record<string, unknown>).mcpEnable = () => mcpDebugger.setEnabled(true)
  ;(window as unknown as Record<string, unknown>).mcpDisable = () => mcpDebugger.setEnabled(false)

  console.log('🔧 MCP 调试器已加载，可使用以下命令：')
  console.log('  mcpStats() - 查看性能统计')
  console.log('  mcpEnable() - 启用调试')
  console.log('  mcpDisable() - 禁用调试')
}

// 便捷函数导出
export const trackState = (state: {
  expression: string
  result: string
  memory: string
  error?: string
}) => mcpDebugger.trackFrontendState(state)

export const trackPerformance = (metrics: {
  operation: string
  duration: number
  memoryUsage?: number
}) => mcpDebugger.trackFrontendPerformance(metrics)

export const trackError = (error: {
  type: string
  message: string
  stack?: string
  context?: Record<string, unknown>
}) => mcpDebugger.trackFrontendError(error)

export const trackEvent = (event: {
  type: string
  target?: string
  metadata?: Record<string, unknown>
}) => mcpDebugger.trackEvent(event)

export const getDebugSnapshot = () => mcpDebugger.getDebugSnapshot()

export const clearDebugData = () => mcpDebugger.clearDebugData()

export const getPerformanceMetrics = () => mcpDebugger.getPerformanceMetrics()

/* *
 * 性能监控装饰器
 * 使用方法：@性能 (performance)('操作名称') */
export const Performance = (operationName: string) =>
  mcpDebugger.createPerformanceDecorator(operationName)
