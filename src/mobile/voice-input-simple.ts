/**
 * 语音输入模块 - 完整版本
 * 支持语音识别和自然语言表达式处理
 */

interface VoiceInputOptions {
  language: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
}

interface VoiceResult {
  expression: string
  confidence: number
  alternatives: string[]
  isFinal: boolean
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

declare var webkitSpeechRecognition: {
  new (): SpeechRecognition
}
declare var SpeechRecognition: {
  new (): SpeechRecognition
}

export class VoiceInputManager {
  private isSupported: boolean = false
  private isListening: boolean = false
  private options: VoiceInputOptions
  private recognition: SpeechRecognition | null = null
  private currentResults: VoiceResult[] = []

  constructor(options: Partial<VoiceInputOptions> = {}) {
    this.options = {
      language: 'zh-CN',
      continuous: false,
      interimResults: true,
      maxAlternatives: 5,
      ...options,
    }

    console.log('Voice input initialized with options:', this.options)
    this.checkSupport()
    this.initializeRecognition()
  }

  private checkSupport(): void {
    this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  }

  private initializeRecognition(): void {
    if (!this.isSupported) return

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionClass) return

    this.recognition = new SpeechRecognitionClass()

    if (this.recognition) {
      this.recognition.continuous = this.options.continuous
      this.recognition.interimResults = this.options.interimResults
      this.recognition.lang = this.options.language
      this.recognition.maxAlternatives = this.options.maxAlternatives

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        this.handleRecognitionResult(event)
      }

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        this.handleRecognitionError(event)
      }

      this.recognition.onend = () => {
        this.isListening = false
        this.dispatchEvent('voiceend', { results: this.currentResults })
        this.currentResults = []
      }

      this.recognition.onstart = () => {
        this.isListening = true
        this.dispatchEvent('voicestart', {})
      }
    }
  }

  private handleRecognitionResult(event: SpeechRecognitionEvent): void {
    const results: VoiceResult[] = []

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i]
      if (!result) continue

      const alternatives: string[] = []
      let bestConfidence = 0

      for (let j = 0; j < result.length; j++) {
        const alternative = result[j]
        if (!alternative) continue

        alternatives.push(alternative.transcript)
        bestConfidence = Math.max(bestConfidence, alternative.confidence)
      }

      results.push({
        expression: alternatives[0] || '',
        confidence: bestConfidence,
        alternatives: alternatives.slice(1),
        isFinal: result.isFinal,
      })
    }

    this.currentResults = results
    this.dispatchEvent('voiceresult', { results })

    // 如果是最终结果，可以自动处理
    if (results.some(result => result.isFinal)) {
      const finalResult = results.find(result => result.isFinal)
      if (finalResult) {
        this.dispatchEvent('voicefinal', { result: finalResult })
      }
    }
  }

  private handleRecognitionError(event: SpeechRecognitionErrorEvent): void {
    console.error('语音识别错误:', event.error, event.message)
    this.dispatchEvent('voiceerror', { 
      error: event.error, 
      message: event.message 
    })
    this.isListening = false
  }

  public async startListening(): Promise<void> {
    if (!this.isSupported || !this.recognition) {
      throw new Error('语音识别不受支持')
    }

    try {
      this.recognition.start()
    } catch (error) {
      console.error('启动语音识别失败:', error)
      throw error
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
    }
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

  public destroy(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
    }
    this.recognition = null
  }
}

/**
 * 计算器语音控制器
 */
export class CalculatorVoiceController {
  private voiceManager: VoiceInputManager
  private isActive: boolean = false
  private voiceIndicator: HTMLElement | null = null

  constructor(options: Partial<VoiceInputOptions> = {}) {
    this.voiceManager = new VoiceInputManager({
      language: 'zh-CN',
      continuous: false,
      interimResults: true,
      maxAlternatives: 3,
      ...options,
    })

    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    // 监听语音结果
    document.addEventListener('voiceresult', (event: Event) => {
      const customEvent = event as CustomEvent<{ results: VoiceResult[] }>
      this.handleVoiceResult(customEvent.detail.results)
    })

    // 监听最终语音结果
    document.addEventListener('voicefinal', (event: Event) => {
      const customEvent = event as CustomEvent<{ result: VoiceResult }>
      this.handleFinalVoiceResult(customEvent.detail.result)
    })

    // 监听语音错误
    document.addEventListener('voiceerror', (event: Event) => {
      const customEvent = event as CustomEvent<{ error: string; message: string }>
      this.handleVoiceError(customEvent.detail.error, customEvent.detail.message)
    })
  }

