import { Calculator } from './Calculator.js'
import { invoke } from '../utils/tauri.js'
import { trackError } from '../utils/mcp-debugger.js'

/**
 * 简化的高级计算器组件
 * 提供矩阵、统计、复数和单位转换功能的基础界面
 */
export class SimpleAdvancedCalculator extends Calculator {
  private advancedMode: 'basic' | 'scientific' | 'matrix' | 'statistics' | 'units' | 'complex' =
    'basic'

  constructor(container: HTMLElement) {
    super(container)
  }

  protected createLayout(): void {
    super.createLayout() // 调用父类的布局创建
    this.addAdvancedControls()
  }

  private addAdvancedControls(): void {
    const headerControls = this.container.querySelector('.header-controls')
    if (headerControls) {
      // 添加高级模式切换按钮
      const advancedBtn = document.createElement('button')
      advancedBtn.className = 'header-btn'
      advancedBtn.innerHTML = '🔬'
      advancedBtn.title = '高级功能'
      advancedBtn.addEventListener('click', () => this.toggleAdvancedPanel())
      headerControls.insertBefore(advancedBtn, headerControls.firstChild)
    }

    // 创建高级功能面板
    this.createAdvancedPanel()
  }

  private createAdvancedPanel(): void {
    const advancedPanel = document.createElement('div')
    advancedPanel.id = 'advanced-panel'
    advancedPanel.className = 'advanced-panel'
    advancedPanel.style.display = 'none'
    advancedPanel.innerHTML = `
      <div class="advanced-header">
        <h3>高级功能</h3>
        <button class="close-btn" id="close-advanced">×</button>
      </div>
      
      <div class="mode-selector">
        <button class="mode-btn active" data-mode="matrix">矩阵</button>
        <button class="mode-btn" data-mode="statistics">统计</button>
        <button class="mode-btn" data-mode="complex">复数</button>
        <button class="mode-btn" data-mode="units">单位</button>
      </div>

      <div class="advanced-content">
        <!-- 矩阵运算 -->
        <div class="mode-content" id="matrix-content">
          <h4>矩阵运算</h4>
          <div class="matrix-input">
            <label>矩阵A (2x2):</label>
            <div class="matrix-grid">
              <input type="number" id="a11" placeholder="a11">
              <input type="number" id="a12" placeholder="a12">
              <input type="number" id="a21" placeholder="a21">
              <input type="number" id="a22" placeholder="a22">
            </div>
          </div>
          <div class="matrix-operations">
            <button class="op-btn" data-op="transpose">转置</button>
            <button class="op-btn" data-op="determinant">行列式</button>
            <button class="op-btn" data-op="inverse">求逆</button>
          </div>
          <div class="result-area" id="matrix-result"></div>
        </div>

        <!-- 统计分析 -->
        <div class="mode-content" id="statistics-content" style="display: none;">
          <h4>统计分析</h4>
          <div class="data-input">
            <label>数据 (用逗号分隔):</label>
            <textarea id="stats-data" placeholder="1, 2, 3, 4, 5"></textarea>
          </div>
          <div class="stats-operations">
            <button class="op-btn" data-op="mean">平均值</button>
            <button class="op-btn" data-op="median">中位数</button>
            <button class="op-btn" data-op="std">标准差</button>
          </div>
          <div class="result-area" id="stats-result"></div>
        </div>

        <!-- 复数运算 -->
        <div class="mode-content" id="complex-content" style="display: none;">
          <h4>复数运算</h4>
          <div class="complex-input">
            <div class="complex-pair">
              <label>复数A:</label>
              <input type="number" id="a-real" placeholder="实部">
              <span>+</span>
              <input type="number" id="a-imag" placeholder="虚部">
              <span>i</span>
            </div>
            <div class="complex-pair">
              <label>复数B:</label>
              <input type="number" id="b-real" placeholder="实部">
              <span>+</span>
              <input type="number" id="b-imag" placeholder="虚部">
              <span>i</span>
            </div>
          </div>
          <div class="complex-operations">
            <button class="op-btn" data-op="add">A + B</button>
            <button class="op-btn" data-op="multiply">A × B</button>
            <button class="op-btn" data-op="divide">A ÷ B</button>
          </div>
          <div class="result-area" id="complex-result"></div>
        </div>

        <!-- 单位转换 -->
        <div class="mode-content" id="units-content" style="display: none;">
          <h4>单位转换</h4>
          <div class="conversion-input">
            <input type="number" id="conv-value" placeholder="数值">
            <select id="from-unit">
              <option value="m">米</option>
              <option value="cm">厘米</option>
              <option value="km">千米</option>
              <option value="kg">千克</option>
              <option value="g">克</option>
            </select>
            <span>→</span>
            <select id="to-unit">
              <option value="m">米</option>
              <option value="cm">厘米</option>
              <option value="km">千米</option>
              <option value="kg">千克</option>
              <option value="g">克</option>
            </select>
          </div>
          <button class="op-btn" id="convert-btn">转换</button>
          <div class="result-area" id="units-result"></div>
        </div>
      </div>
    `

    this.container.appendChild(advancedPanel)
    this.setupAdvancedEvents()
  }

