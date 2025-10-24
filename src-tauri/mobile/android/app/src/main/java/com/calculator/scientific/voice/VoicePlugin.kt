package com.calculator.scientific.voice

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import app.tauri.Logger
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.Permission
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import java.util.Locale

@InvokeArg
internal class StartArgs {
  var locale: String? = null
  var interimResults: Boolean? = null
  var continuous: Boolean? = null
  var maxAlternatives: Int? = 1
}

@TauriPlugin(
  permissions = [
    Permission(strings = [Manifest.permission.RECORD_AUDIO], alias = "recordAudio")
  ]
)
class VoicePlugin(private val activity: Activity) : Plugin(activity), RecognitionListener {
  private var speechRecognizer: SpeechRecognizer? = null
  private var listeningIntent: Intent? = null
  private var shouldRestart: Boolean = false
  private var destroyed = false
  private val handler = Handler(Looper.getMainLooper())
  private var pendingStart: Invoke? = null

  @Command
  fun startListening(invoke: Invoke) {
    handler.post {
      try {
        if (destroyed) {
          invoke.reject("语音识别服务已释放")
          return@post
        }

        ensureRecognizer()

        val args = invoke.parseArgs(StartArgs::class.java)
        shouldRestart = args.continuous ?: true

        val languageTag = args.locale?.ifBlank { null } ?: Locale.getDefault().toLanguageTag()

        listeningIntent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
          putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
          putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, args.interimResults ?: true)
          putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, args.maxAlternatives ?: 1)
          putExtra(RecognizerIntent.EXTRA_LANGUAGE, languageTag)
          putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, languageTag)
          putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, activity.packageName)
        }

        pendingStart = invoke
        speechRecognizer?.startListening(listeningIntent)
      } catch (error: Exception) {
        Logger.error("Failed to start speech recognition: ${error.message}")
        pendingStart = null
        invoke.reject(error.message ?: "无法启动语音识别")
      }
    }
  }

  @Command
  fun stopListening(invoke: Invoke) {
    handler.post {
      shouldRestart = false

      try {
        speechRecognizer?.stopListening()
        emitStatus("idle")
        invoke.resolve()
      } catch (error: Exception) {
        Logger.error("Failed to stop speech recognition: ${error.message}")
        invoke.reject(error.message ?: "停止语音识别失败")
      }
    }
  }

  private fun ensureRecognizer() {
    if (speechRecognizer != null) {
      return
    }

    if (!SpeechRecognizer.isRecognitionAvailable(activity)) {
      throw IllegalStateException("当前设备不支持语音识别")
    }

    speechRecognizer = SpeechRecognizer.createSpeechRecognizer(activity).apply {
      setRecognitionListener(this@VoicePlugin)
    }
  }

  private fun restartListening() {
    if (!shouldRestart || destroyed || listeningIntent == null) {
      emitStatus("idle")
      return
    }

    handler.postDelayed({
      try {
        speechRecognizer?.startListening(listeningIntent)
      } catch (error: Exception) {
        Logger.error("Failed to restart speech recognition: ${error.message}")
        emitError(-1, error.message ?: "无法重新启动语音识别")
      }
    }, 350L)
  }

  private fun emitStatus(status: String) {
    val payload = JSObject()
    payload.put("status", status)
    trigger("status", payload)
  }

  private fun emitResult(transcript: String, isFinal: Boolean, confidence: Float?) {
    val payload = JSObject()
    payload.put("transcript", transcript)
    payload.put("isFinal", isFinal)
    if (confidence != null) {
      payload.put("confidence", confidence.toDouble())
    }
    trigger("result", payload)
  }

  private fun emitError(code: Int, message: String) {
    val payload = JSObject()
    payload.put("code", code.toString())
    payload.put("message", message)
    trigger("error", payload)
  }

  private fun handleBundle(results: Bundle?, isFinal: Boolean) {
    if (results == null) {
      return
    }

    val matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
    if (matches.isNullOrEmpty()) {
      return
    }

    val transcript = matches.joinToString(separator = " ") { it.trim() }.trim()
    if (transcript.isEmpty()) {
      return
    }

    val confidenceScores = results.getFloatArray(SpeechRecognizer.CONFIDENCE_SCORES)
    val confidence = confidenceScores?.firstOrNull()

    emitResult(transcript, isFinal, confidence)
  }

  override fun onReadyForSpeech(params: Bundle?) {
    pendingStart?.resolve()
    pendingStart = null
    emitStatus("listening")
  }

  override fun onEndOfSpeech() {
    emitStatus("idle")
    restartListening()
  }

  override fun onError(error: Int) {
    val message = when (error) {
      SpeechRecognizer.ERROR_AUDIO -> "音频输入错误"
      SpeechRecognizer.ERROR_CLIENT -> "客户端配置错误"
      SpeechRecognizer.ERROR_NETWORK -> "网络异常"
      SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "网络超时"
      SpeechRecognizer.ERROR_NO_MATCH -> "未识别到有效语音"
      SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "语音识别服务正忙"
      SpeechRecognizer.ERROR_SERVER -> "语音服务暂不可用"
      SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "长时间未检测到语音"
      else -> "语音识别出现未知错误"
    }

    pendingStart?.reject(message)
    pendingStart = null

    emitError(error, message)

    if (shouldRestart && error != SpeechRecognizer.ERROR_CLIENT) {
      restartListening()
    } else {
      emitStatus("error")
    }
  }

  override fun onResults(results: Bundle?) {
    handleBundle(results, true)
    restartListening()
  }

  override fun onPartialResults(partialResults: Bundle?) {
    handleBundle(partialResults, false)
  }

  override fun onBeginningOfSpeech() {
    emitStatus("listening")
  }

  override fun onRmsChanged(rmsdB: Float) {
    // no-op
  }

  override fun onBufferReceived(buffer: ByteArray?) {
    // no-op
  }

  override fun onEvent(eventType: Int, params: Bundle?) {
    // no-op
  }

  override fun unload() {
    destroyed = true
    shouldRestart = false
    pendingStart = null

    handler.post {
      try {
        speechRecognizer?.stopListening()
      } catch (_: Exception) {
        // ignore
      }

      speechRecognizer?.cancel()
      speechRecognizer?.destroy()
      speechRecognizer = null
    }
  }
}