  private handleVoiceResult(results: VoiceResult[]): void {
    // 显示临时结果
    const interimResult = results.find(result => !result.isFinal)
    if (interimResult) {
      this.showVoiceIndicator(interimResult.expression, false)
    }
  }

  private handleFinalVoiceResult(result: VoiceResult): void {
    // 处理最终语音结果
    const processedExpression = this.processNaturalLanguage(result.expression)
    this.showVoiceIndicator(processedExpression, true)
    
    // 触发计算事件
    this.dispatchCalculatorEvent('voiceExpression', {
      expression: processedExpression,
      original: result.expression,
      confidence: result.confidence,
    })

    // 自动停止语音输入
    this.stopVoiceInput()
  }

  private handleVoiceError(error: string, message: string): void {
    console.error('语音识别错误:', error, message)
    this.showVoiceIndicator(`语音识别错误: ${error}`, true)
    this.stopVoiceInput()
  }

  private processNaturalLanguage(expression: string): string {
    // 自然语言处理：将口语转换为数学表达式
    let processed = expression.toLowerCase()

    // 替换口语表达
    const replacements: Record<string, string> = {
      '加': '+',
      '加上': '+',
      '减': '-',
      '减去': '-',
      '乘': '*',
      '乘以': '*',
      '除': '/',
      '除以': '/',
      '平方': '^2',
      '立方': '^3',
      '开方': 'sqrt',
      '平方根': 'sqrt',
      '立方根': 'cbrt',
      '正弦': 'sin',
      '余弦': 'cos',
      '正切': 'tan',
      '对数': 'log',
      '自然对数': 'ln',
      '指数': 'exp',
      '圆周率': 'π',
      '派': 'π',
      '自然常数': 'e',
      '欧拉数': 'e',
    }

    Object.entries(replacements).forEach(([spoken, math]) => {
      processed = processed.replace(new RegExp(spoken, 'g'), math)
    })

    // 处理数字表达
    processed = processed.replace(/(\d+)\s*点\s*(\d+)/g, '$1.$2')
    processed = processed.replace(/负\s*(\d+)/g, '-$1')

    // 清理空格
    processed = processed.replace(/\s+/g, '')

    return processed
  }

  private showVoiceIndicator(text: string, isFinal: boolean): void {
    if (!this.voiceIndicator) {
      this.createVoiceIndicator()
    }

    if (this.voiceIndicator) {
      this.voiceIndicator.textContent = text
      this.voiceIndicator.className = `voice-indicator ${isFinal ? 'final' : 'interim'}`
      this.voiceIndicator.style.display = 'block'

      if (isFinal) {
        setTimeout(() => {
          if (this.voiceIndicator) {
            this.voiceIndicator.style.display = 'none'
          }
        }, 3000)
      }
    }
  }

  private createVoiceIndicator(): void {
    this.voiceIndicator = document.createElement('div')
    this.voiceIndicator.className = 'voice-indicator'
    this.voiceIndicator.style.cssText = `
      position: fixed;
      top: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 20px;
      border-radius: 25px;
      font-size: 14px;
      z-index: 9999;
      max-width: 80%;
      text-align: center;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    `
    document.body.appendChild(this.voiceIndicator)
  }

  private dispatchCalculatorEvent(type: string, detail: unknown): void {
    const event = new CustomEvent(`calculator${type}`, {
      detail: detail,
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(event)
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
      this.showVoiceIndicator('🎤 正在聆听...', false)
    } catch (error) {
      console.error('语音输入激活失败:', error)
      this.showVoiceIndicator('❌ 语音输入启动失败', true)
    }
  }

  public stopVoiceInput(): void {
    this.voiceManager.stopListening()
    this.isActive = false
    
    if (this.voiceIndicator) {
      this.voiceIndicator.style.display = 'none'
    }
  }

  public isVoiceActive(): boolean {
    return this.isActive
  }

  public isVoiceSupported(): boolean {
    return this.voiceManager.isVoiceSupported()
  }

  public destroy(): void {
    this.voiceManager.destroy()
    if (this.voiceIndicator) {
      this.voiceIndicator.remove()
      this.voiceIndicator = null
    }
  }
}

export type { VoiceInputOptions, VoiceResult }
