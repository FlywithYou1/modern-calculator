/* *
 * MCP 调试面板组件
 * 提供实时性能监控、状态可视化、错误分析和调试快照管理 */

import { mcpDebugger, getDebugSnapshot, clearDebugData, getPerformanceMetrics } from '../utils/mcp-debugger.js'
import type { MCPDebugSnapshot } from '../utils/mcp-debugger.js'

export interface MCPDebugPanelConfig {
  updateInterval?: number
  maxDataPoints?: number
  onClose?: () => void
}

export class MCPDebugPanel {
  private element: HTMLElement
  private config: MCPDebugPanelConfig
  private updateTimer: number | null = null
  private isVisible = false
  private chartData = {
    performance: [] as Array<{ timestamp: number; duration: number; operation: string }>,
    memory: [] as Array<{ timestamp: number; usage: number }>,
    errors: [] as Array<{ timestamp: number; count: number }>,
  }

  constructor(container: HTMLElement, config: MCPDebugPanelConfig = {}) {
    this.config = {
      updateInterval: 1000,
      maxDataPoints: 50,
      ...config,
    }
    this.element = this.createElement()
    container.appendChild(this.element)
    this.setupEventListeners()
  }

  /* *
   * 创建调试面板元素 */
  private createElement(): HTMLElement {
    const panel = document.createElement('div')
    panel.className = 'mcp-debug-panel'
    panel.setAttribute('role', 'dialog')
    panel.setAttribute('aria-label', 'MCP调试面板')
    panel.style.display = 'none'

    panel.innerHTML = `
      <div class="mcp-debug-backdrop">
        <div class="mcp-debug-container">
          <header class="mcp-debug-header">
            <div class="debug-title">
              <h2>🔧 MCP 调试面板</h2>
              <div class="debug-status">
                <span class="status-indicator" data-status="active"></span>
                <span class="status-text">实时监控中</span>
              </div>
            </div>
            <div class="debug-actions">
              <button class="debug-btn secondary" data-action="clear-data" aria-label="清除调试数据">
                🧹 清除数据
              </button>
              <button class="debug-btn secondary" data-action="export-snapshot" aria-label="导出调试快照">
                💾 导出快照
              </button>
              <button class="debug-btn secondary" data-action="import-snapshot" aria-label="导入调试快照">
                📁 导入快照
              </button>
              <button class="debug-close-btn" data-action="close" aria-label="关闭调试面板">
                ✕
              </button>
            </div>
          </header>

          <nav class="mcp-debug-tabs">
            <button class="debug-tab active" data-tab="overview">总览</button>
            <button class="debug-tab" data-tab="performance">性能</button>
            <button class="debug-tab" data-tab="states">状态</button>
            <button class="debug-tab" data-tab="errors">错误</button>
            <button class="debug-tab" data-tab="events">事件</button>
            <button class="debug-tab" data-tab="settings">设置</button>
          </nav>

          <main class="mcp-debug-content">
            <div class="debug-panel active" data-panel="overview">
              ${this.renderOverviewPanel()}
            </div>
            <div class="debug-panel" data-panel="performance">
              ${this.renderPerformancePanel()}
            </div>
            <div class="debug-panel" data-panel="states">
              ${this.renderStatesPanel()}
            </div>
            <div class="debug-panel" data-panel="errors">
              ${this.renderErrorsPanel()}
            </div>
            <div class="debug-panel" data-panel="events">
              ${this.renderEventsPanel()}
            </div>
            <div class="debug-panel" data-panel="settings">
              ${this.renderSettingsPanel()}
            </div>
          </main>
        </div>
      </div>
    `

    return panel
  }

