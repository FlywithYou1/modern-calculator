/**
 * 测试环境设置文件
 * 配置全局测试环境和模拟
 */

import { vi, beforeEach } from 'vitest'

// 模拟 Tauri API
Object.defineProperty(window, '__TAURI__', {
  value: true,
  writable: true,
})

// 模拟 matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// 模拟 ResizeObserver
;(globalThis as typeof globalThis & { ResizeObserver?: unknown }).ResizeObserver = vi
  .fn()
  .mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

// 模拟 IntersectionObserver
;(globalThis as typeof globalThis & { IntersectionObserver?: unknown }).IntersectionObserver = vi
  .fn()
  .mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

// 模拟 navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: vi.fn(),
})

// 模拟 localStorage
const storageData = new Map<string, string>()

const getItemMock = vi.fn((key: string) => (storageData.has(key) ? storageData.get(key)! : null))
const setItemMock = vi.fn((key: string, value: string) => {
  storageData.set(key, value)
})
const removeItemMock = vi.fn((key: string) => {
  storageData.delete(key)
})
const clearMock = vi.fn(() => {
  storageData.clear()
})
const keyMock = vi.fn((index: number) => Array.from(storageData.keys())[index] ?? null)

const localStorageMock: Storage = {
  getItem: getItemMock,
  setItem: setItemMock,
  removeItem: removeItemMock,
  clear: clearMock,
  get length() {
    return storageData.size
  },
  key: keyMock,
}
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

beforeEach(() => {
  storageData.clear()
  getItemMock.mockClear()
  setItemMock.mockClear()
  removeItemMock.mockClear()
  clearMock.mockClear()
  keyMock.mockClear()
})

// 模拟 console 方法以减少测试输出噪音
;(globalThis as typeof globalThis & { console?: unknown }).console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

// 设置测试环境的默认超时
vi.setConfig({
  testTimeout: 10000,
})
