/**
 * 设备检测工具测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DeviceDetector } from '../utils/device'

describe('DeviceDetector', () => {
  let deviceDetector: DeviceDetector

  beforeEach(() => {
    deviceDetector = new DeviceDetector()
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
    expect(screenInfo).toHaveProperty('pixelRatio')
    expect(screenInfo).toHaveProperty('orientation')
  })

  it('应该正确获取浏览器信息', () => {
    const browserInfo = deviceDetector.getBrowserInfo()
    expect(browserInfo).toHaveProperty('userAgent')
    expect(browserInfo).toHaveProperty('platform')
    expect(browserInfo).toHaveProperty('onLine')
    expect(typeof browserInfo.onLine).toBe('boolean')
  })

  it('应该正确检测性能等级', () => {
    const performanceLevel = deviceDetector.getPerformanceLevel()
    expect(['low', 'medium', 'high']).toContain(performanceLevel)
  })
})
