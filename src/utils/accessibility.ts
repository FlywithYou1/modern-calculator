


export interface AccessibilityConfig {
  screenReaderSupport: boolean
  keyboardNavigation: boolean
  highContrast: boolean
  reduceMotion: boolean
  largeText: boolean
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
}

export class AccessibilityManager {
  private config: AccessibilityConfig = {
    screenReaderSupport: true,
    keyboardNavigation: true,
    highContrast: false,
    reduceMotion: false,
    largeText: false,
    colorBlindMode: 'none',
  }

  private focusableElements: HTMLElement[] = []
  private currentFocusIndex = 0
  private isNavigating = false

  constructor() {
    this.loadConfig()
    this.setupKeyboardNavigation()
    this.applyAccessibilitySettings()
  }


  private loadConfig(): void {
    try {
      const stored = localStorage.getItem('calculator-accessibility')
      if (stored) {
        this.config = { ...this.config, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.warn('读取无障碍配置失败:', error)
    }
  }


  private saveConfig(): void {
    try {
      localStorage.setItem('calculator-accessibility', JSON.stringify(this.config))
    } catch (error) {
      console.error('保存无障碍配置失败:', error)
    }
  }


  private setupKeyboardNavigation(): void {
    if (!this.config.keyboardNavigation) return

    document.addEventListener('keydown', (event) => {
      if (this.isNavigating) return

      switch (event.key) {
        case 'Tab':
          this.handleTabNavigation(event)
          break
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          this.handleArrowNavigation(event)
          break
        case 'Enter':
        case ' ':
          this.handleAction(event)
          break
        case 'Escape':
          this.handleEscape(event)
          break
      }
    })
  }


  private handleTabNavigation(event: KeyboardEvent): void {
    if (!this.config.keyboardNavigation) return

    this.isNavigating = true
    this.focusableElements = Array.from(
      document.querySelectorAll<HTMLElement>(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => el.offsetParent !== null) 

    if (this.focusableElements.length === 0) return

    if (event.shiftKey) {
      this.currentFocusIndex = 
        (this.currentFocusIndex - 1 + this.focusableElements.length) % this.focusableElements.length
    } else {
      this.currentFocusIndex = (this.currentFocusIndex + 1) % this.focusableElements.length
    }

    const targetElement = this.focusableElements[this.currentFocusIndex]
    if (targetElement) {
      targetElement.focus()
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }

    event.preventDefault()
    setTimeout(() => {
      this.isNavigating = false
    }, 100)
  }


  private handleArrowNavigation(event: KeyboardEvent): void {
    if (!this.config.keyboardNavigation) return

    const focusedElement = document.activeElement as HTMLElement
    if (!focusedElement) return

    if (focusedElement.closest('.calculator-keyboard')) {
      this.navigateCalculatorKeyboard(event, focusedElement)
    }
  }


  private navigateCalculatorKeyboard(event: KeyboardEvent, focusedElement: HTMLElement): void {
    const keyboard = focusedElement.closest('.calculator-keyboard')
    if (!keyboard) return

    const buttons = Array.from(keyboard.querySelectorAll<HTMLElement>('button[tabindex]'))
    const currentIndex = buttons.indexOf(focusedElement)
    if (currentIndex === -1) return

    let nextIndex = currentIndex
    const rowLength = 5 

    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % buttons.length
        break
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + buttons.length) % buttons.length
        break
      case 'ArrowDown':
        nextIndex = Math.min(currentIndex + rowLength, buttons.length - 1)
        break
      case 'ArrowUp':
        nextIndex = Math.max(currentIndex - rowLength, 0)
        break
    }

    if (nextIndex !== currentIndex && buttons[nextIndex]) {
      buttons[nextIndex]?.focus()
      event.preventDefault()
    }
  }


  private handleAction(event: KeyboardEvent): void {
    const focusedElement = document.activeElement as HTMLElement
    if (focusedElement && focusedElement.tagName === 'BUTTON') {
      focusedElement.click()
      event.preventDefault()
    }
  }


  private handleEscape(event: KeyboardEvent): void {
    const modals = document.querySelectorAll<HTMLElement>('[role="dialog"], .modal, .panel')
    for (const modal of Array.from(modals)) {
      if (modal.style.display !== 'none' && modal.style.display !== '') {
        const closeBtn = modal.querySelector<HTMLElement>('[aria-label*="关闭"], .close-btn')
        if (closeBtn) {
          closeBtn.click()
          event.preventDefault()
          break
        }
      }
    }
  }


  private applyAccessibilitySettings(): void {
    const root = document.documentElement

    if (this.config.highContrast) {
      root.setAttribute('data-high-contrast', 'true')
    } else {
      root.removeAttribute('data-high-contrast')
    }

    if (this.config.reduceMotion) {
      root.setAttribute('data-reduce-motion', 'true')
    } else {
      root.removeAttribute('data-reduce-motion')
    }

    if (this.config.largeText) {
      root.setAttribute('data-large-text', 'true')
    } else {
      root.removeAttribute('data-large-text')
    }

    if (this.config.colorBlindMode !== 'none') {
      root.setAttribute('data-color-blind', this.config.colorBlindMode)
    } else {
      root.removeAttribute('data-color-blind')
    }
  }


  updateConfig(newConfig: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.applyAccessibilitySettings()
    this.saveConfig()
  }


  getConfig(): AccessibilityConfig {
    return { ...this.config }
  }


  enableScreenReaderSupport(): void {
    this.updateConfig({ screenReaderSupport: true })
  }


  disableScreenReaderSupport(): void {
    this.updateConfig({ screenReaderSupport: false })
  }


  enableKeyboardNavigation(): void {
    this.updateConfig({ keyboardNavigation: true })
  }


  disableKeyboardNavigation(): void {
    this.updateConfig({ keyboardNavigation: false })
  }


  enableHighContrast(): void {
    this.updateConfig({ highContrast: true })
  }


  disableHighContrast(): void {
    this.updateConfig({ highContrast: false })
  }


  enableReduceMotion(): void {
    this.updateConfig({ reduceMotion: true })
  }


  disableReduceMotion(): void {
    this.updateConfig({ reduceMotion: false })
  }


  enableLargeText(): void {
    this.updateConfig({ largeText: true })
  }


  disableLargeText(): void {
    this.updateConfig({ largeText: false })
  }


  setColorBlindMode(mode: AccessibilityConfig['colorBlindMode']): void {
    this.updateConfig({ colorBlindMode: mode })
  }


  speak(text: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.config.screenReaderSupport) return

    const ariaLive = document.createElement('div')
    ariaLive.setAttribute('aria-live', priority)
    ariaLive.setAttribute('aria-atomic', 'true')
    ariaLive.className = 'sr-only'
    ariaLive.textContent = text

    document.body.appendChild(ariaLive)

    setTimeout(() => {
      if (ariaLive.parentNode) {
        ariaLive.parentNode.removeChild(ariaLive)
      }
    }, 1000)
  }


