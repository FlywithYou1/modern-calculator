


import type { DeviceType } from '@/types/calculator'

export class DeviceDetector {
  private _deviceType: DeviceType | null = null
  private _isTouch: boolean | null = null
  private _isIOS: boolean | null = null
  private _isAndroid: boolean | null = null
  private _isMobile: boolean | null = null
  private _isTablet: boolean | null = null
  private _isDesktop: boolean | null = null


  getDeviceType(): DeviceType {
    if (this._deviceType) {
      return this._deviceType
    }

    const userAgent = navigator.userAgent.toLowerCase()
    const screenWidth = window.screen.width
    const screenHeight = window.screen.height
    const minDimension = Math.min(screenWidth, screenHeight)

    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
    const isMobileUA = mobileRegex.test(userAgent)

    const tabletRegex = /ipad|android(?!.*mobile)|tablet/i
    const isTabletUA = tabletRegex.test(userAgent)

    const isMobileSize = minDimension < 768
    const isTabletSize = minDimension >= 768 && minDimension < 1024

    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    if (isTabletUA || (isTabletSize && hasTouch)) {
      this._deviceType = 'tablet'
    } else if (isMobileUA || (isMobileSize && hasTouch)) {
      this._deviceType = 'mobile'
    } else {
      this._deviceType = 'desktop'
    }

    return this._deviceType
  }


  isMobile(): boolean {
    if (this._isMobile !== null) {
      return this._isMobile
    }

    this._isMobile = this.getDeviceType() === 'mobile'
    return this._isMobile
  }


  isTablet(): boolean {
    if (this._isTablet !== null) {
      return this._isTablet
    }

    this._isTablet = this.getDeviceType() === 'tablet'
    return this._isTablet
  }


  isDesktop(): boolean {
    if (this._isDesktop !== null) {
      return this._isDesktop
    }

    this._isDesktop = this.getDeviceType() === 'desktop'
    return this._isDesktop
  }


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


  isAndroid(): boolean {
    if (this._isAndroid !== null) {
      return this._isAndroid
    }

    this._isAndroid = /android/.test(navigator.userAgent.toLowerCase())
    return this._isAndroid
  }


  getPixelRatio(): number {
    return window.devicePixelRatio || 1
  }


  isHighDPI(): boolean {
    return this.getPixelRatio() > 1
  }


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


  getOrientation(): 'portrait' | 'landscape' {
    const orientation = window.screen.orientation?.angle ?? 0
    return Math.abs(orientation) === 90 ? 'landscape' : 'portrait'
  }


  supportsVibration(): boolean {
    return 'vibrate' in navigator
  }


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


  supportsServiceWorker(): boolean {
    return 'serviceWorker' in navigator
  }


  isTauri(): boolean {
    return !!(window as typeof window & { __TAURI__?: unknown }).__TAURI__
  }


  getBrowserInfo() {
    const userAgent = navigator.userAgent

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
      doNotTrack: (navigator as Navigator & { doNotTrack?: string }).doNotTrack ?? null,
    }
  }


  getPerformanceLevel(): 'low' | 'medium' | 'high' {
    const screenSize = window.screen.width * window.screen.height
    const cores = navigator.hardwareConcurrency || 2
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 2

    let score = 0

    if (cores >= 8) score += 3
    else if (cores >= 4) score += 2
    else score += 1

    if (memory >= 8) score += 3
    else if (memory >= 2) score += 2
    else score += 1

    if (screenSize >= 2073600)
      score += 3 
    else if (screenSize >= 921600)
      score += 2 
    else score += 1

  if (this.isDesktop()) score += 0.5
  else if (this.isTablet()) score += 0.25

    if (score >= 8.5) return 'high'
    else if (score >= 5) return 'medium'
    else return 'low'
  }


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
