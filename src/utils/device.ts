/* *
 * 设备检测工具类
 * 用于检测当前设备类型和特性，以提供最佳的用户体验 */

import type { DeviceType } from '../types/calculator'

export class DeviceDetector {
  private _deviceType: DeviceType | null = null
  private _isTouch: boolean | null = null
  private _isIOS: boolean | null = null
  private _isAndroid: boolean | null = null
  private _isMobile: boolean | null = null
  private _isTablet: boolean | null = null
  private _isDesktop: boolean | null = null

  /* *
   * 获取设备类型 */
  getDeviceType(): DeviceType {
    if (this._deviceType) {
      return this._deviceType
    }

    const userAgent = navigator.userAgent.toLowerCase()
    const screenWidth = window.screen.width
    const screenHeight = window.screen.height
    const minDimension = Math.min(screenWidth, screenHeight)

    // 检测移动设备
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
    const isMobileUA = mobileRegex.test(userAgent)

    // 检测平板设备
    const tabletRegex = /ipad|android(?!.*mobile)|tablet/i
    const isTabletUA = tabletRegex.test(userAgent)

    // 基于屏幕尺寸判断
    const isMobileSize = minDimension < 768
    const isTabletSize = minDimension >= 768 && minDimension < 1024

    // 检测触摸设备
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    // 综合判断设备类型：优先识别平板，其次手机，最后桌面
    if (isTabletUA || (isTabletSize && hasTouch)) {
      this._deviceType = 'tablet'
    } else if (isMobileUA || (isMobileSize && hasTouch)) {
      this._deviceType = 'mobile'
    } else {
      this._deviceType = 'desktop'
    }

    return this._deviceType
  }

  /* *
   * 是否为移动设备 */
  isMobile(): boolean {
    if (this._isMobile !== null) {
      return this._isMobile
    }

    this._isMobile = this.getDeviceType() === 'mobile'
    return this._isMobile
  }

  /* *
   * 是否为平板设备 */
  isTablet(): boolean {
    if (this._isTablet !== null) {
      return this._isTablet
    }

    this._isTablet = this.getDeviceType() === 'tablet'
    return this._isTablet
  }

  /* *
   * 是否为桌面设备 */
  isDesktop(): boolean {
    if (this._isDesktop !== null) {
      return this._isDesktop
    }

    this._isDesktop = this.getDeviceType() === 'desktop'
    return this._isDesktop
  }

  /* *
   * 是否支持触摸 */
  isTouch(): boolean {
    if (this._isTouch !== null) {
      return this._isTouch
    }

    this._isTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (window as typeof window & { DocumentTouch?: unknown }).DocumentTouch !== undefined
    return this._isTouch
  }

  /* *
   * 是否为 iOS 设备 */
  isIOS(): boolean {
    if (this._isIOS !== null) {
      return this._isIOS
    }

    const userAgent = navigator.userAgent.toLowerCase()
    this._isIOS =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    return this._isIOS
  }

  /* *
   * 是否为 Android 设备 */
  isAndroid(): boolean {
    if (this._isAndroid !== null) {
      return this._isAndroid
    }

    this._isAndroid = /android/.test(navigator.userAgent.toLowerCase())
    return this._isAndroid
  }

  /* *
   * 获取设备像素比 */
  getPixelRatio(): number {
    return window.devicePixelRatio || 1
  }

  /* *
   * 是否为高DPI设备 */
  isHighDPI(): boolean {
    return this.getPixelRatio() > 1
  }

  /* *
   * 获取屏幕尺寸信息 */
  getScreenInfo() {
    return {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      pixelRatio: this.getPixelRatio(),
      orientation: this.getOrientation(),
    }
  }

  /* *
   * 获取屏幕方向 */
  getOrientation(): 'portrait' | 'landscape' {
    const orientation = window.screen.orientation?.angle ?? 0
    return Math.abs(orientation) === 90 ? 'landscape' : 'portrait'
  }

