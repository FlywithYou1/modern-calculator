interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionResult extends Array<SpeechRecognitionAlternative> {
  readonly isFinal: boolean
}

interface SpeechRecognitionResultList extends Array<SpeechRecognitionResult> {
  readonly length: number
  item(index: number): SpeechRecognitionResult
}

interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string
  readonly message?: string
}

interface SpeechRecognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onstart: ((event: Event) => void) | null
  onend: ((event: Event) => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
}

type RecognitionConstructor = new () => SpeechRecognition

export type VoiceInputStatus = 'idle' | 'listening' | 'error'

export interface SimpleVoiceInputOptions {
  locale?: string
  continuous?: boolean
  interimResults?: boolean
  autoRestart?: boolean
  onResult?: (transcript: string, isFinal: boolean) => void
  onError?: (error: Error) => void
  onStatusChange?: (status: VoiceInputStatus) => void
}

export interface SimpleVoiceInputController {
  readonly isSupported: boolean
  start(): Promise<void>
  stop(): Promise<void>
  destroy(): void
  status(): VoiceInputStatus
}

const getRecognitionConstructor = (): RecognitionConstructor | undefined => {
  if (typeof window === 'undefined') {
    return undefined
  }

  const globalWindow = window as typeof window & {
    SpeechRecognition?: RecognitionConstructor
    webkitSpeechRecognition?: RecognitionConstructor
  }

  return globalWindow.SpeechRecognition ?? globalWindow.webkitSpeechRecognition
}

export const createSimpleVoiceInput = (
  options: SimpleVoiceInputOptions = {}
): SimpleVoiceInputController => {
  const recognitionCtor = getRecognitionConstructor()

  if (!recognitionCtor) {
    const unsupportedError = new Error('当前环境不支持语音输入')
    return {
      isSupported: false,
      async start(): Promise<void> {
        throw unsupportedError
      },
      async stop(): Promise<void> {
        return undefined
      },
      destroy(): void {
        /* no-op */
      },
      status(): VoiceInputStatus {
        return 'idle'
      },
    }
  }

  const recognition = new recognitionCtor()
  recognition.lang = options.locale ?? (typeof navigator !== 'undefined' ? navigator.language : 'en-US')
  recognition.continuous = options.continuous ?? false
  recognition.interimResults = options.interimResults ?? true
  recognition.maxAlternatives = 1

  let currentStatus: VoiceInputStatus = 'idle'
  let destroyed = false
  let shouldRestart = options.autoRestart ?? false

  const setStatus = (status: VoiceInputStatus) => {
    if (destroyed) {
      return
    }

    currentStatus = status
    options.onStatusChange?.(status)
  }

  const safeError = (value: unknown): Error => {
    if (value instanceof Error) {
      return value
    }

    return new Error(typeof value === 'string' ? value : '语音识别错误')
  }

  recognition.onstart = () => {
    setStatus('listening')
  }

  recognition.onresult = (event: SpeechRecognitionEventLike) => {
    let transcript = ''
    let isFinal = false

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i]
      if (!result) {
        continue
      }

      const alternative = result[0]
      if (alternative) {
        transcript += alternative.transcript
      }
      if (result.isFinal) {
        isFinal = true
      }
    }

    const content = transcript.trim()
    if (!content) {
      return
    }

    options.onResult?.(content, isFinal)
  }

  recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
    const error = safeError(event.error)
    setStatus('error')
    options.onError?.(error)
  }

  recognition.onend = () => {
    if (destroyed) {
      return
    }

    if (shouldRestart && currentStatus !== 'error') {
      try {
        recognition.start()
        return
      } catch (error) {
        const normalized = safeError(error)
        setStatus('error')
        options.onError?.(normalized)
      }
    }

    setStatus('idle')
  }

  return {
    isSupported: true,
    async start(): Promise<void> {
      if (destroyed) {
        throw new Error('语音输入实例已销毁')
      }

      if (currentStatus === 'listening') {
        return
      }

      shouldRestart = options.autoRestart ?? options.continuous ?? false

      try {
        recognition.start()
        setStatus('listening')
      } catch (error) {
        const normalized = safeError(error)
        setStatus('error')
        options.onError?.(normalized)
        throw normalized
      }
    },
    async stop(): Promise<void> {
      shouldRestart = false

      if (currentStatus === 'idle' || currentStatus === 'error') {
        return
      }

      try {
        recognition.stop()
      } catch (error) {
        const normalized = safeError(error)
        options.onError?.(normalized)
      }
    },
    destroy(): void {
      destroyed = true
      shouldRestart = false

      try {
        recognition.stop()
      } catch {
        /* ignore */
      }

      recognition.onresult = null
      recognition.onerror = null
      recognition.onstart = null
      recognition.onend = null
    },
    status(): VoiceInputStatus {
      return currentStatus
    },
  }
}
