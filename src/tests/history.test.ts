import { beforeEach, describe, expect, it, vi } from 'vitest'

import { History } from '@/components/History'
import type { HistoryItem } from '@/types/calculator'

const tauriMocks = vi.hoisted(() => ({
  getHistory: vi.fn<() => Promise<HistoryItem[]>>(),
  getHistoryStats: vi.fn<() => Promise<Record<string, number>>>(),
  exportHistory: vi.fn<() => Promise<string>>(),
  clearHistory: vi.fn<() => Promise<void>>(),
  searchHistory: vi.fn<(term: string) => Promise<HistoryItem[]>>(),
  importHistory: vi.fn<(payload: string) => Promise<void>>(),
}))

vi.mock('@/utils/tauri', () => ({
  TauriService: tauriMocks,
  invoke: vi.fn(),
}))

const {
  getHistory: mockGetHistory,
  getHistoryStats: mockGetHistoryStats,
  exportHistory: mockExportHistory,
  clearHistory: mockClearHistory,
  searchHistory: mockSearchHistory,
  importHistory: mockImportHistory,
} = tauriMocks

const today = new Date().toISOString()
const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString()

const baseHistory: HistoryItem[] = [
  {
    id: '1',
    expression: '1 + 1',
    result: '2',
    timestamp: today,
  },
  {
    id: '2',
    expression: 'legacy',
    result: '42',
    timestamp: lastMonth,
  },
]

describe('History component', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    mockGetHistory.mockReset()
    mockGetHistoryStats.mockReset()
    mockExportHistory.mockReset()
    mockClearHistory.mockReset()
    mockSearchHistory.mockReset()
    mockImportHistory.mockReset()

    mockGetHistory.mockResolvedValue([...baseHistory])
    mockGetHistoryStats.mockResolvedValue({ total_items: baseHistory.length, today_calculations: 1 })
    mockSearchHistory.mockResolvedValue([])
  })

  it('loads history from backend on init', async () => {
    const container = document.createElement('div')
    const history = new History(container, { maxItems: 100 })

    await history.init()

    const items = container.querySelectorAll('.history-item')
    expect(items.length).toBe(2)
    expect(mockGetHistory).toHaveBeenCalled()

    const totalStat = container.querySelector('[data-stat="total"]')
    expect(totalStat?.textContent).toBe('2')
  })

  it('applies time filter for today results', async () => {
    const container = document.createElement('div')
    const history = new History(container, { maxItems: 100 })
    await history.init()

    const todayBtn = container.querySelector('[data-filter="today"]') as HTMLButtonElement
    todayBtn.click()

    const items = container.querySelectorAll('.history-item')
    expect(items.length).toBe(1)
    expect(items[0]?.textContent).toContain('1 + 1')
  })

  it('uses backend search results when searching', async () => {
    const container = document.createElement('div')
    const history = new History(container, { maxItems: 100 })
    await history.init()

    mockSearchHistory.mockResolvedValue([
      {
        id: 'remote-1',
        expression: 'remote result',
        result: '128',
        timestamp: today,
      },
    ])

    const searchBtn = container.querySelector('.history-search-btn') as HTMLButtonElement
    searchBtn.click()

    const input = container.querySelector('.history-search-input') as HTMLInputElement
    input.value = 'remote'
    input.dispatchEvent(new Event('input', { bubbles: true }))

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockSearchHistory).toHaveBeenCalledWith('remote')
    const items = container.querySelectorAll('.history-item')
    expect(items.length).toBe(1)
    expect(items[0]?.textContent).toContain('remote result')
  })

  it('imports history payload and refreshes data', async () => {
    const container = document.createElement('div')
    const history = new History(container, { maxItems: 100 })
    await history.init()

    const refreshedHistory: HistoryItem[] = [
      {
        id: 'imported',
        expression: '99 * 2',
        result: '198',
        timestamp: today,
      },
    ]

    mockGetHistory.mockResolvedValueOnce(refreshedHistory)
    mockGetHistoryStats.mockResolvedValueOnce({ total_items: 1, today_calculations: 1 })

    const fakeFile = {
      text: vi.fn().mockResolvedValue('{"items":[]}')
    } as unknown as File
    const importer = history as unknown as { importHistoryFile(file: File): Promise<void> }
    await importer.importHistoryFile(fakeFile)

    expect(mockImportHistory).toHaveBeenCalled()
    const items = container.querySelectorAll('.history-item')
    expect(items.length).toBe(1)
    expect(items[0]?.textContent).toContain('99 * 2')
  })
})