  /* *
   * 渲染总览面板 */
  private renderOverviewPanel(): string {
    return `
      <div class="overview-grid">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-icon">📊</span>
            <span class="metric-title">性能概览</span>
          </div>
          <div class="metric-content">
            <div class="metric-item">
              <span class="metric-label">平均响应时间</span>
              <span class="metric-value" data-metric="avg-response-time">--ms</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">总计算次数</span>
              <span class="metric-value" data-metric="total-calculations">--</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">内存使用</span>
              <span class="metric-value" data-metric="memory-usage">--MB</span>
            </div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-icon">⚠️</span>
            <span class="metric-title">错误统计</span>
          </div>
          <div class="metric-content">
            <div class="metric-item">
              <span class="metric-label">总错误数</span>
              <span class="metric-value error" data-metric="total-errors">--</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">最近错误</span>
              <span class="metric-value" data-metric="last-error-time">--</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">错误率</span>
              <span class="metric-value" data-metric="error-rate">--%</span>
            </div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-icon">🎯</span>
            <span class="metric-title">用户交互</span>
          </div>
          <div class="metric-content">
            <div class="metric-item">
              <span class="metric-label">总交互次数</span>
              <span class="metric-value" data-metric="total-interactions">--</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">会话时长</span>
              <span class="metric-value" data-metric="session-duration">--分钟</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">活跃状态</span>
              <span class="metric-value success" data-metric="active-status">正常</span>
            </div>
          </div>
        </div>

        <div class="metric-card full-width">
          <div class="metric-header">
            <span class="metric-icon">📈</span>
            <span class="metric-title">实时性能图表</span>
          </div>
          <div class="chart-container">
            <canvas id="performance-chart" width="400" height="200"></canvas>
          </div>
        </div>
      </div>
    `
  }

  /* *
   * 渲染性能面板 */
  private renderPerformancePanel(): string {
    return `
      <div class="performance-container">
        <div class="performance-header">
          <h3>性能监控</h3>
          <div class="performance-controls">
            <button class="debug-btn small" data-action="refresh-performance">刷新</button>
            <button class="debug-btn small" data-action="clear-performance">清除</button>
          </div>
        </div>

        <div class="performance-metrics">
          <div class="metrics-grid">
            <div class="performance-card">
              <h4>计算性能</h4>
              <div class="performance-list" data-performance="calculations">
                <div class="performance-item loading">加载中...</div>
              </div>
            </div>
            <div class="performance-card">
              <h4>渲染性能</h4>
              <div class="performance-list" data-performance="rendering">
                <div class="performance-item loading">加载中...</div>
              </div>
            </div>
            <div class="performance-card">
              <h4>内存使用</h4>
              <div class="performance-list" data-performance="memory">
                <div class="performance-item loading">加载中...</div>
              </div>
            </div>
          </div>
        </div>

        <div class="performance-chart">
          <h4>性能趋势</h4>
          <div class="chart-container">
            <canvas id="detailed-performance-chart" width="600" height="300"></canvas>
          </div>
        </div>
      </div>
    `
  }

  /* *
   * 渲染状态面板 */
  private renderStatesPanel(): string {
    return `
      <div class="states-container">
        <div class="states-header">
          <h3>状态追踪</h3>
          <div class="states-controls">
            <button class="debug-btn small" data-action="refresh-states">刷新</button>
            <button class="debug-btn small" data-action="clear-states">清除</button>
          </div>
        </div>

        <div class="states-timeline">
          <h4>状态变化时间线</h4>
          <div class="timeline-container" data-timeline="states">
            <div class="timeline-item loading">加载状态数据...</div>
          </div>
        </div>

        <div class="current-state">
          <h4>当前状态</h4>
          <div class="state-inspector" data-current-state>
            <div class="loading">获取当前状态...</div>
          </div>
        </div>
      </div>
    `
  }

