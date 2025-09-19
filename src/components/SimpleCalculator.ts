/**
 * 简化版计算器组件 - 用于快速验证前端功能
 */

export class SimpleCalculator {
  private container: HTMLElement

  constructor(container: HTMLElement) {
    this.container = container
    this.init()
  }

  private init(): void {
    this.createSimpleInterface()
    this.setupEventListeners()
  }

  private createSimpleInterface(): void {
    this.container.innerHTML = `
      <div style="
        width: 400px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 20px;
        padding: 20px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(20px);
        margin: 20px;
      ">
        <!-- 显示屏 -->
        <div style="
          background: #1e293b;
          color: white;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 15px;
          text-align: right;
          font-family: monospace;
        ">
          <div id="expression" style="font-size: 14px; opacity: 0.7; min-height: 20px;">0</div>
          <div id="result" style="font-size: 28px; font-weight: bold; min-height: 40px;">0</div>
        </div>

        <!-- 键盘 -->
        <div style="
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        ">
          <!-- 第一行 -->
          <button class="calc-btn" data-action="clear" style="background: #ef4444; color: white;">C</button>
          <button class="calc-btn" data-action="backspace" style="background: #64748b; color: white;">⌫</button>
          <button class="calc-btn" data-value="(">(</button>
          <button class="calc-btn" data-value=")">)</button>

          <!-- 第二行 -->
          <button class="calc-btn" data-value="7">7</button>
          <button class="calc-btn" data-value="8">8</button>
          <button class="calc-btn" data-value="9">9</button>
          <button class="calc-btn" data-value="/" style="background: #3b82f6; color: white;">÷</button>

          <!-- 第三行 -->
          <button class="calc-btn" data-value="4">4</button>
          <button class="calc-btn" data-value="5">5</button>
          <button class="calc-btn" data-value="6">6</button>
          <button class="calc-btn" data-value="*" style="background: #3b82f6; color: white;">×</button>

          <!-- 第四行 -->
          <button class="calc-btn" data-value="1">1</button>
          <button class="calc-btn" data-value="2">2</button>
          <button class="calc-btn" data-value="3">3</button>
          <button class="calc-btn" data-value="-" style="background: #3b82f6; color: white;">-</button>

          <!-- 第五行 -->
          <button class="calc-btn" data-value="0" style="grid-column: span 2;">0</button>
          <button class="calc-btn" data-value=".">.</button>
          <button class="calc-btn" data-action="calculate" style="background: #10b981; color: white;">=</button>

          <!-- 第六行 - 运算符 -->
          <button class="calc-btn" data-value="+" style="grid-column: span 4; background: #3b82f6; color: white;">+</button>
        </div>

        <!-- 状态信息 -->
        <div style="margin-top: 15px; text-align: center; font-size: 12px; color: #64748b;">
          <div>科学计算器 v2.0 - 前端测试版</div>
          <div id="status">准备就绪</div>
        </div>
      </div>

      <style>
        .calc-btn {
          border: none;
          border-radius: 8px;
          padding: 15px;
          font-size: 18px;
          font-weight: 600;
          background: #f1f5f9;
          color: #1e293b;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .calc-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .calc-btn:active {
          transform: translateY(0);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
      </style>
    `
  }

  private setupEventListeners(): void {
    const buttons = this.container.querySelectorAll('.calc-btn')
    const expressionElement = this.container.querySelector('#expression') as HTMLElement
    const resultElement = this.container.querySelector('#result') as HTMLElement
    const statusElement = this.container.querySelector('#status') as HTMLElement

    let expression = ''
    let result = '0'

    buttons.forEach(button => {
      button.addEventListener('click', async () => {
        const value = button.getAttribute('data-value')
        const action = button.getAttribute('data-action')

        if (value) {
          expression += value
          expressionElement.textContent = expression || '0'
          statusElement.textContent = '输入中...'
        } else if (action) {
          switch (action) {
            case 'clear':
              expression = ''
              result = '0'
              expressionElement.textContent = '0'
              resultElement.textContent = '0'
              statusElement.textContent = '已清空'
              break

            case 'backspace':
              expression = expression.slice(0, -1)
              expressionElement.textContent = expression || '0'
              statusElement.textContent = '已删除'
              break

            case 'calculate':
              if (expression) {
                try {
                  statusElement.textContent = '计算中...'

                  // 尝试调用后端计算
                  const TauriService = (await import('../utils/tauri')).TauriService
                  const calculationResult = await TauriService.calculate(expression)

                  result = calculationResult
                  resultElement.textContent = result
                  statusElement.textContent = '计算完成 (后端)'
                } catch {
                  // 后端失败，使用前端计算
                  try {
                    // 简单的前端计算
                    const evalResult = this.safeEval(expression)
                    result = evalResult.toString()
                    resultElement.textContent = result
                    statusElement.textContent = '计算完成 (前端)'
                  } catch {
                    result = 'Error'
                    resultElement.textContent = result
                    statusElement.textContent = '计算错误'
                  }
                }
              }
              break
          }
        }
      })
    })
  }

  private safeEval(expression: string): number {
    // 简单的安全计算，只支持基本运算
    const sanitized = expression
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/[^0-9+\-*/.() ]/g, '')

    return Function('"use strict"; return (' + sanitized + ')')()
  }
}