  private setupAdvancedEvents(): void {
    // 关闭按钮
    const closeBtn = this.container.querySelector('#close-advanced')
    closeBtn?.addEventListener('click', () => this.hideAdvancedPanel())

    // 模式切换
    this.container.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const target = e.target as HTMLElement
        const mode = target.dataset.mode
        if (mode) {
          this.switchAdvancedMode(
            mode as 'basic' | 'scientific' | 'matrix' | 'statistics' | 'units' | 'complex'
          )
        }
      })
    })

    // 矩阵操作
    this.container.querySelectorAll('#matrix-content .op-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const target = e.target as HTMLElement
        const op = target.dataset.op
        if (op) {
          this.performMatrixOperation(op)
        }
      })
    })

    // 统计操作
    this.container.querySelectorAll('#statistics-content .op-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const target = e.target as HTMLElement
        const op = target.dataset.op
        if (op) {
          this.performStatisticsOperation(op)
        }
      })
    })

    // 复数操作
    this.container.querySelectorAll('#complex-content .op-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const target = e.target as HTMLElement
        const op = target.dataset.op
        if (op) {
          this.performComplexOperation(op)
        }
      })
    })

    // 单位转换
    const convertBtn = this.container.querySelector('#convert-btn')
    convertBtn?.addEventListener('click', () => this.performUnitConversion())
  }

  private toggleAdvancedPanel(): void {
    const panel = this.container.querySelector('#advanced-panel') as HTMLElement
    if (panel) {
      const isVisible = panel.style.display !== 'none'
      panel.style.display = isVisible ? 'none' : 'block'
    }
  }

  private hideAdvancedPanel(): void {
    const panel = this.container.querySelector('#advanced-panel') as HTMLElement
    if (panel) {
      panel.style.display = 'none'
    }
  }

  private switchAdvancedMode(mode: string): void {
    // 更新按钮状态
    this.container.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === mode)
    })

    // 显示对应内容
    this.container.querySelectorAll('.mode-content').forEach(content => {
      const element = content as HTMLElement
      element.style.display = element.id === `${mode}-content` ? 'block' : 'none'
    })

    this.advancedMode = mode as
      | 'basic'
      | 'scientific'
      | 'matrix'
      | 'statistics'
      | 'units'
      | 'complex'
    console.log('切换到模式:', this.advancedMode)
  }

  private async performMatrixOperation(operation: string): Promise<void> {
    try {
      this.showLoading()

      // 获取矩阵数据
      const a11 = parseFloat(
        (this.container.querySelector('#a11') as HTMLInputElement)?.value || '0'
      )
      const a12 = parseFloat(
        (this.container.querySelector('#a12') as HTMLInputElement)?.value || '0'
      )
      const a21 = parseFloat(
        (this.container.querySelector('#a21') as HTMLInputElement)?.value || '0'
      )
      const a22 = parseFloat(
        (this.container.querySelector('#a22') as HTMLInputElement)?.value || '0'
      )

      const matrixA = [
        [a11, a12],
        [a21, a22],
      ]

      const result = await invoke('matrix_operation', {
        operation,
        matrixA,
        matrixB: null,
      })

      this.displayResult('matrix-result', JSON.stringify(result, null, 2))
    } catch (error) {
      this.displayError('matrix-result', `矩阵运算错误: ${error}`)
      trackError({
        type: 'MatrixError',
        message: error as string,
        context: { operation },
      })
    } finally {
      this.hideLoading()
    }
  }

  private async performStatisticsOperation(operation: string): Promise<void> {
    try {
      this.showLoading()

      const dataText =
        (this.container.querySelector('#stats-data') as HTMLTextAreaElement)?.value || ''
      const data = dataText
        .split(',')
        .map(x => parseFloat(x.trim()))
        .filter(x => !isNaN(x))

      if (data.length === 0) {
        throw new Error('请输入有效的数据')
      }

      const result = await invoke('calculate_statistics', {
        values: data,
        operation,
      })

      this.displayResult('stats-result', `结果: ${result}`)
    } catch (error) {
      this.displayError('stats-result', `统计分析错误: ${error}`)
      trackError({
        type: 'StatisticsError',
        message: error as string,
        context: { operation },
      })
    } finally {
      this.hideLoading()
    }
  }

  private async performComplexOperation(operation: string): Promise<void> {
    try {
      this.showLoading()

      const aReal = parseFloat(
        (this.container.querySelector('#a-real') as HTMLInputElement)?.value || '0'
      )
      const aImag = parseFloat(
        (this.container.querySelector('#a-imag') as HTMLInputElement)?.value || '0'
      )
      const bReal = parseFloat(
        (this.container.querySelector('#b-real') as HTMLInputElement)?.value || '0'
      )
      const bImag = parseFloat(
        (this.container.querySelector('#b-imag') as HTMLInputElement)?.value || '0'
      )

      const result = (await invoke('calculate_complex', {
        aReal,
        aImag,
        bReal,
        bImag,
        operation,
      })) as [number, number]

      this.displayResult('complex-result', `结果: ${result[0]} + ${result[1]}i`)
    } catch (error) {
      this.displayError('complex-result', `复数运算错误: ${error}`)
      trackError({
        type: 'ComplexError',
        message: error as string,
        context: { operation },
      })
    } finally {
      this.hideLoading()
    }
  }

  private async performUnitConversion(): Promise<void> {
    try {
      this.showLoading()

      const value = parseFloat(
        (this.container.querySelector('#conv-value') as HTMLInputElement)?.value || '0'
      )
      const fromUnit =
        (this.container.querySelector('#from-unit') as HTMLSelectElement)?.value || 'm'
      const toUnit = (this.container.querySelector('#to-unit') as HTMLSelectElement)?.value || 'm'

      const result = (await invoke('convert_units', {
        value,
        fromUnit,
        toUnit,
      })) as number

      this.displayResult('units-result', `${value} ${fromUnit} = ${result} ${toUnit}`)
    } catch (error) {
      this.displayError('units-result', `单位转换错误: ${error}`)
      trackError({
        type: 'ConversionError',
        message: error as string,
        context: {},
      })
    } finally {
      this.hideLoading()
    }
  }

  private displayResult(containerId: string, result: string): void {
    const container = this.container.querySelector(`#${containerId}`) as HTMLElement
    if (container) {
      container.innerHTML = `<div class="result-success">${result}</div>`
    }
  }

  private displayError(containerId: string, error: string): void {
    const container = this.container.querySelector(`#${containerId}`) as HTMLElement
    if (container) {
      container.innerHTML = `<div class="result-error">${error}</div>`
    }
  }

  destroy(): void {
    super.destroy()
    // 清理高级功能面板
    const panel = this.container.querySelector('#advanced-panel')
    panel?.remove()
  }
}
