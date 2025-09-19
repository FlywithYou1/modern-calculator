/**
 * 计算器历史记录组件
 * 负责显示、搜索和管理计算历史，支持导入导出和统计功能
 */

import type { Theme, HistoryItem, HistoryConfig, HistoryStats } from '../types/calculator.js'

export class History {
  private element: HTMLElement
  private config: HistoryConfig
  private history: HistoryItem[] = []
  private filteredHistory: HistoryItem[] = []
  private searchTerm: string = ''
  private isVisible: boolean = false

  constructor(container: HTMLElement, config: HistoryConfig) {
    this.config = config
    this.element = this.createElement()
    container.appendChild(this.element)
    this.setupEventListeners()
  }

  /**
   * 初始化组件
   */
  async init(): Promise<void> {
    await this.loadHistory()
    this.render()
  }

  /**
   * 创建历史记录元素
   */
  private createElement(): HTMLElement {
    const history = document.createElement('div')
    history.className = 'calculator-history'
    history.setAttribute('role', 'region')
    history.setAttribute('aria-label', '计算历史记录')
    history.innerHTML = `
      <div class="history-header">
        <h2 class="history-title">历史记录</h2>
        <div class="history-actions">
          <button class="history-search-btn" aria-label="搜索历史记录">
            <span class="icon-search">🔍</span>
          </button>
          <button class="history-export-btn" aria-label="导出历史记录">
            <span class="icon-export">💾</span>
          </button>
          <button class="history-clear-btn" aria-label="清空历史记录">
            <span class="icon-clear">🗑️</span>
          </button>
          <button class="history-close-btn" aria-label="关闭历史记录">
            <span class="icon-close">✕</span>
          </button>
        </div>
      </div>
      
      <div class="history-search" style="display: none;">
        <input type="text" class="history-search-input" placeholder="搜索表达式或结果..." aria-label="搜索历史记录">
        <div class="history-search-filters">
          <button class="filter-btn active" data-filter="all">全部</button>
          <button class="filter-btn" data-filter="today">今天</button>
          <button class="filter-btn" data-filter="week">本周</button>
          <button class="filter-btn" data-filter="month">本月</button>
        </div>
      </div>

      <div class="history-stats">
        <div class="stat-item">
          <span class="stat-label">总计算次数</span>
          <span class="stat-value" data-stat="total">0</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">今日计算</span>
          <span class="stat-value" data-stat="today">0</span>
        </div>
      </div>

      <div class="history-content">
        <div class="history-list" role="list">
          <!-- 历史记录项将在这里渲染 -->
        </div>
        <div class="history-empty" style="display: none;">
          <div class="empty-icon">📝</div>
          <div class="empty-text">暂无计算历史</div>
          <div class="empty-description">开始计算，这里将显示您的计算历史</div>
        </div>
      </div>
    `
    return history
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 搜索按钮
    const searchBtn = this.element.querySelector('.history-search-btn') as HTMLElement
    searchBtn?.addEventListener('click', () => {
      this.toggleSearch()
    })

    // 导出按钮
    const exportBtn = this.element.querySelector('.history-export-btn') as HTMLElement
    exportBtn?.addEventListener('click', () => {
      this.exportHistory()
    })

    // 清空按钮
    const clearBtn = this.element.querySelector('.history-clear-btn') as HTMLElement
    clearBtn?.addEventListener('click', () => {
      this.confirmClearHistory()
    })

    // 关闭按钮
    const closeBtn = this.element.querySelector('.history-close-btn') as HTMLElement
    closeBtn?.addEventListener('click', () => {
      this.hide()
    })

    // 搜索输入
    const searchInput = this.element.querySelector('.history-search-input') as HTMLInputElement
    searchInput?.addEventListener('input', e => {
      this.searchTerm = (e.target as HTMLInputElement).value
      this.filterHistory()
    })

    // 过滤按钮
    const filterBtns = this.element.querySelectorAll('.filter-btn')
    filterBtns.forEach(btn => {
      btn.addEventListener('click', e => {
        const filter = (e.target as HTMLElement).dataset.filter
        this.setFilter(filter || 'all')
      })
    })

    // 键盘导航
    this.element.addEventListener('keydown', e => {
      this.handleKeyNavigation(e)
    })
  }

