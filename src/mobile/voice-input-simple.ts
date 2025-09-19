/**
 * 语音输入模块 - 简化版本
 * 支持基础语音控制功能
 */

interface VoiceInputOptions {
  language: string
  continuous: boolean
  interimResults: boolean
}

interface VoiceResult {
  expression: string
  confidence: number
  alternatives: string[]
}

export class VoiceInputManager {
  private isSupported: boolean = false
  private isListening: boolean = false
  private options: VoiceInputOptions

  constructor(options: Partial<VoiceInputOptions> = {}) {
    this.options = {
      language: 'zh-CN',
      continuous: false,
      interimResults: true,
      ...options,
    }

    console.log('Voice input initialized with options:', this.options)
    this.checkSupport()
  }

  private checkSupport(): void {
    this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  }

  public async startListening(): Promise<void> {
    if (!this.isSupported) {
      throw new Error('语音识别不受支持')
    }
    this.isListening = true

    // 触发语音开始事件
    this.dispatchEvent('voicestart', {})
  }

  public stopListening(): void {
    this.isListening = false
    this.dispatchEvent('voiceend', {})
  }

  public isVoiceSupported(): boolean {
    return this.isSupported
  }

  public isCurrentlyListening(): boolean {
    return this.isListening
  }

  private dispatchEvent(type: string, detail: unknown): void {
    const event = new CustomEvent(`voice${type}`, {
      detail: detail,
      bubbles: true,
      cancelable: true,
    })

    document.dispatchEvent(event)
  }
}

/**
 * 计算器语音控制器
 */
export class CalculatorVoiceController {
  private voiceManager: VoiceInputManager
  private isActive: boolean = false

  constructor() {
    this.voiceManager = new VoiceInputManager({
      language: 'zh-CN',
      continuous: false,
      interimResults: true,
    })
  }

  public async toggleVoiceInput(): Promise<void> {
    if (this.isActive) {
      this.stopVoiceInput()
    } else {
      await this.startVoiceInput()
    }
  }

  public async startVoiceInput(): Promise<void> {
    try {
      await this.voiceManager.startListening()
      this.isActive = true
    } catch (error) {
      console.error('语音输入激活失败:', error)
    }
  }

  public stopVoiceInput(): void {
    this.voiceManager.stopListening()
    this.isActive = false
  }

  public isVoiceActive(): boolean {
    return this.isActive
  }

  public isVoiceSupported(): boolean {
    return this.voiceManager.isVoiceSupported()
  }
}

export type { VoiceInputOptions, VoiceResult }
