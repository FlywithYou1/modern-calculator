/**
 * 应用设置默认值
 */

import type { AppSettings } from '../types/calculator.js'

export function createDefaultAppSettings(): AppSettings {
  return {
    theme: {
      name: 'dark',
      mode: 'dark',
      type: 'builtin',
      colors: {
        primary: '#0066cc',
        secondary: '#004499',
        background: '#1a1a1a',
        surface: '#2d2d2d',
        text: '#ffffff',
        textSecondary: '#cccccc',
        accent: '#ff6b35',
        error: '#ff4d4f',
        warning: '#faad14',
        success: '#52c41a',
      },
      cssVariables: {
        '--primary-color': '#0066cc',
        '--secondary-color': '#004499',
        '--background-color': '#1a1a1a',
        '--surface-color': '#2d2d2d',
        '--text-color': '#ffffff',
        '--text-secondary-color': '#cccccc',
        '--color-accent': '#ff6b35',
        '--color-error': '#ff4d4f',
        '--color-warning': '#faad14',
        '--color-success': '#52c41a',
      },
    },
    display: {
      decimalPlaces: 10,
      scientificNotation: true,
      thousandSeparator: true,
      angleUnit: 'degrees',
      fontSize: 16,
    },
    layout: {
      buttonSize: 'medium',
      keyboardLayout: 'standard',
      compactMode: false,
      showHistory: true,
      showMemory: true,
    },
    general: {
      enableHaptic: true,
      maxHistoryItems: 100,
      autoSaveHistory: true,
      enableKeyboardShortcuts: true,
      enableAnimations: true,
    },
    advanced: {
      keyboard: {
        customShortcuts: {
          'Ctrl+Enter': 'calculate',
          'Ctrl+C': 'copy',
          'Ctrl+V': 'paste',
          'Ctrl+Z': 'undo',
          'Ctrl+Y': 'redo',
          Escape: 'clear',
        },
        hapticIntensity: 'medium',
        gestureSensitivity: 5,
        autoRepeatDelay: 500,
        autoRepeatRate: 20,
      },
      history: {
        autoCleanup: true,
        cleanupStrategy: 'count',
        cleanupThreshold: 1000,
        exportFormat: 'json',
        enableSearch: true,
        enableTags: true,
        maxTagLength: 50,
      },
      performance: {
        animationQuality: 'auto',
        maxCalculationTime: 5000,
        enableCaching: true,
        cacheSize: 50,
        enableBackgroundSync: false,
      },
      accessibility: {
        highContrast: false,
        reduceMotion: false,
        screenReaderSupport: true,
        keyboardNavigation: true,
        largeText: false,
        colorBlindMode: 'none',
      },
    },
  }
}