  /* *
   * 渲染错误面板 */
  private renderErrorsPanel(): string {
    return `
      <div class="errors-container">
        <div class="errors-header">
          <h3>错误分析</h3>
          <div class="errors-controls">
            <select class="error-filter">
              <option value="all">所有错误</option>
              <option value="CalculationError">计算错误</option>
              <option value="SyntaxError">语法错误</option>
              <option value="NetworkError">网络错误</option>
              <option value="ValidationError">验证错误</option>
            </select>
            <button class="debug-btn small" data-action="refresh-errors">刷新</button>
            <button class="debug-btn small danger" data-action="clear-errors">清除</button>
          </div>
        </div>

        <div class="error-stats">
          <div class="error-stat-card">
            <span class="error-stat-label">总错误数</span>
            <span class="error-stat-value" data-error-stat="total">0</span>
          </div>
          <div class="error-stat-card">
            <span class="error-stat-label">今日错误</span>
            <span class="error-stat-value" data-error-stat="today">0</span>
          </div>
          <div class="error-stat-card">
            <span class="error-stat-label">错误率</span>
            <span class="error-stat-value" data-error-stat="rate">0%</span>
          </div>
        </div>

        <div class="error-list">
          <h4>错误列表</h4>
          <div class="errors-timeline" data-errors-list>
            <div class="loading">加载错误数据...</div>
          </div>
        </div>
      </div>
    `
  }

  /* *
   * 渲染事件面板 */
  private renderEventsPanel(): string {
    return `
      <div class="events-container">
        <div class="events-header">
          <h3>事件监控</h3>
          <div class="events-controls">
            <input type="text" class="event-search" placeholder="搜索事件...">
            <select class="event-type-filter">
              <option value="all">所有事件</option>
              <option value="button-click">按钮点击</option>
              <option value="keydown">键盘输入</option>
              <option value="panel-open">面板操作</option>
              <option value="calculation">计算事件</option>
            </select>
            <button class="debug-btn small" data-action="refresh-events">刷新</button>
            <button class="debug-btn small" data-action="clear-events">清除</button>
          </div>
        </div>

        <div class="events-stats">
          <div class="event-stat-grid">
            <div class="event-stat">
              <span class="stat-number" data-event-stat="total">0</span>
              <span class="stat-label">总事件数</span>
            </div>
            <div class="event-stat">
              <span class="stat-number" data-event-stat="interactions">0</span>
              <span class="stat-label">用户交互</span>
            </div>
            <div class="event-stat">
              <span class="stat-number" data-event-stat="calculations">0</span>
              <span class="stat-label">计算事件</span>
            </div>
          </div>
        </div>

        <div class="events-timeline">
          <h4>事件流</h4>
          <div class="events-stream" data-events-stream>
            <div class="loading">加载事件数据...</div>
          </div>
        </div>
      </div>
    `
  }