  /**
   * 渲染历史记录列表
   */
  private render(): void {
    this.updateStats()
    this.renderHistoryList()
  }

  /**
   * 渲染历史记录项
   */
  private renderHistoryList(): void {
    const listElement = this.element.querySelector('.history-list') as HTMLElement
    const emptyElement = this.element.querySelector('.history-empty') as HTMLElement

    if (!listElement || !emptyElement) return

    const itemsToShow = this.filteredHistory.length > 0 ? this.filteredHistory : this.history

    if (itemsToShow.length === 0) {
      listElement.style.display = 'none'
      emptyElement.style.display = 'flex'
      return
    }

    listElement.style.display = 'block'
    emptyElement.style.display = 'none'

    listElement.innerHTML = itemsToShow
      .slice(0, this.config.maxItems)
      .map(item => this.createHistoryItemHTML(item))
      .join('')

    // 添加事件监听器
    this.setupHistoryItemListeners()
  }

  /**
   * 创建历史记录项HTML
   */
  private createHistoryItemHTML(item: HistoryItem): string {
    const timestamp = this.formatTimestamp(item.timestamp)
    const tags = item.tags
      ? item.tags.map(tag => `<span class="history-tag">${tag}</span>`).join('')
      : ''

    return `
      <div class="history-item" role="listitem" data-id="${item.id}" tabindex="0">
        <div class="history-item-content">
          <div class="history-expression" title="${item.expression}">
            ${this.highlightSearchTerm(item.expression)}
          </div>
          <div class="history-result" title="${item.result}">
            = ${this.highlightSearchTerm(item.result)}
          </div>
          <div class="history-meta">
            <span class="history-timestamp">${timestamp}</span>
            <div class="history-tags">${tags}</div>
          </div>
          ${item.notes ? `<div class="history-notes">${item.notes}</div>` : ''}
        </div>
        <div class="history-item-actions">
          <button class="history-action-btn reuse-btn" data-action="reuse" data-id="${item.id}" aria-label="重新使用此表达式">
            <span class="icon-reuse">↻</span>
          </button>
          <button class="history-action-btn copy-btn" data-action="copy" data-id="${item.id}" aria-label="复制结果">
            <span class="icon-copy">📋</span>
          </button>
          <button class="history-action-btn delete-btn" data-action="delete" data-id="${item.id}" aria-label="删除此记录">
            <span class="icon-delete">✕</span>
          </button>
        </div>
      </div>
    `
  }