  focusElement(element: HTMLElement): void {
    if (!this.config.keyboardNavigation) return

    element.focus()
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }


  getAccessibilityStatus(): {
    isAccessible: boolean
    issues: string[]
    suggestions: string[]
  } {
    const issues: string[] = []
    const suggestions: string[] = []

    const elementsWithoutAria = document.querySelectorAll<HTMLElement>(
      'button:not([aria-label]), input:not([aria-label]):not([type="hidden"]), [role]:not([aria-label])'
    )

    if (elementsWithoutAria.length > 0) {
      issues.push(`${elementsWithoutAria.length} 个元素缺少ARIA标签`)
      suggestions.push('为所有交互元素添加适当的ARIA标签')
    }

    const lowContrastElements = this.checkColorContrast()
    if (lowContrastElements.length > 0) {
      issues.push(`${lowContrastElements.length} 个元素颜色对比度不足`)
      suggestions.push('提高文本与背景的颜色对比度')
    }

    const nonFocusableButtons = document.querySelectorAll<HTMLElement>(
      'button:not([tabindex]):not([disabled])'
    )

    if (nonFocusableButtons.length > 0) {
      issues.push(`${nonFocusableButtons.length} 个按钮无法通过键盘访问`)
      suggestions.push('为所有按钮添加tabindex属性')
    }

    return {
      isAccessible: issues.length === 0,
      issues,
      suggestions,
    }
  }


  private checkColorContrast(): HTMLElement[] {
    const elements: HTMLElement[] = []
    const textElements = document.querySelectorAll<HTMLElement>('*')

    for (const element of Array.from(textElements)) {
      const style = window.getComputedStyle(element)
      const color = style.color
      const backgroundColor = style.backgroundColor

      if (color && backgroundColor && color !== backgroundColor) {
        elements.push(element)
      }
    }

    return elements
  }


  resetToDefaults(): void {
    this.config = {
      screenReaderSupport: true,
      keyboardNavigation: true,
      highContrast: false,
      reduceMotion: false,
      largeText: false,
      colorBlindMode: 'none',
    }
    this.applyAccessibilitySettings()
    this.saveConfig()
  }


  destroy(): void {
    document.removeEventListener('keydown', this.handleTabNavigation)
  }
}


export const accessibilityManager = new AccessibilityManager()


if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).accessibilityManager = accessibilityManager
}



const screenReaderStyles = `
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

[data-high-contrast] {
  --color-primary: #ffff00;
  --color-secondary: #ffffff;
  --color-background: #000000;
  --color-surface: #000000;
  --color-text: #ffffff;
  --color-text-secondary: #ffff00;
  --color-accent: #00ff00;
  --color-error: #ff0000;
  --color-warning: #ffff00;
  --color-success: #00ff00;
}

[data-reduce-motion] * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}

[data-large-text] {
  font-size: 1.25em;
}

[data-color-blind="protanopia"] {
  filter: url('#protanopia-filter');
}

[data-color-blind="deuteranopia"] {
  filter: url('#deuteranopia-filter');
}

[data-color-blind="tritanopia"] {
  filter: url('#tritanopia-filter');
}
`


const style = document.createElement('style')
style.textContent = screenReaderStyles
document.head.appendChild(style)