  /* *
   * 渲染设置面板 */
  private renderSettingsPanel(): string {
    return `
      <div class="debug-settings-container">
        <div class="settings-section">
          <h3>调试设置</h3>
          
          <div class="setting-item">
            <label class="setting-label">
              <input type="checkbox" class="setting-checkbox" data-setting="enabled" checked>
              启用MCP调试
            </label>
            <div class="setting-description">开启或关闭MCP调试功能</div>
          </div>

          <div class="setting-item">
            <label class="setting-label">
              <input type="checkbox" class="setting-checkbox" data-setting="auto-clear" checked>
              自动清理数据
            </label>
            <div class="setting-description">当数据量超过限制时自动清理旧数据</div>
          </div>

          <div class="setting-item">
            <label class="setting-label">
              更新频率
              <select class="setting-select" data-setting="update-interval">
                <option value="500">500ms</option>
                <option value="1000" selected>1秒</option>
                <option value="2000">2秒</option>
                <option value="5000">5秒</option>
              </select>
            </label>
            <div class="setting-description">调试面板数据更新频率</div>
          </div>

          <div class="setting-item">
            <label class="setting-label">
              最大数据点
              <input type="number" class="setting-input" data-setting="max-data-points" value="50" min="10" max="500">
            </label>
            <div class="setting-description">图表和列表中保留的最大数据点数量</div>
          </div>
        </div>

        <div class="settings-section">
          <h3>快照管理</h3>
          
          <div class="snapshot-actions">
            <button class="debug-btn primary" data-action="create-snapshot">
              📸 创建快照
            </button>
            <button class="debug-btn secondary" data-action="auto-snapshot">
              ⏰ 自动快照
            </button>
          </div>

          <div class="snapshot-list">
            <h4>已保存快照</h4>
            <div class="snapshots-container" data-snapshots>
              <div class="empty-snapshots">暂无保存的快照</div>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h3>系统信息</h3>
          <div class="system-info">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">浏览器</span>
                <span class="info-value" data-info="browser">--</span>
              </div>
              <div class="info-item">
                <span class="info-label">内存限制</span>
                <span class="info-value" data-info="memory-limit">--</span>
              </div>
              <div class="info-item">
                <span class="info-label">运行时间</span>
                <span class="info-value" data-info="uptime">--</span>
              </div>
              <div class="info-item">
                <span class="info-label">版本</span>
                <span class="info-value" data-info="version">1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }

  /* *
   * 设置事件监听器 */
  private setupEventListeners(): void {
    // 关闭面板
    this.element.addEventListener('click', e => {
      const target = e.target as HTMLElement
      
      if (target.closest('[data-action="close"]') || 
          (target.classList.contains('mcp-debug-backdrop') && !target.closest('.mcp-debug-container'))) {
        this.close()
      }
    })

    // 标签切换
    this.element.addEventListener('click', e => {
      const tab = (e.target as HTMLElement).closest('.debug-tab') as HTMLElement
      if (tab) {
        this.switchTab(tab.dataset.tab || 'overview')
      }
    })

    // 按钮操作
    this.element.addEventListener('click', e => {
      const target = e.target as HTMLElement
      const action = target.dataset.action

      if (action) {
        this.handleAction(action)
      }
    })

    // 设置变更
    this.element.addEventListener('change', e => {
      const target = e.target as HTMLInputElement | HTMLSelectElement
      const setting = target.dataset.setting

      if (setting) {
        this.handleSettingChange(setting, target)
      }
    })

    // 键盘快捷键
    this.element.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        this.close()
      }
    })

    // 监听MCP事件
    mcpDebugger.on('frontend-performance', this.updatePerformanceData.bind(this))
    mcpDebugger.on('frontend-error', this.updateErrorData.bind(this))
    mcpDebugger.on('frontend-state-change', this.updateStateData.bind(this))
  }

  /* *
   * 切换标签 */
  private switchTab(tabName: string): void {
    // 更新标签状态
    const tabs = this.element.querySelectorAll('.debug-tab')
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName)
    })

    // 更新面板显示
    const panels = this.element.querySelectorAll('.debug-panel')
    panels.forEach(panel => {
      panel.classList.toggle('active', panel.getAttribute('data-panel') === tabName)
    })

    // 刷新对应面板数据
    this.refreshPanelData(tabName)
  }

  /* *
   * 处理操作按钮 */
  private handleAction(action: string): void {
    switch (action) {
      case 'clear-data':
        this.clearAllData()
        break
      case 'export-snapshot':
        this.exportSnapshot()
        break
      case 'import-snapshot':
        this.importSnapshot()
        break
      case 'refresh-performance':
        this.refreshPerformancePanel()
        break
      case 'refresh-states':
        this.refreshStatesPanel()
        break
      case 'refresh-errors':
        this.refreshErrorsPanel()
        break
      case 'refresh-events':
        this.refreshEventsPanel()
        break
      case 'create-snapshot':
        this.createSnapshot()
        break
    }
  }

  /* *
   * 处理设置变更 */
  private handleSettingChange(setting: string, element: HTMLInputElement | HTMLSelectElement): void {
    switch (setting) {
      case 'enabled':
        mcpDebugger.setEnabled((element as HTMLInputElement).checked)
        break
      case 'update-interval':
        this.config.updateInterval = parseInt(element.value)
        this.restartUpdateTimer()
        break
      case 'max-data-points':
        this.config.maxDataPoints = parseInt(element.value)
        break
    }
  }

  /* *
   * 显示调试面板 */
  show(): void {
    this.isVisible = true
    this.element.style.display = 'flex'
    
    setTimeout(() => {
      this.element.classList.add('visible')
    }, 10)

    this.startUpdateTimer()
    this.refreshAllPanels()
  }

  /* *
   * 关闭调试面板 */
  close(): void {
    this.isVisible = false
    this.element.classList.remove('visible')
    
    setTimeout(() => {
      if (!this.isVisible) {
        this.element.style.display = 'none'
      }
    }, 300)

    this.stopUpdateTimer()
    this.config.onClose?.()
  }

  /* *
   * 启动更新定时器 */
  private startUpdateTimer(): void {
    this.stopUpdateTimer()
    
    this.updateTimer = window.setInterval(() => {
      if (this.isVisible) {
        this.updateOverviewMetrics()
        this.updateCharts()
      }
    }, this.config.updateInterval)
  }

  /* *
   * 停止更新定时器 */
  private stopUpdateTimer(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer)
      this.updateTimer = null
    }
  }

  /* *
   * 重启更新定时器 */
  private restartUpdateTimer(): void {
    this.stopUpdateTimer()
    this.startUpdateTimer()
  }

  /* *
   * 更新总览指标 */
  private updateOverviewMetrics(): void {
    const snapshot = getDebugSnapshot()
    const metrics = getPerformanceMetrics()

    // 计算平均响应时间，使用metrics或从snapshot计算
    const avgResponseTime = typeof metrics.averageResponseTime === 'number' 
      ? metrics.averageResponseTime
      : (snapshot.performance.length > 0 
          ? snapshot.performance.reduce((sum, p) => sum + p.duration, 0) / snapshot.performance.length
          : 0)

    // 更新DOM
    this.updateMetricValue('avg-response-time', `${avgResponseTime.toFixed(1)}ms`)
    this.updateMetricValue('total-calculations', snapshot.performance.length.toString())
    this.updateMetricValue('total-errors', snapshot.errors.length.toString())
    this.updateMetricValue('total-interactions', snapshot.events.length.toString())

    // 计算错误率
    const totalOperations = snapshot.performance.length + snapshot.errors.length
    const errorRate = totalOperations > 0 ? (snapshot.errors.length / totalOperations * 100) : 0
    this.updateMetricValue('error-rate', `${errorRate.toFixed(1)}%`)

    // 最近错误时间
    const lastError = snapshot.errors[0]
    if (lastError) {
      const errorTime = new Date(lastError.timestamp)
      this.updateMetricValue('last-error-time', this.formatRelativeTime(errorTime))
    }

    // 会话时长
    const sessionStart = Date.now() - (this.config.updateInterval || 1000) * 60 // 估算
    const sessionDuration = Math.floor((Date.now() - sessionStart) / (1000 * 60))
    this.updateMetricValue('session-duration', sessionDuration.toString())
  }

  /* *
   * 更新图表 */
  private updateCharts(): void {
    this.updatePerformanceChart()
  }

  /* *
   * 更新性能图表 */
  private updatePerformanceChart(): void {
    const canvas = this.element.querySelector('#performance-chart') as HTMLCanvasElement
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const snapshot = getDebugSnapshot()
    const recentPerformance = snapshot.performance.slice(0, this.config.maxDataPoints || 50)

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (recentPerformance.length === 0) {
      ctx.fillStyle = '#666'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('暂无性能数据', canvas.width / 2, canvas.height / 2)
      return
    }

    // 绘制性能折线图
    const maxDuration = Math.max(...recentPerformance.map(p => p.duration))
    const padding = 40
    const chartWidth = canvas.width - padding * 2
    const chartHeight = canvas.height - padding * 2

    ctx.strokeStyle = '#0066cc'
    ctx.lineWidth = 2
    ctx.beginPath()

    recentPerformance.forEach((perf, index) => {
      const x = padding + (index / (recentPerformance.length - 1)) * chartWidth
      const y = padding + (1 - perf.duration / maxDuration) * chartHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // 绘制坐标轴标签
    ctx.fillStyle = '#666'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('0ms', 5, canvas.height - 5)
    ctx.fillText(`${maxDuration.toFixed(1)}ms`, 5, padding)
  }

  /* *
   * 刷新所有面板 */
  private refreshAllPanels(): void {
    this.refreshPerformancePanel()
    this.refreshStatesPanel()
    this.refreshErrorsPanel()
    this.refreshEventsPanel()
  }

  /* *
   * 刷新面板数据 */
  private refreshPanelData(panelName: string): void {
    switch (panelName) {
      case 'performance':
        this.refreshPerformancePanel()
        break
      case 'states':
        this.refreshStatesPanel()
        break
      case 'errors':
        this.refreshErrorsPanel()
        break
      case 'events':
        this.refreshEventsPanel()
        break
    }
  }

  /* *
   * 刷新性能面板 */
  private refreshPerformancePanel(): void {
    const metrics = getPerformanceMetrics()
    const calculationsContainer = this.element.querySelector(`[data-performance="calculations"]`)
    
    if (calculationsContainer) {
      const calculationEntries = Object.entries(metrics).filter(([operation]) => 
        operation.includes('calculate') || operation.includes('compute')
      )
      
      if (calculationEntries.length > 0) {
        calculationsContainer.innerHTML = calculationEntries.map(([operation, stats]) => `
          <div class="performance-item">
            <div class="perf-operation">${operation}</div>
            <div class="perf-stats">
              <span class="perf-avg">${stats.average.toFixed(1)}ms</span>
              <span class="perf-count">${stats.count}次</span>
            </div>
          </div>
        `).join('')
      } else {
        calculationsContainer.innerHTML = '<div class="performance-item loading">暂无计算性能数据</div>'
      }
    }

    const renderingContainer = this.element.querySelector(`[data-performance="rendering"]`)
    if (renderingContainer) {
      const renderingEntries = Object.entries(metrics).filter(([operation]) => 
        operation.includes('render') || operation.includes('display')
      )
      
      if (renderingEntries.length > 0) {
        renderingContainer.innerHTML = renderingEntries.map(([operation, stats]) => `
          <div class="performance-item">
            <div class="perf-operation">${operation}</div>
            <div class="perf-stats">
              <span class="perf-avg">${stats.average.toFixed(1)}ms</span>
              <span class="perf-count">${stats.count}次</span>
            </div>
          </div>
        `).join('')
      } else {
        renderingContainer.innerHTML = '<div class="performance-item loading">暂无渲染性能数据</div>'
      }
    }
  }

  /* *
   * 刷新状态面板 */
  private refreshStatesPanel(): void {
    const snapshot = getDebugSnapshot()
    const timeline = this.element.querySelector('[data-timeline="states"]')
    
    if (timeline && snapshot.states.length > 0) {
      timeline.innerHTML = snapshot.states.slice(0, 10).map(state => `
        <div class="timeline-item">
          <div class="timeline-time">${this.formatTime(new Date(state.timestamp))}</div>
          <div class="timeline-content">
            <div class="state-expression">${state.expression}</div>
            <div class="state-result">${state.result}</div>
          </div>
        </div>
      `).join('')
    }

    // 更新当前状态
    const currentState = this.element.querySelector('[data-current-state]')
    if (currentState && snapshot.states[0]) {
      const state = snapshot.states[0]
      currentState.innerHTML = `
        <div class="current-state-card">
          <div class="state-field">
            <label>表达式:</label>
            <span>${state.expression || '无'}</span>
          </div>
          <div class="state-field">
            <label>结果:</label>
            <span>${state.result || '0'}</span>
          </div>
          <div class="state-field">
            <label>内存:</label>
            <span>${state.memory || '0'}</span>
          </div>
          <div class="state-field">
            <label>时间:</label>
            <span>${this.formatTime(new Date(state.timestamp))}</span>
          </div>
        </div>
      `
    }
  }

  /* *
   * 刷新错误面板 */
  private refreshErrorsPanel(): void {
    const snapshot = getDebugSnapshot()
    const errorsList = this.element.querySelector('[data-errors-list]')
    
    if (errorsList) {
      if (snapshot.errors.length === 0) {
        errorsList.innerHTML = '<div class="no-errors">✅ 暂无错误记录</div>'
      } else {
        errorsList.innerHTML = snapshot.errors.slice(0, 20).map(error => `
          <div class="error-item ${error.type.toLowerCase()}">
            <div class="error-header">
              <span class="error-type">${error.type}</span>
              <span class="error-time">${this.formatTime(new Date(error.timestamp))}</span>
            </div>
            <div class="error-message">${error.message}</div>
            ${error.context ? `
              <details class="error-context">
                <summary>上下文信息</summary>
                <pre>${JSON.stringify(error.context, null, 2)}</pre>
              </details>
            ` : ''}
          </div>
        `).join('')
      }
    }

    // 更新错误统计
    const today = new Date()
    const todayErrors = snapshot.errors.filter(error => {
      const errorDate = new Date(error.timestamp)
      return errorDate.toDateString() === today.toDateString()
    }).length

    this.updateErrorStat('total', snapshot.errors.length.toString())
    this.updateErrorStat('today', todayErrors.toString())
  }

  /* *
   * 刷新事件面板 */
  private refreshEventsPanel(): void {
    const snapshot = getDebugSnapshot()
    const eventsStream = this.element.querySelector('[data-events-stream]')
    
    if (eventsStream) {
      if (snapshot.events.length === 0) {
        eventsStream.innerHTML = '<div class="no-events">暂无事件记录</div>'
      } else {
        eventsStream.innerHTML = snapshot.events.slice(0, 30).map(event => `
          <div class="event-item" data-event-type="${event.type}">
            <div class="event-header">
              <span class="event-type">${event.type}</span>
              <span class="event-time">${this.formatTime(new Date(event.timestamp))}</span>
            </div>
            ${event.target ? `<div class="event-target">目标: ${event.target}</div>` : ''}
            ${event.metadata ? `
              <details class="event-metadata">
                <summary>元数据</summary>
                <pre>${JSON.stringify(event.metadata, null, 2)}</pre>
              </details>
            ` : ''}
          </div>
        `).join('')
      }
    }

    // 更新事件统计
    const interactions = snapshot.events.filter(e => 
      e.type.includes('click') || e.type.includes('keydown')
    ).length

    const calculations = snapshot.events.filter(e => 
      e.type.includes('calculate') || e.type.includes('equals')
    ).length

    this.updateEventStat('total', snapshot.events.length.toString())
    this.updateEventStat('interactions', interactions.toString())
    this.updateEventStat('calculations', calculations.toString())
  }

  /* *
   * 清除所有数据 */
  private clearAllData(): void {
    if (confirm('确定要清除所有调试数据吗？此操作不可撤销。')) {
      clearDebugData()
      this.chartData = {
        performance: [],
        memory: [],
        errors: [],
      }
      this.refreshAllPanels()
      this.showToast('调试数据已清除')
    }
  }

  /* *
   * 导出快照 */
  private exportSnapshot(): void {
    const snapshot = getDebugSnapshot()
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `mcp-debug-snapshot-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    this.showToast('调试快照已导出')
  }

