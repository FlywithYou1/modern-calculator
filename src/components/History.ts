


import type { Theme, HistoryItem, HistoryConfig, HistoryStats } from '@/types/calculator'
import { TauriService } from '@/utils/tauri'

export class History {
  private element: HTMLElement
  private config: HistoryConfig
  private history: HistoryItem[] = []
  private filteredHistory: HistoryItem[] = []
  private searchTerm: string = ''
  private isVisible: boolean = false
  private remoteStats: Record<string, number> | null = null
  private activeFilter: 'all' | 'today' | 'week' | 'month' = 'all'
  private activeTagFilter: string = 'all'
  private searchRequestId = 0

  constructor(container: HTMLElement, config: HistoryConfig) {
    this.config = config
    this.element = this.createElement()
    container.appendChild(this.element)
    this.setupEventListeners()
  }


  async init(): Promise<void> {
    await this.loadHistory()
    this.render()
  }


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
          <button class="history-import-btn" aria-label="导入历史记录">
            <span class="icon-import">📥</span>
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
        <div class="history-tag-filters">
          <button class="tag-filter-btn active" data-tag="all">所有标签</button>
          <button class="tag-filter-btn" data-tag="basic">基础运算</button>
          <button class="tag-filter-btn" data-tag="scientific">科学计算</button>
          <button class="tag-filter-btn" data-tag="advanced">高级功能</button>
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
        <div class="stat-item">
          <span class="stat-label">搜索结果</span>
          <span class="stat-value" data-stat="filtered">0</span>
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
        <div class="history-search-empty" style="display: none;">
          <div class="empty-icon">🔍</div>
          <div class="empty-text">未找到匹配的记录</div>
          <div class="empty-description">尝试调整搜索条件或清除筛选</div>
        </div>
      </div>
    `
    return history
  }


  private setupEventListeners(): void {
    const searchBtn = this.element.querySelector('.history-search-btn') as HTMLElement
    searchBtn?.addEventListener('click', () => {
      this.toggleSearch()
    })

    const importBtn = this.element.querySelector('.history-import-btn') as HTMLElement
    importBtn?.addEventListener('click', () => {
      this.openImportDialog()
    })

    const exportBtn = this.element.querySelector('.history-export-btn') as HTMLElement
    exportBtn?.addEventListener('click', () => {
      void this.exportHistory()
    })

    const clearBtn = this.element.querySelector('.history-clear-btn') as HTMLElement
    clearBtn?.addEventListener('click', () => {
      void this.confirmClearHistory()
    })

    const closeBtn = this.element.querySelector('.history-close-btn') as HTMLElement
    closeBtn?.addEventListener('click', () => {
      this.hide()
    })

    const searchInput = this.element.querySelector('.history-search-input') as HTMLInputElement
    searchInput?.addEventListener('input', e => {
      this.searchTerm = (e.target as HTMLInputElement).value
      this.filterHistory()
    })

    const filterBtns = this.element.querySelectorAll('.filter-btn')
    filterBtns.forEach(btn => {
      btn.addEventListener('click', e => {
        const filter = (e.target as HTMLElement).dataset.filter
        this.setFilter(filter || 'all')
      })
    })

    const tagFilterBtns = this.element.querySelectorAll('.tag-filter-btn')
    tagFilterBtns.forEach(btn => {
      btn.addEventListener('click', e => {
        const tag = (e.target as HTMLElement).dataset.tag
        this.setTagFilter(tag || 'all')
      })
    })

    this.element.addEventListener('keydown', e => {
      this.handleKeyNavigation(e)
    })
  }


  private render(): void {
    this.updateStats()
    this.renderHistoryList()
  }


  private renderHistoryList(): void {
    const listElement = this.element.querySelector('.history-list') as HTMLElement
    const emptyElement = this.element.querySelector('.history-empty') as HTMLElement
    const searchEmptyElement = this.element.querySelector('.history-search-empty') as HTMLElement

    if (!listElement || !emptyElement || !searchEmptyElement) return

    const itemsToShow = this.filteredHistory.length > 0 ? this.filteredHistory : this.history
    const isSearching = this.searchTerm || this.activeTagFilter !== 'all' || this.activeFilter !== 'all'

    if (itemsToShow.length === 0) {
      listElement.style.display = 'none'
      if (isSearching) {
        emptyElement.style.display = 'none'
        searchEmptyElement.style.display = 'flex'
      } else {
        emptyElement.style.display = 'flex'
        searchEmptyElement.style.display = 'none'
      }
      return
    }

    listElement.style.display = 'block'
    emptyElement.style.display = 'none'
    searchEmptyElement.style.display = 'none'

    listElement.innerHTML = itemsToShow
      .slice(0, this.config.maxItems)
      .map(item => this.createHistoryItemHTML(item))
      .join('')

    this.setupHistoryItemListeners()
  }


  private createHistoryItemHTML(item: HistoryItem): string {
    const timestamp = this.formatTimestamp(item.timestamp)
    const tags = item.tags
      ? item.tags.map(tag => `<span class="history-tag">${tag}</span>`).join('')
      : ''
    const metadata = item.metadata ? this.renderMetadata(item.metadata) : ''

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
          ${metadata}
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

  private renderMetadata(metadata: Record<string, unknown>): string {
    const json = JSON.stringify(metadata, null, 2)
    if (!json) return ''

    return `
      <details class="history-metadata">
        <summary>附加信息</summary>
        <pre>${this.escapeHtml(json)}</pre>
      </details>
    `
  }

  private stringifyMetadata(metadata: Record<string, unknown>): string {
    try {
      return JSON.stringify(metadata).toLowerCase()
    } catch (error) {
      console.warn('序列化元数据失败:', error)
      return ''
    }
  }

  private escapeHtml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }


  private setupHistoryItemListeners(): void {
    const items = this.element.querySelectorAll('.history-item')
    items.forEach(item => {
      item.addEventListener('click', e => {
        if (!(e.target as HTMLElement).closest('.history-action-btn')) {
          const id = item.getAttribute('data-id')
          const historyItem = this.history.find(h => h.id === id)
          if (historyItem && this.config.onHistoryItemSelect) {
            this.config.onHistoryItemSelect(historyItem)
          }
        }
      })

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


  setHistory(history: HistoryItem[]): void {
    this.history = [...history]
    this.filterHistory()
    this.render()
  }


  updateHistory(history: HistoryItem[]): void {
    this.setHistory(history)
  }


  addHistoryItem(item: HistoryItem): void {
    this.history.unshift(item)
    if (this.history.length > this.config.maxItems) {
      this.history = this.history.slice(0, this.config.maxItems)
    }
    this.remoteStats = null
    this.filterHistory()
    this.render()
  }


  private deleteHistoryItem(id: string): void {
    this.history = this.history.filter(item => item.id !== id)
    this.remoteStats = null
    this.filterHistory()
    this.render()
  }


  show(): void {
    this.isVisible = true
    this.element.style.display = 'flex'
    this.element.classList.add('visible')

    const closeBtn = this.element.querySelector('.history-close-btn') as HTMLElement
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


  private filterHistory(): void {
    let filtered = this.applyTimeFilter([...this.history])
    filtered = this.applyTagFilter(filtered)

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase()
      filtered = filtered.filter(item => {
        const matchesExpression = item.expression.toLowerCase().includes(term)
        const matchesResult = item.result.toLowerCase().includes(term)
        const matchesNotes = typeof item.notes === 'string' && item.notes.toLowerCase().includes(term)
        const matchesTags = Array.isArray(item.tags) && item.tags.some(tag => tag.toLowerCase().includes(term))
        const matchesMetadata = item.metadata
          ? this.stringifyMetadata(item.metadata).includes(term)
          : false

        return matchesExpression || matchesResult || matchesNotes || matchesTags || matchesMetadata
      })

      this.filteredHistory = filtered
      this.renderHistoryList()
      void this.fetchRemoteSearch(this.searchTerm)
      return
    }

    this.searchRequestId += 1
    this.filteredHistory = filtered
    this.renderHistoryList()
  }


  private setFilter(filter: string): void {
    const allowed = new Set(['all', 'today', 'week', 'month'])
    const normalized = allowed.has(filter) ? (filter as 'all' | 'today' | 'week' | 'month') : 'all'
    this.activeFilter = normalized

    const filterBtns = this.element.querySelectorAll('.filter-btn')
    filterBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-filter') === normalized)
    })

    this.filterHistory()
    if (this.searchTerm) {
      void this.fetchRemoteSearch(this.searchTerm)
    }
  }


  private setTagFilter(tag: string): void {
    this.activeTagFilter = tag

    const tagFilterBtns = this.element.querySelectorAll('.tag-filter-btn')
    tagFilterBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tag') === tag)
    })

    this.filterHistory()
    if (this.searchTerm) {
      void this.fetchRemoteSearch(this.searchTerm)
    }
  }

  private applyTimeFilter(items: HistoryItem[]): HistoryItem[] {
    switch (this.activeFilter) {
      case 'today': {
        const today = new Date()
        const floor = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        return items.filter(item => new Date(item.timestamp) >= floor)
      }
      case 'week': {
        const now = Date.now()
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
        return items.filter(item => new Date(item.timestamp) >= weekAgo)
      }
      case 'month': {
        const today = new Date()
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
        return items.filter(item => new Date(item.timestamp) >= monthAgo)
      }
      default:
        return items
    }
  }

  private applyTagFilter(items: HistoryItem[]): HistoryItem[] {
    if (this.activeTagFilter === 'all') {
      return items
    }

    return items.filter(item => {
      if (!item.tags || !Array.isArray(item.tags)) {
        return false
      }
      return item.tags.includes(this.activeTagFilter)
    })
  }

  private async fetchRemoteSearch(term: string): Promise<void> {
    const trimmed = term.trim()
    const requestId = ++this.searchRequestId

    if (!trimmed) {
      return
    }

    try {
      const results = await TauriService.searchHistory(trimmed)
      if (this.searchRequestId !== requestId) {
        return
      }

      if (Array.isArray(results)) {
        this.filteredHistory = this.applyTimeFilter(results)
        this.renderHistoryList()
      }
    } catch (error) {
      if (this.searchRequestId === requestId) {
        console.warn('搜索历史记录失败:', error)
      }
    }
  }


  private updateStats(): void {
    const fallback = this.calculateStats()
    const total = this.remoteStats?.total_items ?? fallback.totalCalculations
    const today = this.remoteStats?.today_calculations ?? fallback.calculationsToday
    const filtered = this.filteredHistory.length > 0 ? this.filteredHistory.length : this.history.length

    const totalElement = this.element.querySelector('[data-stat="total"]') as HTMLElement
    const todayElement = this.element.querySelector('[data-stat="today"]') as HTMLElement
    const filteredElement = this.element.querySelector('[data-stat="filtered"]') as HTMLElement

    if (totalElement) totalElement.textContent = total.toString()
    if (todayElement) todayElement.textContent = today.toString()
    if (filteredElement) filteredElement.textContent = filtered.toString()
  }


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

  private openImportDialog(): void {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.style.display = 'none'

    input.addEventListener(
      'change',
      () => {
        const file = input.files?.[0]
        if (file) {
          void this.importHistoryFile(file)
        }
        input.remove()
      },
      { once: true }
    )

    document.body.appendChild(input)
    input.click()
  }

  private async importHistoryFile(file: File): Promise<void> {
    try {
      const content = await file.text()
      await TauriService.importHistory(content)
      await this.loadHistory()
      this.showToast('历史记录已导入')
    } catch (error) {
      console.error('导入历史记录失败:', error)
      this.showToast('导入历史记录失败')
    }
  }


  private async exportHistory(): Promise<void> {
    const format = await this.showExportFormatDialog()
    if (!format) return

    try {
      let payload: string
      let filename: string
      let mimeType: string

      const itemsToExport = this.filteredHistory.length > 0 ? this.filteredHistory : this.history
      const date = new Date().toISOString().split('T')[0]

      switch (format) {
        case 'json':
          payload = JSON.stringify(itemsToExport, null, 2)
          filename = `calculator-history-${date}.json`
          mimeType = 'application/json'
          break
        case 'csv':
          payload = this.convertToCSV(itemsToExport)
          filename = `calculator-history-${date}.csv`
          mimeType = 'text/csv'
          break
        case 'txt':
          payload = this.convertToText(itemsToExport)
          filename = `calculator-history-${date}.txt`
          mimeType = 'text/plain'
          break
        default:
          throw new Error('不支持的导出格式')
      }

      const blob = new Blob([payload], { type: mimeType })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      this.showToast(`历史记录已导出为${format.toUpperCase()}格式`)
    } catch (error) {
      console.error('导出历史记录失败:', error)
      this.showToast('导出失败')
    }
  }


  private async showExportFormatDialog(): Promise<string | null> {
    return new Promise(resolve => {
      const dialog = document.createElement('div')
      dialog.className = 'export-dialog'
      dialog.innerHTML = `
        <div class="export-dialog-content">
          <h3>选择导出格式</h3>
          <div class="export-options">
            <button class="export-option" data-format="json">
              <span class="export-icon">📊</span>
              <span class="export-label">JSON</span>
              <span class="export-description">完整数据格式</span>
            </button>
            <button class="export-option" data-format="csv">
              <span class="export-icon">📈</span>
              <span class="export-label">CSV</span>
              <span class="export-description">表格数据格式</span>
            </button>
            <button class="export-option" data-format="txt">
              <span class="export-icon">📝</span>
              <span class="export-label">文本</span>
              <span class="export-description">可读文本格式</span>
            </button>
          </div>
          <div class="export-dialog-actions">
            <button class="export-cancel-btn">取消</button>
          </div>
        </div>
      `

      const closeDialog = (format: string | null) => {
        dialog.remove()
        resolve(format)
      }

      const options = dialog.querySelectorAll('.export-option')
      options.forEach(option => {
        option.addEventListener('click', () => {
          const format = (option as HTMLElement).dataset.format
          closeDialog(format || null)
        })
      })

      const cancelBtn = dialog.querySelector('.export-cancel-btn')
      cancelBtn?.addEventListener('click', () => closeDialog(null))

      dialog.addEventListener('click', e => {
        if (e.target === dialog) {
          closeDialog(null)
        }
      })

      document.body.appendChild(dialog)
    })
  }


  private convertToCSV(items: HistoryItem[]): string {
    const headers = ['时间戳', '表达式', '结果', '标签', '备注']
    const rows = items.map(item => [
      item.timestamp,
      `"${item.expression.replace(/"/g, '""')}"`,
      `"${item.result.replace(/"/g, '""')}"`,
      item.tags ? `"${item.tags.join(', ').replace(/"/g, '""')}"` : '',
      item.notes ? `"${item.notes.replace(/"/g, '""')}"` : '',
    ])

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }


  private convertToText(items: HistoryItem[]): string {
    return items
      .map(item => {
        const timestamp = new Date(item.timestamp).toLocaleString('zh-CN')
        const tags = item.tags ? ` [${item.tags.join(', ')}]` : ''
        const notes = item.notes ? `\n   备注: ${item.notes}` : ''
        return `${timestamp}${tags}\n   表达式: ${item.expression}\n   结果: ${item.result}${notes}\n`
      })
      .join('\n')
  }


  private async confirmClearHistory(): Promise<void> {
    if (confirm('确定要清空所有历史记录吗？此操作不可撤销。')) {
      await this.clearHistory()
    }
  }


  private async clearHistory(): Promise<void> {
    try {
      await TauriService.clearHistory()
    } catch (error) {
      console.error('清空历史记录失败，采用前端回退:', error)
    }

  this.history = []
  this.filteredHistory = []
  this.remoteStats = { total_items: 0, today_calculations: 0 }
  this.render()
  this.updateStats()

    if (this.config.onHistoryClear) {
      this.config.onHistoryClear()
    }

    this.showToast('历史记录已清空')
  }


  private async loadHistory(): Promise<void> {
    try {
      const [history, stats] = await Promise.all([
        TauriService.getHistory(this.config.maxItems).catch(error => {
          console.warn('获取后端历史记录失败，使用本地数据:', error)
          return null
        }),
        TauriService.getHistoryStats().catch(error => {
          console.warn('获取历史统计失败:', error)
          return null
        }),
      ])

      if (Array.isArray(history)) {
        this.setHistory(history)
      }

      if (stats) {
        this.remoteStats = stats
        this.updateStats()
      }
    } catch (error) {
      console.error('加载历史记录失败:', error)
    }
  }


  private formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) {
      return '刚刚'
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`
    } else if (diff < 86400000) {
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


  private highlightSearchTerm(text: string): string {
    if (!this.searchTerm) return text

    const regex = new RegExp(`(${this.searchTerm})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }


  private async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text)
      this.showToast('已复制到剪贴板')
    } catch (error) {
      console.error('复制失败:', error)
      this.showToast('复制失败')
    }
  }


  private showToast(message: string): void {
    const toast = document.createElement('div')
    toast.className = 'toast'
    toast.textContent = message
    toast.setAttribute('aria-live', 'polite')

    this.element.appendChild(toast)

    requestAnimationFrame(() => {
      toast.style.opacity = '1'
      toast.style.transform = 'translateY(0)'
    })

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


  private handleKeyNavigation(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.hide()
      event.preventDefault()
    }
  }


  updateTheme(theme: Theme): void {
    this.element.className = `calculator-history theme-${theme.mode}`

    Object.entries(theme.cssVariables).forEach(([property, value]) => {
      this.element.style.setProperty(property, value)
    })
  }


  handleResize(): void {
    const containerWidth = this.element.clientWidth
    if (containerWidth < 400) {
      this.element.classList.add('compact')
    } else {
      this.element.classList.remove('compact')
    }
  }


  getHistory(): HistoryItem[] {
    return [...this.history]
  }


  destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }
  }
}
