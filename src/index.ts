/* *
 * 科学计算器应用主入口
 *
 * 支持桌面端和移动端的现代化科学计算器 */

import './styles/index.scss'
import './styles/calculator.scss'
import { Calculator } from './components/Calculator'

/* *
 * 应用主类 */
class App {
  private calculator: Calculator | null = null

  constructor() {
    console.log('🚀 启动现代化科学计算器...')
  }

  /* *
   * 初始化应用 */
  async init(): Promise<void> {
    try {
      console.log('🚀 正在初始化计算器应用...')

      // 显示加载界面
      this.showLoadingScreen()

      // 等待DOM准备
      await this.waitForDOM()

      // 获取根元素
      const rootElement = document.querySelector('#root') as HTMLElement
      if (!rootElement) {
        throw new Error('根元素 #root 未找到')
      }

      // 短暂延迟以显示加载动画
      await this.delay(1000)

      // 创建计算器实例
      console.log('📱 创建计算器界面...')
      this.calculator = new Calculator(rootElement)
      await this.calculator.init()

      console.log('✅ 计算器启动完成')
    } catch (error) {
      console.error('❌ 应用启动失败:', error)
      this.showErrorMessage('应用启动失败: ' + (error as Error).message)
    }
  }

  /* *
   * 显示加载界面 */
  private showLoadingScreen(): void {
    const rootElement = document.querySelector('#root') as HTMLElement
    if (rootElement) {
      rootElement.innerHTML = `
        <div class="loading-screen">
          <div class="loading-content">
            <div class="calculator-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
                <line x1="9" y1="9" x2="9" y2="9"/>
                <line x1="15" y1="9" x2="15" y2="9"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            </div>
            <h1 class="loading-title">🧮 科学计算器</h1>
            <p class="loading-subtitle">现代化 · 高精度 · 跨平台</p>
            <div class="loading-progress">
              <div class="progress-bar">
                <div class="progress-fill"></div>
              </div>
              <div class="loading-text">正在加载计算引擎...</div>
            </div>
            <div class="feature-highlights">
              <div class="feature">✨ 金融级精度计算</div>
              <div class="feature">🔬 完整科学计算函数</div>
              <div class="feature">📱 响应式跨平台设计</div>
              <div class="feature">🎨 深色/浅色主题</div>
            </div>
          </div>
        </div>

        <style>
          .loading-screen {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            padding: 20px;
          }

          .loading-content {
            text-align: center;
            max-width: 500px;
            width: 100%;
          }

          .calculator-icon {
            margin: 0 auto 30px;
            width: 80px;
            height: 80px;
            color: rgba(255, 255, 255, 0.9);
            animation: float 3s ease-in-out infinite;
          }

          .loading-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin: 0 0 10px;
            background: linear-gradient(45deg, #fff, #e0e7ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: shimmer 2s ease-in-out infinite;
          }

          .loading-subtitle {
            font-size: 1.125rem;
            margin: 0 0 40px;
            opacity: 0.8;
            font-weight: 300;
          }

          .loading-progress {
            margin-bottom: 40px;
          }

          .progress-bar {
            width: 100%;
            height: 4px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 2px;
            overflow: hidden;
            margin-bottom: 15px;
          }

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #60a5fa, #34d399);
            border-radius: 2px;
            animation: loading 2s ease-in-out infinite;
          }

          .loading-text {
            font-size: 0.875rem;
            opacity: 0.7;
            animation: pulse 2s ease-in-out infinite;
          }

          .feature-highlights {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 30px;
          }

          .feature {
            padding: 10px 15px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            font-size: 0.875rem;
            opacity: 0.8;
            transition: all 0.3s ease;
          }

          .feature:hover {
            background: rgba(255, 255, 255, 0.2);
            opacity: 1;
            transform: translateY(-2px);
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }

          @keyframes shimmer {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }

          @keyframes loading {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
          }

          @keyframes pulse {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1; }
          }

          @media (max-width: 768px) {
            .loading-title {
              font-size: 2rem;
            }

            .feature-highlights {
              grid-template-columns: 1fr;
            }

            .calculator-icon {
              width: 60px;
              height: 60px;
            }
          }
        </style>
      `
    }
  }

