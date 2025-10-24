import { createSimpleVoiceInput, type SimpleVoiceInputController, type SimpleVoiceInputOptions } from './voice-input-simple'

export interface VoiceInputFactoryConfig {
  preferNative?: boolean
}

const VOICE_PLUGIN_UNAVAILABLE = 'VoicePluginUnavailableError'

type WithTauriMarker = typeof window & { __TAURI__?: unknown }

export async function createVoiceInputController(
  options: SimpleVoiceInputOptions = {},
  config: VoiceInputFactoryConfig = {}
): Promise<SimpleVoiceInputController> {
  const preferNative = config.preferNative ?? false

  const tauriAvailable =
    typeof window !== 'undefined' && Boolean((window as WithTauriMarker).__TAURI__)

  if (preferNative && tauriAvailable) {
    try {
      const { createNativeVoiceInput } = await import('./voice-input-native')
      const controller = await createNativeVoiceInput(options)

      if (controller.isSupported) {
        return controller
      }
    } catch (error) {
      const shouldSilence =
        error instanceof Error && error.name === VOICE_PLUGIN_UNAVAILABLE

      if (!shouldSilence) {
        console.warn('原生语音识别不可用，回退到浏览器实现:', error)
      }
    }
  }

  return createSimpleVoiceInput(options)
}