  /* *
   * 是否支持振动 */
  supportsVibration(): boolean {
    return 'vibrate' in navigator
  }

  /* *
   * 是否支持全屏 */
  supportsFullscreen(): boolean {
    const element = document.documentElement as HTMLElement & {
      requestFullscreen?: () => Promise<void>
      webkitRequestFullscreen?: () => Promise<void>
      mozRequestFullScreen?: () => Promise<void>
      msRequestFullscreen?: () => Promise<void>
    }
    return !!(
      element.requestFullscreen ||
      element.webkitRequestFullscreen ||
      element.mozRequestFullScreen ||
      element.msRequestFullscreen
    )
  }

  /* *
   * 是否支持 Service Worker */
  supportsServiceWorker(): boolean {
    return 'serviceWorker' in navigator
  }

  /* *
   * 是否在 Tauri 环境中运行 */
  isTauri(): boolean {
    return !!(window as typeof window & { __TAURI__?: unknown }).__TAURI__
  }

  /* *
   * 获取浏览器信息 */
  getBrowserInfo() {
    const userAgent = navigator.userAgent

    // 检测主要浏览器
    const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor)
    const isFirefox = /Firefox/.test(userAgent)
    const isSafari = /Safari/.test(userAgent) && /Apple Computer/.test(navigator.vendor)
    const isEdge = /Edg/.test(userAgent)

    return {
      userAgent,
      isChrome,
      isFirefox,
      isSafari,
      isEdge,
      language: navigator.language,
      languages: navigator.languages,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      // 一些环境可能不存在 doNotTrack，统一返回字符串或 null
      doNotTrack: (navigator as Navigator & { doNotTrack?: string }).doNotTrack ?? null,
    }
  }

  /* *
   * 获取设备性能等级估算 */
  getPerformanceLevel(): 'low' | 'medium' | 'high' {
    const screenSize = window.screen.width * window.screen.height
    const cores = navigator.hardwareConcurrency || 2
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 2

    // 简单的性能评分算法
    let score = 0

    // CPU 核心数评分
    if (cores >= 8) score += 3
    else if (cores >= 4) score += 2
    else score += 1

    // 内存评分（低内存=1, 中等=2, 高=3），测试中期望 1GB 为 low/medium 范围，8GB 为 high
    if (memory >= 8) score += 3
    else if (memory >= 2) score += 2
    else score += 1

    // 屏幕分辨率评分
    if (screenSize >= 2073600)
      score += 3 // >= 1920x1080
    else if (screenSize >= 921600)
      score += 2 // >= 1280x720
    else score += 1

  // 设备类型调整（降低桌面对低内存的过度加分导致的误判）
  if (this.isDesktop()) score += 0.5
  else if (this.isTablet()) score += 0.25

    // 转换为等级
    if (score >= 8.5) return 'high'
    else if (score >= 5) return 'medium'
    else return 'low'
  }

  /* *
   * 获取推荐的动画设置 */
  getRecommendedAnimationSettings() {
    const performanceLevel = this.getPerformanceLevel()
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      return {
        enableAnimations: false,
        animationDuration: 0,
        enableParticles: false,
        enableTransitions: true,
      }
    }

    switch (performanceLevel) {
      case 'high':
        return {
          enableAnimations: true,
          animationDuration: 300,
          enableParticles: true,
          enableTransitions: true,
        }
      case 'medium':
        return {
          enableAnimations: true,
          animationDuration: 200,
          enableParticles: false,
          enableTransitions: true,
        }
      case 'low':
        return {
          enableAnimations: false,
          animationDuration: 100,
          enableParticles: false,
          enableTransitions: true,
        }
    }
  }

  /* *
   * 重置缓存的检测结果 */
  reset(): void {
    this._deviceType = null
    this._isTouch = null
    this._isIOS = null
    this._isAndroid = null
    this._isMobile = null
    this._isTablet = null
    this._isDesktop = null
  }
}
