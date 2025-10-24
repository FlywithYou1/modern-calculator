import type {
	SimpleVoiceInputController,
	SimpleVoiceInputOptions,
	VoiceInputStatus,
} from './voice-input-simple'

export const VOICE_PLUGIN_UNAVAILABLE = 'VoicePluginUnavailableError'

const PLUGIN_NAMESPACE = 'voice'
const PERMISSION_ALIAS = 'recordAudio'

interface VoiceResultPayload {
	transcript?: string
	isFinal?: boolean
	confidence?: number
}

interface VoiceErrorPayload {
	code?: string
	message?: string
}

interface VoiceStatusPayload {
	status?: VoiceInputStatus
}

type PermissionState = import('@tauri-apps/api/core').PermissionState
type PluginListener = import('@tauri-apps/api/core').PluginListener

type PermissionResponse = Record<string, PermissionState>

class VoicePluginUnavailableError extends Error {
	constructor(message: string) {
		super(message)
		this.name = VOICE_PLUGIN_UNAVAILABLE
	}
}

const normalizeError = (value: unknown): Error => {
	if (value instanceof Error) {
		return value
	}

	if (typeof value === 'string') {
		return new Error(value)
	}

	return new Error('语音识别出现未知错误')
}

const isGranted = (state: PermissionState | undefined): boolean => state === 'granted'

const canRequest = (state: PermissionState | undefined): boolean => {
	if (!state) {
		return true
	}

	return state === 'denied' || state === 'prompt' || state === 'prompt-with-rationale'
}

export async function createAndroidVoiceInput(
	options: SimpleVoiceInputOptions = {}
): Promise<SimpleVoiceInputController> {
	if (typeof window === 'undefined') {
		throw new VoicePluginUnavailableError('缺少浏览器上下文，无法初始化原生语音插件')
	}

	const { invoke, addPluginListener } = await import('@tauri-apps/api/core')

	const ensurePluginAvailable = async (): Promise<PermissionResponse> => {
		try {
			const permissions = await invoke<PermissionResponse>('plugin:voice|checkPermissions')
			if (!permissions || !(PERMISSION_ALIAS in permissions)) {
				throw new Error('插件返回的权限状态无效')
			}
			return permissions
		} catch (error) {
			throw new VoicePluginUnavailableError(
				error instanceof Error ? error.message : '未检测到原生语音插件'
			)
		}
	}

	let cachedPermissions = await ensurePluginAvailable()

	let currentStatus: VoiceInputStatus = 'idle'
	let destroyed = false
	let listeners: PluginListener[] = []
	let hasAttachedListeners = false

	const setStatus = (status: VoiceInputStatus): void => {
		if (destroyed) {
			return
		}

		currentStatus = status
		options.onStatusChange?.(status)
	}

	const attachListeners = async (): Promise<void> => {
		if (hasAttachedListeners) {
			return
		}

		listeners = [
			await addPluginListener<VoiceResultPayload>(PLUGIN_NAMESPACE, 'result', (payload) => {
				if (destroyed) {
					return
				}

				const transcript = (payload.transcript ?? '').trim()
				if (!transcript) {
					return
				}

				options.onResult?.(transcript, Boolean(payload.isFinal))
			}),
			await addPluginListener<VoiceStatusPayload>(PLUGIN_NAMESPACE, 'status', (payload) => {
				if (!payload || !payload.status) {
					return
				}

				setStatus(payload.status)
			}),
			await addPluginListener<VoiceErrorPayload>(PLUGIN_NAMESPACE, 'error', (payload) => {
				if (destroyed) {
					return
				}

				setStatus('error')
				const message = payload.message ?? `语音识别错误: ${payload.code ?? 'unknown'}`
				options.onError?.(new Error(message))
			}),
		]

		hasAttachedListeners = true
	}

	const removeListeners = async (): Promise<void> => {
		await Promise.all(
			listeners.map((listener) =>
				listener
					.unregister()
					.catch(() => {
						/* ignore */
					})
			)
		)

		listeners = []
		hasAttachedListeners = false
	}

	const ensurePermissions = async (): Promise<void> => {
		const current = cachedPermissions[PERMISSION_ALIAS]
		if (isGranted(current)) {
			return
		}

		if (!canRequest(current)) {
			throw new Error('请在系统设置中启用麦克风权限以使用语音输入')
		}

		const response = await invoke<PermissionResponse>('plugin:voice|requestPermissions', {
			permissions: [PERMISSION_ALIAS],
		})

		cachedPermissions = response

		if (!isGranted(response[PERMISSION_ALIAS])) {
			throw new Error('用户拒绝授予麦克风权限，无法启用语音输入')
		}
	}

	const stopInternal = async (): Promise<void> => {
		try {
			await invoke('plugin:voice|stopListening')
		} catch (error) {
			if (destroyed) {
				return
			}
			options.onError?.(normalizeError(error))
		}
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

			try {
				await ensurePermissions()
				await attachListeners()

				await invoke('plugin:voice|startListening', {
					locale: options.locale ?? navigator.language,
					interimResults: options.interimResults ?? true,
					continuous: options.continuous ?? true,
					maxAlternatives: 1,
				})

				setStatus('listening')
			} catch (error) {
				const normalized = normalizeError(error)
				setStatus('error')
				options.onError?.(normalized)
				throw normalized
			}
		},
		async stop(): Promise<void> {
			if (destroyed) {
				return
			}

			if (currentStatus === 'idle' || currentStatus === 'error') {
				return
			}

			await stopInternal()
			setStatus('idle')
		},
		destroy(): void {
			if (destroyed) {
				return
			}

			destroyed = true
			void stopInternal()
			void removeListeners()
			setStatus('idle')
		},
		status(): VoiceInputStatus {
			return currentStatus
		},
	}
}