  /**
   * 设置历史记录项事件监听器
   */
  private setupHistoryItemListeners(): void {
    const items = this.element.querySelectorAll('.history-item')
    items.forEach(item => {
      // 点击选择
      item.addEventListener('click', e => {
        if (!(e.target as HTMLElement).closest('.history-action-btn')) {
          const id = item.getAttribute('data-id')
          const historyItem = this.history.find(h => h.id === id)
          if (historyItem && this.config.onHistoryItemSelect) {
            this.config.onHistoryItemSelect(historyItem)
          }
        }
      })

      // 操作按钮
      const actionBtns = item.querySelectorAll('.history-action-btn')
      actionBtns.forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation()
          const action = (e.currentTarget as HTMLElement).dataset.action
          const id = (e.currentTarget as HTMLElement).dataset.id
          this.handleItemAction(action || '', id || '')
        })
      })
    })
  }

  /**
   * 处理历史记录项操作
   */
  private handleItemAction(action: string, id: string): void {
    const item = this.history.find(h => h.id === id)
    if (!item) return

    switch (action) {
      case 'reuse':
        if (this.config.onHistoryItemSelect) {
          this.config.onHistoryItemSelect(item)
        }
        break
      case 'copy':
        this.copyToClipboard(item.result)
        break
      case 'delete':
        this.deleteHistoryItem(id)
        break
    }
  }

  /**
   * 设置历史记录
   */
  setHistory(history: HistoryItem[]): void {
    this.history = [...history]
    this.filterHistory()
    this.render()
  }

  /**
   * 更新历史记录
   */
  updateHistory(history: HistoryItem[]): void {
    this.setHistory(history)
  }

  /**
   * 添加历史记录项
   */
  addHistoryItem(item: HistoryItem): void {
    this.history.unshift(item)
    if (this.history.length > this.config.maxItems) {
      this.history = this.history.slice(0, this.config.maxItems)
    }
    this.filterHistory()
    this.render()
  }

  /**
   * 删除历史记录项
   */
  private deleteHistoryItem(id: string): void {
    this.history = this.history.filter(item => item.id !== id)
    this.filterHistory()
    this.render()
  }

  /**
   * 显示历史记录
   */
  show(): void {
    this.isVisible = true
    this.element.style.display = 'flex'
    this.element.classList.add('visible')

    // 聚焦到关闭按钮以便键盘导航
    const closeBtn = this.element.querySelector('.history-close-btn') as HTMLElement
    closeBtn?.focus()
  }

  /**
   * 隐藏历史记录
   */
  hide(): void {
    this.isVisible = false
    this.element.classList.remove('visible')
    setTimeout(() => {
      if (!this.isVisible) {
        this.element.style.display = 'none'
      }
    }, 300)
  }

  /**
   * 切换搜索栏显示
   */
  private toggleSearch(): void {
    const searchElement = this.element.querySelector('.history-search') as HTMLElement
    const isVisible = searchElement.style.display !== 'none'

    if (isVisible) {
      searchElement.style.display = 'none'
    } else {
      searchElement.style.display = 'block'
      const searchInput = searchElement.querySelector('.history-search-input') as HTMLInputElement
      searchInput?.focus()
    }
  }

  /**
   * 过滤历史记录
   */
  private filterHistory(): void {
    let filtered = [...this.history]

    // 按搜索词过滤
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase()
      filtered = filtered.filter(
        item =>
          item.expression.toLowerCase().includes(term) ||
          item.result.toLowerCase().includes(term) ||
          (item.notes && item.notes.toLowerCase().includes(term))
      )
    }

    this.filteredHistory = filtered
    this.renderHistoryList()
  }

  /**
   * 设置时间过滤器
   */
  private setFilter(filter: string): void {
    // 更新过滤按钮状态
    const filterBtns = this.element.querySelectorAll('.filter-btn')
    filterBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-filter') === filter)
    })

    // 按时间过滤
    const now = new Date()
    let filtered = [...this.history]

    switch (filter) {
      case 'today': {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        filtered = filtered.filter(item => new Date(item.timestamp) >= today)
        break
      }
      case 'week': {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter(item => new Date(item.timestamp) >= weekAgo)
        break
      }
      case 'month': {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        filtered = filtered.filter(item => new Date(item.timestamp) >= monthAgo)
        break
      }
      default:
        // 显示全部
        break
    }

    this.filteredHistory = filtered
    this.renderHistoryList()
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    const stats = this.calculateStats()

    const totalElement = this.element.querySelector('[data-stat="total"]') as HTMLElement
    const todayElement = this.element.querySelector('[data-stat="today"]') as HTMLElement

    if (totalElement) totalElement.textContent = stats.totalCalculations.toString()
    if (todayElement) todayElement.textContent = stats.calculationsToday.toString()
  }

  /**
   * 计算统计信息
   */
  private calculateStats(): HistoryStats {
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    const calculationsToday = this.history.filter(
      item => new Date(item.timestamp) >= todayStart
    ).length

    return {
      totalCalculations: this.history.length,
      calculationsToday,
      averageExpressionLength:
        this.history.reduce((acc, item) => acc + item.expression.length, 0) /
        Math.max(this.history.length, 1),
      mostUsedOperations: {},
      calculationsThisWeek: 0,
      calculationsThisMonth: 0,
    }
  }

  /**
   * 导出历史记录
   */
  private async exportHistory(): Promise<void> {
    try {
      const data = {
        exportDate: new Date().toISOString(),
        history: this.history,
        stats: this.calculateStats(),
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `calculator-history-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      this.showToast('历史记录已导出')
    } catch (error) {
      console.error('导出历史记录失败:', error)
      this.showToast('导出失败')
    }
  }

  /**
   * 确认清空历史记录
   */
  private confirmClearHistory(): void {
    if (confirm('确定要清空所有历史记录吗？此操作不可撤销。')) {
      this.clearHistory()
    }
  }

  /**
   * 清空历史记录
   */
  private clearHistory(): void {
    this.history = []
    this.filteredHistory = []
    this.render()

    if (this.config.onHistoryClear) {
      this.config.onHistoryClear()
    }

    this.showToast('历史记录已清空')
  }

  /**
   * 加载历史记录
   */
  private async loadHistory(): Promise<void> {
    try {
      // 这里可以调用 Tauri 命令加载历史记录
      // const history = await invoke('get_calculation_history');
      // this.setHistory(history);
    } catch (error) {
      console.error('加载历史记录失败:', error)
    }
  }

  /**
   * 格式化时间戳
   */
  private formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) {
      // 1分钟内
      return '刚刚'
    } else if (diff < 3600000) {
      // 1小时内
      return `${Math.floor(diff / 60000)}分钟前`
    } else if (diff < 86400000) {
      // 24小时内
      return `${Math.floor(diff / 3600000)}小时前`
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  }

  /**
   * 高亮搜索词
   */
  private highlightSearchTerm(text: string): string {
    if (!this.searchTerm) return text

    const regex = new RegExp(`(${this.searchTerm})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }

  /**
   * 复制到剪贴板
   */
  private async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text)
      this.showToast('已复制到剪贴板')
    } catch (error) {
      console.error('复制失败:', error)
      this.showToast('复制失败')
    }
  }

  /**
   * 显示提示消息
   */
  private showToast(message: string): void {
    const toast = document.createElement('div')
    toast.className = 'toast'
    toast.textContent = message
    toast.setAttribute('aria-live', 'polite')

    this.element.appendChild(toast)

    // 动画显示
    requestAnimationFrame(() => {
      toast.style.opacity = '1'
      toast.style.transform = 'translateY(0)'
    })

    // 自动移除
    setTimeout(() => {
      toast.style.opacity = '0'
      toast.style.transform = 'translateY(-20px)'
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
        }
      }, 300)
    }, 2000)
  }

  /**
   * 键盘导航处理
   */
  private handleKeyNavigation(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.hide()
      event.preventDefault()
    }
  }

  /**
   * 更新主题
   */
  updateTheme(theme: Theme): void {
    this.element.className = `calculator-history theme-${theme.mode}`

    // 应用主题颜色
    Object.entries(theme.cssVariables).forEach(([property, value]) => {
      this.element.style.setProperty(property, value)
    })
  }

  /**
   * 处理大小变化
   */
  handleResize(): void {
    // 响应式调整布局
    const containerWidth = this.element.clientWidth
    if (containerWidth < 400) {
      this.element.classList.add('compact')
    } else {
      this.element.classList.remove('compact')
    }
  }

  /**
   * 获取当前历史记录
   */
  getHistory(): HistoryItem[] {
    return [...this.history]
  }

  /**
   * 销毁组件
   */
  destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }
  }
}