  /* *
   * 导入快照 */
  private importSnapshot(): void {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.style.display = 'none'

    input.addEventListener('change', () => {
      const file = input.files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const snapshot = JSON.parse(e.target?.result as string) as MCPDebugSnapshot
            console.log('导入的快照:', snapshot)
            
            // 处理导入的快照数据
            this.applyImportedSnapshot(snapshot)
            this.showToast('调试快照已导入并应用')
          } catch (error) {
            console.error('快照导入失败:', error)
            this.showToast('快照格式无效')
          }
        }
        reader.readAsText(file)
      }
      input.remove()
    }, { once: true })

    document.body.appendChild(input)
    input.click()
  }

  /* *
   * 应用导入的快照数据 */
  private applyImportedSnapshot(snapshot: MCPDebugSnapshot): void {
    try {
      // 保存快照到本地存储
      const snapshots = JSON.parse(localStorage.getItem('mcp-debug-snapshots') || '[]')
      snapshots.unshift({
        ...snapshot,
        id: `imported-${Date.now()}`,
        timestamp: new Date().toISOString(),
      })
      
      // 限制快照数量
      if (snapshots.length > 10) {
        snapshots.splice(10)
      }
      
      localStorage.setItem('mcp-debug-snapshots', JSON.stringify(snapshots))
      
      // 可选：应用快照数据到当前调试会话进行对比分析
      console.log('快照已保存，可用于对比分析:', {
        performance: snapshot.performance,
        states: snapshot.states?.length,
        errors: snapshot.errors?.length,
      })
      
      // 刷新面板显示
      this.refreshAllPanels()
    } catch (error) {
      console.error('应用快照失败:', error)
      throw error
    }
  }

  /* *
   * 创建快照 */
  private createSnapshot(): void {
    const snapshot = getDebugSnapshot()
    const snapshots = JSON.parse(localStorage.getItem('mcp-debug-snapshots') || '[]')
    
    snapshots.unshift({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      name: `快照 ${new Date().toLocaleString()}`,
      data: snapshot,
    })

    // 只保留最近10个快照
    if (snapshots.length > 10) {
      snapshots.splice(10)
    }

    localStorage.setItem('mcp-debug-snapshots', JSON.stringify(snapshots))
    this.showToast('快照已创建')
  }

  /* *
   * 更新性能数据 */
  private updatePerformanceData(data: unknown): void {
    // 添加到图表数据
    this.chartData.performance.push({
      timestamp: Date.now(),
      duration: (data as { duration: number }).duration,
      operation: (data as { operation: string }).operation,
    })

    // 限制数据点数量
    if (this.chartData.performance.length > (this.config.maxDataPoints || 50)) {
      this.chartData.performance.shift()
    }
  }

  /* *
   * 更新错误数据 */
  private updateErrorData(_data: unknown): void {
    this.chartData.errors.push({
      timestamp: Date.now(),
      count: 1,
    })
  }

  /* *
   * 更新状态数据 */
  private updateStateData(_data: unknown): void {
    // 状态更新时可以触发相关更新
  }

  /* *
   * 工具方法 */
  private updateMetricValue(metric: string, value: string): void {
    const element = this.element.querySelector(`[data-metric="${metric}"]`)
    if (element) {
      element.textContent = value
    }
  }

  private updateErrorStat(stat: string, value: string): void {
    const element = this.element.querySelector(`[data-error-stat="${stat}"]`)
    if (element) {
      element.textContent = value
    }
  }

  private updateEventStat(stat: string, value: string): void {
    const element = this.element.querySelector(`[data-event-stat="${stat}"]`)
    if (element) {
      element.textContent = value
    }
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
  }

  private formatRelativeTime(date: Date): string {
    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}小时前`
    
    const days = Math.floor(hours / 24)
    return `${days}天前`
  }

  private showToast(message: string): void {
    const toast = document.createElement('div')
    toast.className = 'debug-toast'
    toast.textContent = message
    toast.setAttribute('aria-live', 'polite')

    this.element.appendChild(toast)

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

  /* *
   * 销毁组件 */
  destroy(): void {
    this.stopUpdateTimer()
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }
  }
}