  /* *
   * 等待DOM准备 */
  private waitForDOM(): Promise<void> {
    return new Promise(resolve => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => resolve())
      } else {
        resolve()
      }
    })
  }

  /* *
   * 延迟函数 */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /* *
   * 显示错误消息 */
  private showErrorMessage(message: string): void {
    const rootElement = document.querySelector('#root') as HTMLElement
    if (rootElement) {
      rootElement.innerHTML = `
        <div class="error-screen">
          <div class="error-content">
            <div class="error-icon">❌</div>
            <h1 class="error-title">启动失败</h1>
            <p class="error-message">${message}</p>
            <div class="error-actions">
              <button onclick="location.reload()" class="retry-btn">
                🔄 重新加载
              </button>
              <button onclick="this.showSystemInfo()" class="info-btn">
                ℹ️ 系统信息
              </button>
            </div>
            <div class="error-details">
              <details>
                <summary>技术详情</summary>
                <div class="tech-info">
                  <p><strong>User Agent:</strong> ${navigator.userAgent}</p>
                  <p><strong>屏幕分辨率:</strong> ${screen.width}x${screen.height}</p>
                  <p><strong>时间:</strong> ${new Date().toLocaleString()}</p>
                </div>
              </details>
            </div>
          </div>
        </div>

        <style>
          .error-screen {
            min-height: 100vh;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            padding: 20px;
          }

          .error-content {
            text-align: center;
            max-width: 500px;
            width: 100%;
          }

          .error-icon {
            font-size: 4rem;
            margin-bottom: 20px;
          }

          .error-title {
            font-size: 2rem;
            font-weight: 700;
            margin: 0 0 15px;
          }

          .error-message {
            font-size: 1.125rem;
            margin: 0 0 30px;
            opacity: 0.9;
            line-height: 1.5;
          }

          .error-actions {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-bottom: 30px;
            flex-wrap: wrap;
          }

          .retry-btn,
          .info-btn {
            padding: 12px 24px;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
          }

          .retry-btn:hover,
          .info-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
          }

          .error-details {
            margin-top: 20px;
            text-align: left;
          }

          .error-details summary {
            cursor: pointer;
            opacity: 0.7;
            margin-bottom: 10px;
          }

          .tech-info {
            background: rgba(0, 0, 0, 0.2);
            padding: 15px;
            border-radius: 8px;
            font-size: 0.875rem;
            font-family: monospace;
          }

          .tech-info p {
            margin: 5px 0;
            word-break: break-all;
          }

          @media (max-width: 768px) {
            .error-title {
              font-size: 1.5rem;
            }

            .error-actions {
              flex-direction: column;
              align-items: center;
            }

            .retry-btn,
            .info-btn {
              width: 200px;
            }
          }
        </style>
      `
    }
  }

  /* *
   * 获取应用实例 */
  public getCalculator(): Calculator | null {
    return this.calculator
  }

  /* *
   * 销毁应用 */
  public destroy(): void {
    if (this.calculator) {
      this.calculator.destroy()
      this.calculator = null
    }
  }
}

// 创建应用实例
const app = new App()

// 启动应用
app.init()

// 开发环境热重载支持
if (import.meta.hot) {
  import.meta.hot.accept()

  // 热重载时清理旧实例
  import.meta.hot.dispose(() => {
    app.destroy()
  })
}

// 暴露到全局作用域供调试使用
if (import.meta.env.DEV) {
  ;(window as Window & { __calculator_app__?: typeof app }).__calculator_app__ = app
  console.log('🔧 开发模式：可通过 window.__calculator_app__ 访问应用实例')
}

// 错误处理
window.addEventListener('error', event => {
  console.error('💥 全局错误:', event.error)
})

window.addEventListener('unhandledrejection', event => {
  console.error('💥 未处理的Promise拒绝:', event.reason)
})

// 性能监控
if ('performance' in window && 'measure' in performance) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      console.log('📊 性能数据:', {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        totalTime: perfData.loadEventEnd - perfData.fetchStart,
      })
    }, 0)
  })
}

export { App }
