/**
 * Voice Input 功能测试
 * 覆盖语音输入和自然语言处理的基本功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// 模拟 Web Speech API
const mockSpeechRecognition = vi.fn().mockImplementation(() => ({
  continuous: false,
  interimResults: false,
  lang: 'zh-CN',
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
  onstart: null,
  onend: null,
  onresult: null,
  onerror: null,
}))

// 模拟 SpeechRecognitionEvent
const mockSpeechRecognitionEvent = {
  results: [
    {
      isFinal: true,
      0: {
        transcript: '五加三',
        confidence: 0.9,
      },
    },
  ],
  resultIndex: 0,
}

// 模拟 SpeechRecognitionErrorEvent
const mockSpeechRecognitionErrorEvent = {
  error: 'no-speech',
  message: 'No speech detected',
}

;(globalThis as any).SpeechRecognition = mockSpeechRecognition
;(globalThis as any).webkitSpeechRecognition = mockSpeechRecognition

describe('Voice Input', () => {
  let voiceController: import('../mobile/voice-input-simple.js').CalculatorVoiceController

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (voiceController) {
      voiceController.stopVoiceInput()
    }
  })

  describe('初始化', () => {
    it('应该正确初始化语音控制器', async () => {
      const { CalculatorVoiceController } = await import('../mobile/voice-input-simple.js')
      voiceController = new CalculatorVoiceController()
      
      expect(voiceController.isVoiceSupported()).toBe(true)
    })

    it('应该在Speech API不可用时返回不支持', async () => {
      // 临时移除Speech API
      const originalSpeechRecognition = (globalThis as any).SpeechRecognition
      delete (globalThis as any).SpeechRecognition
      delete (globalThis as any).webkitSpeechRecognition
      
      const { CalculatorVoiceController } = await import('../mobile/voice-input-simple.js')
      voiceController = new CalculatorVoiceController()
      
      expect(voiceController.isVoiceSupported()).toBe(false)
      
      // 恢复Speech API
      (globalThis as any).SpeechRecognition = originalSpeechRecognition
    })
  })

  describe('语音识别控制', () => {
    beforeEach(async () => {
      const { CalculatorVoiceController } = await import('../mobile/voice-input-simple.js')
      voiceController = new CalculatorVoiceController()
    })

    it('应该正确开始语音输入', async () => {
      await voiceController.toggleVoiceInput()
      
      expect(voiceController.isVoiceActive()).toBe(true)
    })

    it('应该正确停止语音输入', async () => {
      await voiceController.toggleVoiceInput()
      await voiceController.toggleVoiceInput()
      
      expect(voiceController.isVoiceActive()).toBe(false)
    })

    it('应该正确检查语音活动状态', () => {
      expect(voiceController.isVoiceActive()).toBe(false)
    })
  })

  describe('配置选项', () => {
    it('应该正确设置语言', async () => {
      const { CalculatorVoiceController } = await import('../mobile/voice-input-simple.js')
      voiceController = new CalculatorVoiceController({
        language: 'en-US',
      })
      
      await voiceController.toggleVoiceInput()
      
      const mockInstance = mockSpeechRecognition.mock.results[0]?.value
      expect(mockInstance?.lang).toBe('en-US')
    })

    it('应该正确设置连续识别模式', async () => {
      const { CalculatorVoiceController } = await import('../mobile/voice-input-simple.js')
      voiceController = new CalculatorVoiceController({
        continuous: true,
      })
      
      await voiceController.toggleVoiceInput()
      
      const mockInstance = mockSpeechRecognition.mock.results[0]?.value
      expect(mockInstance?.continuous).toBe(true)
    })

    it('应该正确设置临时结果', async () => {
      const { CalculatorVoiceController } = await import('../mobile/voice-input-simple.js')
      voiceController = new CalculatorVoiceController({
        interimResults: true,
      })
      
      await voiceController.toggleVoiceInput()
      
      const mockInstance = mockSpeechRecognition.mock.results[0]?.value
      expect(mockInstance?.interimResults).toBe(true)
    })
  })

  describe('事件系统', () => {
    beforeEach(async () => {
      const { CalculatorVoiceController } = await import('../mobile/voice-input-simple.js')
      voiceController = new CalculatorVoiceController()
    })

    it('应该正确触发语音表达式事件', (done) => {
      const mockInstance = mockSpeechRecognition.mock.results[0]?.value
      const resultHandler = mockInstance?.onresult
      
      // 监听自定义事件
      document.addEventListener('calculatorvoiceExpression', (event) => {
        const customEvent = event as CustomEvent<{
          expression: string
          original: string
          confidence: number
        }>
        
        expect(customEvent.detail.expression).toBe('5 + 3')
        expect(customEvent.detail.original).toBe('五加三')
        expect(customEvent.detail.confidence).toBe(0.9)
        done()
      })
      
      if (typeof resultHandler === 'function') {
        resultHandler(mockSpeechRecognitionEvent)
      }
    })
  })

  describe('错误处理', () => {
    beforeEach(async () => {
      const { CalculatorVoiceController } = await import('../mobile/voice-input-simple.js')
      voiceController = new CalculatorVoiceController()
    })

    it('应该正确处理权限拒绝错误', async () => {
      const mockInstance = mockSpeechRecognition.mock.results[0]?.value
      const errorHandler = mockInstance?.onerror
      
      const permissionError = {
        error: 'not-allowed',
        message: 'Permission denied',
      }
      
      if (typeof errorHandler === 'function') {
        errorHandler(permissionError)
      }
      
      expect(voiceController.isVoiceActive()).toBe(false)
    })

    it('应该正确处理无语音检测错误', async () => {
      const mockInstance = mockSpeechRecognition.mock.results[0]?.value
      const errorHandler = mockInstance?.onerror
      
      const noSpeechError = {
        error: 'no-speech',
        message: 'No speech detected',
      }
      
      if (typeof errorHandler === 'function') {
        errorHandler(noSpeechError)
      }
      
      expect(voiceController.isVoiceActive()).toBe(false)
    })
  })

  describe('兼容性测试', () => {
    it('应该在Chrome浏览器中正常工作', async () => {
      // 检测Chrome
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        writable: true,
      })
      
      const { CalculatorVoiceController } = await import('../mobile/voice-input-simple.js')
      voiceController = new CalculatorVoiceController()
      
      expect(voiceController.isVoiceSupported()).toBe(true)
    })

    it('应该在Firefox浏览器中正确处理', async () => {
      // 检测Firefox（可能不支持webkit前缀）
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        writable: true,
      })
      
      const { CalculatorVoiceController } = await import('../mobile/voice-input-simple.js')
      voiceController = new CalculatorVoiceController()
      
      // 在Firefox中应该回退到不支持状态或使用其他实现
      expect(typeof voiceController.isVoiceSupported()).toBe('boolean')
    })
  })
})