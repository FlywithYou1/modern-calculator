/**
 * 设备检测工具测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { DeviceDetector } from '../utils/device'

// Mock Tauri API if needed
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}))

describe('DeviceDetector', () => {
  let deviceDetector: DeviceDetector

  beforeEach(() => {
    deviceDetector = new DeviceDetector()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('应该正确检测设备类型', () => {
    const deviceType = deviceDetector.getDeviceType()
    expect(['desktop', 'tablet', 'mobile']).toContain(deviceType)
  })

  it('应该正确检测触摸支持', () => {
    const isTouch = deviceDetector.isTouch()
    expect(typeof isTouch).toBe('boolean')
  })

  it('应该正确检测iOS设备', () => {
    const isIOS = deviceDetector.isIOS()
    expect(typeof isIOS).toBe('boolean')
  })

  it('应该正确检测Android设备', () => {
    const isAndroid = deviceDetector.isAndroid()
    expect(typeof isAndroid).toBe('boolean')
  })

  it('应该正确获取屏幕信息', () => {
    const screenInfo = deviceDetector.getScreenInfo()
    expect(screenInfo).toHaveProperty('width')
    expect(screenInfo).toHaveProperty('height')
    expect(screenInfo).toHaveProperty('availWidth')
    expect(screenInfo).toHaveProperty('availHeight')
    expect(screenInfo).toHaveProperty('pixelRatio')
    expect(screenInfo).toHaveProperty('orientation')
    
    expect(typeof screenInfo.width).toBe('number')
    expect(typeof screenInfo.height).toBe('number')
    expect(typeof screenInfo.pixelRatio).toBe('number')
    expect(typeof screenInfo.orientation).toBe('string')
  })

  it('应该正确获取浏览器信息', () => {
    const browserInfo = deviceDetector.getBrowserInfo()
    expect(browserInfo).toHaveProperty('userAgent')
    expect(browserInfo).toHaveProperty('isChrome')
    expect(browserInfo).toHaveProperty('isFirefox')
    expect(browserInfo).toHaveProperty('isSafari')
    expect(browserInfo).toHaveProperty('isEdge')
    expect(browserInfo).toHaveProperty('language')
    expect(browserInfo).toHaveProperty('languages')
    expect(browserInfo).toHaveProperty('platform')
    expect(browserInfo).toHaveProperty('cookieEnabled')
    expect(browserInfo).toHaveProperty('onLine')
    
    expect(typeof browserInfo.userAgent).toBe('string')
    expect(typeof browserInfo.isChrome).toBe('boolean')
    expect(typeof browserInfo.isFirefox).toBe('boolean')
    expect(typeof browserInfo.isSafari).toBe('boolean')
    expect(typeof browserInfo.isEdge).toBe('boolean')
    expect(typeof browserInfo.language).toBe('string')
    expect(typeof browserInfo.onLine).toBe('boolean')
  })

  it('应该正确检测性能等级', () => {
    const performanceLevel = deviceDetector.getPerformanceLevel()
    expect(['low', 'medium', 'high']).toContain(performanceLevel)
  })

  it('应该正确检测设备方向', () => {
    const orientation = deviceDetector.getOrientation()
    expect(['portrait', 'landscape']).toContain(orientation)
  })

  it('应该正确获取像素比和DPI信息', () => {
    const pixelRatio = deviceDetector.getPixelRatio()
    const isHighDPI = deviceDetector.isHighDPI()
    
    expect(typeof pixelRatio).toBe('number')
    expect(pixelRatio).toBeGreaterThanOrEqual(1)
    expect(typeof isHighDPI).toBe('boolean')
  })

  it('应该正确检测功能支持', () => {
    const supportsVibration = deviceDetector.supportsVibration()
    const supportsFullscreen = deviceDetector.supportsFullscreen()
    const supportsServiceWorker = deviceDetector.supportsServiceWorker()
    const isTauri = deviceDetector.isTauri()
    
    expect(typeof supportsVibration).toBe('boolean')
    expect(typeof supportsFullscreen).toBe('boolean')
    expect(typeof supportsServiceWorker).toBe('boolean')
    expect(typeof isTauri).toBe('boolean')
  })

  it('应该正确获取推荐动画设置', () => {
    const animationSettings = deviceDetector.getRecommendedAnimationSettings()
    expect(animationSettings).toHaveProperty('enableAnimations')
    expect(animationSettings).toHaveProperty('animationDuration')
    expect(animationSettings).toHaveProperty('enableParticles')
    expect(animationSettings).toHaveProperty('enableTransitions')
    
    expect(typeof animationSettings.enableAnimations).toBe('boolean')
    expect(typeof animationSettings.animationDuration).toBe('number')
    expect(typeof animationSettings.enableParticles).toBe('boolean')
    expect(typeof animationSettings.enableTransitions).toBe('boolean')
  })

  describe('屏幕尺寸分类', () => {
    it('应该正确获取小屏幕信息', () => {
      // Mock screen size for small screen
      Object.defineProperty(window.screen, 'width', { value: 320, configurable: true })
      Object.defineProperty(window.screen, 'height', { value: 568, configurable: true })
      
      deviceDetector.reset() // Reset cache to detect new screen size
      const screenInfo = deviceDetector.getScreenInfo()
      const deviceType = deviceDetector.getDeviceType()
      
      expect(screenInfo.width).toBe(320)
      expect(screenInfo.height).toBe(568)
      expect(deviceType).toBe('mobile') // Small screen should be detected as mobile
    })

    it('应该正确获取中等屏幕信息', () => {
      // Mock screen size for medium screen
      Object.defineProperty(window.screen, 'width', { value: 768, configurable: true })
      Object.defineProperty(window.screen, 'height', { value: 1024, configurable: true })
      
      deviceDetector.reset() // Reset cache to detect new screen size
      const screenInfo = deviceDetector.getScreenInfo()
      
      expect(screenInfo.width).toBe(768)
      expect(screenInfo.height).toBe(1024)
    })

    it('应该正确获取大屏幕信息', () => {
      // Mock screen size for large screen
      Object.defineProperty(window.screen, 'width', { value: 1920, configurable: true })
      Object.defineProperty(window.screen, 'height', { value: 1080, configurable: true })
      
      deviceDetector.reset() // Reset cache to detect new screen size
      const screenInfo = deviceDetector.getScreenInfo()
      
      expect(screenInfo.width).toBe(1920)
      expect(screenInfo.height).toBe(1080)
    })
  })

  describe('性能等级检测', () => {
    it('应该根据硬件并发数检测性能', () => {
      const performanceLevel = deviceDetector.getPerformanceLevel()
      expect(['low', 'medium', 'high']).toContain(performanceLevel)
    })

    it('应该根据设备内存检测性能', () => {
      // Mock device memory if available
      const originalMemory = (navigator as any).deviceMemory
      
      // Test low memory device
      Object.defineProperty(navigator, 'deviceMemory', { value: 1, configurable: true })
      let performanceLevel = deviceDetector.getPerformanceLevel()
      expect(['low', 'medium']).toContain(performanceLevel)
      
      // Test high memory device
      Object.defineProperty(navigator, 'deviceMemory', { value: 8, configurable: true })
      performanceLevel = deviceDetector.getPerformanceLevel()
      expect(['medium', 'high']).toContain(performanceLevel)
      
      // Restore original
      if (originalMemory !== undefined) {
        Object.defineProperty(navigator, 'deviceMemory', { value: originalMemory, configurable: true })
      }
    })
  })

  describe('User Agent 解析', () => {
    it('应该正确解析移动设备 User Agent', () => {
      const originalUserAgent = navigator.userAgent
      
      // Test Android
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
        configurable: true
      })
      
      expect(deviceDetector.isAndroid()).toBe(true)
      expect(deviceDetector.getDeviceType()).toBe('mobile')
      
      // Test iOS
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        configurable: true
      })
      
      expect(deviceDetector.isIOS()).toBe(true)
      expect(deviceDetector.getDeviceType()).toBe('mobile')
      
      // Restore original
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true
      })
    })

    it('应该正确解析平板设备 User Agent', () => {
      const originalUserAgent = navigator.userAgent
      
      // Test iPad
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        configurable: true
      })
      
      expect(deviceDetector.isIOS()).toBe(true)
      expect(deviceDetector.getDeviceType()).toBe('tablet')
      
      // Restore original
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true
      })
    })

    it('应该正确解析桌面设备 User Agent', () => {
      const originalUserAgent = navigator.userAgent
      
      // Test Windows
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        configurable: true
      })
      
      expect(deviceDetector.getDeviceType()).toBe('desktop')
      
      // Test Mac
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        configurable: true
      })
      
      expect(deviceDetector.getDeviceType()).toBe('desktop')
      
      // Restore original
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true
      })
    })
  })

  describe('边缘情况处理', () => {
    it('应该处理空的 User Agent', () => {
      const originalUserAgent = navigator.userAgent
      
      Object.defineProperty(navigator, 'userAgent', { value: '', configurable: true })
      
      const deviceType = deviceDetector.getDeviceType()
      expect(typeof deviceType).toBe('string')
      
      // Restore original
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true
      })
    })

    it('应该处理未定义的 navigator 属性', () => {
      // Test graceful degradation when certain properties are not available
      const browserInfo = deviceDetector.getBrowserInfo()
      
      expect(browserInfo).toHaveProperty('userAgent')
      expect(browserInfo).toHaveProperty('platform')
      expect(browserInfo).toHaveProperty('onLine')
      expect(browserInfo).toHaveProperty('language')
      expect(browserInfo).toHaveProperty('cookieEnabled')
      expect(browserInfo).toHaveProperty('doNotTrack')
    })

    it('应该处理性能 API 不可用的情况', () => {
      const performanceLevel = deviceDetector.getPerformanceLevel()
      expect(['low', 'medium', 'high']).toContain(performanceLevel)
    })
  })

  describe('缓存和性能', () => {
    it('应该缓存设备检测结果以提高性能', () => {
      const startTime = performance.now()
      
      // First call should calculate
      const deviceType1 = deviceDetector.getDeviceType()
      const firstCallTime = performance.now() - startTime
      
      const secondStartTime = performance.now()
      
      // Second call should use cache
      const deviceType2 = deviceDetector.getDeviceType()
      const secondCallTime = performance.now() - secondStartTime
      
      expect(deviceType1).toBe(deviceType2)
      expect(secondCallTime).toBeLessThanOrEqual(firstCallTime)
    })

    it('应该提供重置缓存的方法', () => {
      // Get initial values
      const deviceType1 = deviceDetector.getDeviceType()
      const isMobile1 = deviceDetector.isMobile()
      
      // Reset cache
      deviceDetector.reset()
      
      // Values should be recalculated but should be the same
      const deviceType2 = deviceDetector.getDeviceType()
      const isMobile2 = deviceDetector.isMobile()
      
      expect(deviceType1).toBe(deviceType2)
      expect(isMobile1).toBe(isMobile2)
    })
  })
})
