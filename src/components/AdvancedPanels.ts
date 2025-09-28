import { invoke } from '../utils/tauri.js'

export type AdvancedPanelType =
  | 'matrix'
  | 'unit'
  | 'complex'
  | 'statistics'
  | 'base'

export interface AdvancedPanelResult {
  summary: string
  expression?: string
  result?: string
  history?: {
    expression: string
    result: string
  }
  metadata?: Record<string, unknown>
}

interface AdvancedPanelCallbacks {
  onResult: (payload: AdvancedPanelResult) => Promise<void> | void
  onClose?: () => void
  onError?: (message: string) => void
}

const TEXTAREA_HELP = '使用空格或逗号分隔同一行的数字，使用换行分隔行。'

const UNIT_CATEGORIES: Record<string, Array<{ label: string; unit: string }>> = {
  length: [
    { label: '米 (m)', unit: 'm' },
    { label: '千米 (km)', unit: 'km' },
    { label: '厘米 (cm)', unit: 'cm' },
    { label: '毫米 (mm)', unit: 'mm' },
    { label: '英寸 (in)', unit: 'in' },
    { label: '英尺 (ft)', unit: 'ft' },
    { label: '码 (yd)', unit: 'yd' },
    { label: '英里 (mi)', unit: 'mi' },
  ],
  mass: [
    { label: '千克 (kg)', unit: 'kg' },
    { label: '克 (g)', unit: 'g' },
    { label: '毫克 (mg)', unit: 'mg' },
    { label: '磅 (lb)', unit: 'lb' },
    { label: '盎司 (oz)', unit: 'oz' },
    { label: '吨 (t)', unit: 't' },
  ],
  temperature: [
    { label: '摄氏度 (°C)', unit: '°C' },
    { label: '华氏度 (°F)', unit: '°F' },
    { label: '开尔文 (K)', unit: 'K' },
  ],
  time: [
    { label: '秒 (s)', unit: 's' },
    { label: '分钟 (min)', unit: 'min' },
    { label: '小时 (h)', unit: 'h' },
    { label: '天 (d)', unit: 'd' },
  ],
  digital: [
    { label: '字节 (B)', unit: 'B' },
    { label: '千字节 (KB)', unit: 'KB' },
    { label: '兆字节 (MB)', unit: 'MB' },
    { label: '吉字节 (GB)', unit: 'GB' },
    { label: '太字节 (TB)', unit: 'TB' },
    { label: '比特 (b)', unit: 'b' },
  ],
}

const STAT_OPERATIONS: Array<{ label: string; value: string }> = [
  { label: '均值 (mean)', value: 'mean' },
  { label: '中位数 (median)', value: 'median' },
  { label: '方差 (variance)', value: 'variance' },
  { label: '标准差 (stdev)', value: 'stdev' },
  { label: '最小值 (min)', value: 'min' },
  { label: '最大值 (max)', value: 'max' },
  { label: '求和 (sum)', value: 'sum' },
  { label: '乘积 (product)', value: 'product' },
  { label: '极差 (range)', value: 'range' },
]

const COMPLEX_OPERATIONS: Array<{ label: string; value: string }> = [
  { label: '加法 (a + b)', value: 'add' },
  { label: '减法 (a - b)', value: 'subtract' },
  { label: '乘法 (a × b)', value: 'multiply' },
  { label: '除法 (a ÷ b)', value: 'divide' },
]

const MATRIX_OPERATIONS: Array<{ label: string; value: string }> = [
  { label: '矩阵加法', value: 'add' },
  { label: '矩阵减法', value: 'subtract' },
  { label: '矩阵乘法', value: 'multiply' },
  { label: '转置', value: 'transpose' },
  { label: '行列式', value: 'determinant' },
  { label: '求逆', value: 'inverse' },
]

const BASE_OPTIONS = [2, 8, 10, 16]

export class AdvancedPanelManager {
  private activeType: AdvancedPanelType | null = null
  private backdrop: HTMLDivElement | null = null
  private resultContainer: HTMLElement | null = null

  constructor(
    private root: HTMLElement,
    private callbacks: AdvancedPanelCallbacks
  ) {
    this.bindGlobalEvents()
  }

  open(type: AdvancedPanelType): void {
    switch (type) {
      case 'matrix':
        this.renderMatrixPanel()
        break
      case 'unit':
        this.renderUnitPanel()
        break
      case 'complex':
        this.renderComplexPanel()
        break
      case 'statistics':
        this.renderStatisticsPanel()
        break
      case 'base':
        this.renderBasePanel()
        break
    }
  }

  close(): void {
    this.activeType = null
    if (this.backdrop) {
      this.backdrop.classList.remove('is-visible')
      window.setTimeout(() => {
        this.root.innerHTML = ''
        this.backdrop = null
      }, 180)
    } else {
      this.root.innerHTML = ''
    }
    this.callbacks.onClose?.()
  }

  private bindGlobalEvents(): void {
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.activeType) {
        event.preventDefault()
        this.close()
      }
    })
  }

  private setupBaseDialog(title: string, description: string, body: string): HTMLDivElement {
    this.root.innerHTML = `
      <div class="advanced-panel-backdrop">
        <div class="advanced-panel-dialog" role="dialog" aria-modal="true" aria-label="${title}">
          <header class="advanced-panel-header">
            <h2>${title}</h2>
            <button type="button" class="advanced-panel-close" data-action="close" aria-label="关闭面板">×</button>
          </header>
          <p class="advanced-panel-description">${description}</p>
          <div class="advanced-panel-content">
            ${body}
            <section class="advanced-panel-result" aria-live="polite"></section>
          </div>
        </div>
      </div>
    `

    this.backdrop = this.root.querySelector('.advanced-panel-backdrop') as HTMLDivElement
    this.resultContainer = this.root.querySelector('.advanced-panel-result') as HTMLElement

    requestAnimationFrame(() => {
      this.backdrop?.classList.add('is-visible')
    })

    const closeBtn = this.root.querySelector('[data-action="close"]') as HTMLButtonElement | null
    closeBtn?.addEventListener('click', () => this.close())
    this.backdrop?.addEventListener('click', event => {
      if (event.target === this.backdrop) {
        this.close()
      }
    })

    return this.root.querySelector('.advanced-panel-dialog') as HTMLDivElement
  }

  private renderMatrixPanel(): void {
    this.activeType = 'matrix'
    const dialog = this.setupBaseDialog(
      '矩阵计算',
      '输入矩阵数据并选择运算。矩阵使用换行分隔行，空格或逗号分隔列。',
      `
        <form class="advanced-panel-form" data-panel="matrix" novalidate>
          <div class="form-row">
            <label for="matrix-operation">选择运算</label>
            <select id="matrix-operation" name="operation" required>
              ${MATRIX_OPERATIONS.map(op => `<option value="${op.value}">${op.label}</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <label for="matrix-a">矩阵 A</label>
            <textarea id="matrix-a" name="matrixA" rows="5" placeholder="1 2\n3 4" required></textarea>
            <small>${TEXTAREA_HELP}</small>
          </div>
          <div class="form-row" data-field="matrix-b">
            <label for="matrix-b">矩阵 B</label>
            <textarea id="matrix-b" name="matrixB" rows="5" placeholder="5 6\n7 8"></textarea>
            <small>${TEXTAREA_HELP}</small>
          </div>
          <footer class="advanced-panel-footer">
            <button type="submit" class="btn-primary">执行运算</button>
            <button type="button" class="btn-ghost" data-action="close">取消</button>
          </footer>
        </form>
      `
    )

    const form = dialog.querySelector('form') as HTMLFormElement
    const matrixBField = dialog.querySelector('[data-field="matrix-b"]') as HTMLElement
    const operationSelect = form.querySelector('select[name="operation"]') as HTMLSelectElement

    const toggleMatrixBField = () => {
      const requiresSecondMatrix = ['add', 'subtract', 'multiply'].includes(operationSelect.value)
      matrixBField.classList.toggle('is-hidden', !requiresSecondMatrix)
      const matrixB = matrixBField.querySelector('textarea') as HTMLTextAreaElement
      matrixB.required = requiresSecondMatrix
      if (!requiresSecondMatrix) {
        matrixB.value = ''
      }
    }

    toggleMatrixBField()
    operationSelect.addEventListener('change', toggleMatrixBField)

    form.addEventListener('submit', async event => {
      event.preventDefault()
      this.clearResult()

      const operation = operationSelect.value
      const matrixAText = (form.matrixA as HTMLTextAreaElement).value
      const matrixBText = (form.matrixB as HTMLTextAreaElement)?.value ?? ''

      try {
        const matrixA = parseMatrixInput(matrixAText)
        let matrixB: number[][] | undefined
        if (['add', 'subtract', 'multiply'].includes(operation)) {
          matrixB = parseMatrixInput(matrixBText)
        }
        const response = await invoke<{
          matrix?: number[][]
          determinant?: number
          rows?: number
          cols?: number
        }>('matrix_operation', {
          operation,
          matrix_a: matrixA,
          matrix_b: matrixB,
        })

        if (response.matrix) {
          const formatted = formatMatrix(response.matrix)
          const rows = response.rows ?? response.matrix.length
          const cols = response.cols ?? (response.matrix[0]?.length ?? 0)
          this.reportSuccess(
            `矩阵结果 (${rows}×${cols})`,
            formatted,
            {
              expression: `${operation}(A${matrixB ? ',B' : ''})`,
              result: formatted,
            },
            {
              panel: 'matrix',
              operation,
              rows,
              cols,
              operands: {
                a: matrixA,
                b: matrixB,
              },
              output: response.matrix,
            }
          )
        } else if (typeof response.determinant === 'number') {
          const resultStr = response.determinant.toString()
          this.reportSuccess(
            '行列式结果',
            resultStr,
            {
              expression: 'det(A)',
              result: resultStr,
            },
            {
              panel: 'matrix',
              operation,
              determinant: response.determinant,
              operands: {
                a: matrixA,
              },
            }
          )
        } else {
          this.reportSuccess('操作完成', '运算已成功执行。', undefined, {
            panel: 'matrix',
            operation,
          })
        }
      } catch (error) {
        this.reportError(error)
      }
    })

    const firstField = form.querySelector('textarea') as HTMLTextAreaElement | null
    firstField?.focus()
  }

  private renderUnitPanel(): void {
    this.activeType = 'unit'
    const dialog = this.setupBaseDialog(
      '单位转换',
      '选择类别并输入需要转换的数值。',
      `
        <form class="advanced-panel-form" data-panel="unit" novalidate>
          <div class="form-row">
            <label for="unit-category">类别</label>
            <select id="unit-category" name="category" required>
              ${Object.keys(UNIT_CATEGORIES)
                .map(key => `<option value="${key}">${mapUnitCategoryLabel(key)}</option>`)
                .join('')}
            </select>
          </div>
          <div class="form-row">
            <label for="unit-value">数值</label>
            <input id="unit-value" name="value" type="number" step="any" required />
          </div>
          <div class="form-grid">
            <div class="form-row">
              <label for="unit-from">从</label>
              <select id="unit-from" name="from" required></select>
            </div>
            <div class="form-row">
              <label for="unit-to">到</label>
              <select id="unit-to" name="to" required></select>
            </div>
          </div>
          <footer class="advanced-panel-footer">
            <button type="submit" class="btn-primary">转换</button>
            <button type="button" class="btn-ghost" data-action="close">取消</button>
          </footer>
        </form>
      `
    )

    const form = dialog.querySelector('form') as HTMLFormElement
    const categorySelect = form.querySelector('select[name="category"]') as HTMLSelectElement
    const fromSelect = form.querySelector('select[name="from"]') as HTMLSelectElement
    const toSelect = form.querySelector('select[name="to"]') as HTMLSelectElement

    const refreshUnits = () => {
      const options = UNIT_CATEGORIES[categorySelect.value] ?? []
      const optionHtml = options.map(opt => `<option value="${opt.unit}">${opt.label}</option>`).join('')
      fromSelect.innerHTML = optionHtml
      toSelect.innerHTML = optionHtml
      if (options.length > 1) {
        toSelect.selectedIndex = 1
      }
    }

    refreshUnits()
    categorySelect.addEventListener('change', refreshUnits)

    form.addEventListener('submit', async event => {
      event.preventDefault()
      this.clearResult()

      const valueStr = (form.value as HTMLInputElement).value
      const from = fromSelect.value
      const to = toSelect.value

      const value = Number.parseFloat(valueStr)
      if (!Number.isFinite(value)) {
        this.reportError('请输入有效的数字。')
        return
      }

      try {
        const resultValue = await invoke<number>('convert_units', {
          value,
          from_unit: from,
          to_unit: to,
        })

        const resultStr = resultValue.toString()
        this.reportSuccess(
          `${from} → ${to}`,
          resultStr,
          {
            expression: `${value} ${from} → ${to}`,
            result: resultStr,
          },
          {
            panel: 'unit',
            category: categorySelect.value,
            value,
            from,
            to,
            converted: resultValue,
          }
        )
      } catch (error) {
        this.reportError(error)
      }
    })

    const valueInput = form.querySelector('input[name="value"]') as HTMLInputElement | null
    valueInput?.focus()
  }

  private renderComplexPanel(): void {
    this.activeType = 'complex'
    const dialog = this.setupBaseDialog(
      '复数运算',
      '填写两个复数（实部与虚部），并选择运算类型。',
      `
        <form class="advanced-panel-form" data-panel="complex" novalidate>
          <fieldset class="form-fieldset">
            <legend>复数 A</legend>
            <div class="form-grid">
              <div class="form-row">
                <label for="complex-a-real">实部</label>
                <input id="complex-a-real" name="aReal" type="number" step="any" required />
              </div>
              <div class="form-row">
                <label for="complex-a-imag">虚部</label>
                <input id="complex-a-imag" name="aImag" type="number" step="any" required />
              </div>
            </div>
          </fieldset>
          <fieldset class="form-fieldset">
            <legend>复数 B</legend>
            <div class="form-grid">
              <div class="form-row">
                <label for="complex-b-real">实部</label>
                <input id="complex-b-real" name="bReal" type="number" step="any" required />
              </div>
              <div class="form-row">
                <label for="complex-b-imag">虚部</label>
                <input id="complex-b-imag" name="bImag" type="number" step="any" required />
              </div>
            </div>
          </fieldset>
          <div class="form-row">
            <label for="complex-operation">运算</label>
            <select id="complex-operation" name="operation" required>
              ${COMPLEX_OPERATIONS.map(op => `<option value="${op.value}">${op.label}</option>`).join('')}
            </select>
          </div>
          <footer class="advanced-panel-footer">
            <button type="submit" class="btn-primary">计算</button>
            <button type="button" class="btn-ghost" data-action="close">取消</button>
          </footer>
        </form>
      `
    )

    const form = dialog.querySelector('form') as HTMLFormElement
    form.addEventListener('submit', async event => {
      event.preventDefault()
      this.clearResult()

      let values: number[]
      try {
        values = ['aReal', 'aImag', 'bReal', 'bImag'].map(name => {
          const input = form.querySelector<HTMLInputElement>(`input[name="${name}"]`)
          if (!input) {
            throw new Error(`缺少字段 ${name}`)
          }
          return Number.parseFloat(input.value)
        })
      } catch (error) {
        this.reportError(error)
        return
      }

      if (values.some(v => !Number.isFinite(v))) {
        this.reportError('请输入有效的实部和虚部。')
        return
      }

      const [aReal, aImag, bReal, bImag] = values
      const operation = (form.operation as HTMLSelectElement).value

      try {
        const [real, imag] = await invoke<[number, number]>('calculate_complex', {
          a_real: aReal,
          a_imag: aImag,
          b_real: bReal,
          b_imag: bImag,
          operation,
        })

        const expression = `(${aReal} + ${aImag}i) ${describeComplexOperation(operation)} (${bReal} + ${bImag}i)`
        const resultStr = `${real} ${imag >= 0 ? '+' : '-'} ${Math.abs(imag)}i`
        this.reportSuccess(
          '复数结果',
          resultStr,
          {
            expression,
            result: resultStr,
          },
          {
            panel: 'complex',
            operation,
            operands: {
              a: { real: aReal, imag: aImag },
              b: { real: bReal, imag: bImag },
            },
            output: { real, imag },
          }
        )
      } catch (error) {
        this.reportError(error)
      }
    })

    const firstInput = form.querySelector('input') as HTMLInputElement | null
    firstInput?.focus()
  }

  private renderStatisticsPanel(): void {
    this.activeType = 'statistics'
    const dialog = this.setupBaseDialog(
      '统计分析',
      '输入数据集（逗号或空格分隔），选择需要执行的统计运算。',
      `
        <form class="advanced-panel-form" data-panel="statistics" novalidate>
          <div class="form-row">
            <label for="stats-values">数据集</label>
            <textarea id="stats-values" name="values" rows="5" placeholder="12, 15, 18, 20" required></textarea>
            <small>使用逗号、空格或换行分隔数值。</small>
          </div>
          <div class="form-row">
            <label for="stats-operation">统计运算</label>
            <select id="stats-operation" name="operation" required>
              ${STAT_OPERATIONS.map(op => `<option value="${op.value}">${op.label}</option>`).join('')}
            </select>
          </div>
          <footer class="advanced-panel-footer">
            <button type="submit" class="btn-primary">计算</button>
            <button type="button" class="btn-ghost" data-action="close">取消</button>
          </footer>
        </form>
      `
    )

    const form = dialog.querySelector('form') as HTMLFormElement
    form.addEventListener('submit', async event => {
      event.preventDefault()
      this.clearResult()

      try {
        const values = parseNumberList((form.values as HTMLTextAreaElement).value)
        if (!values.length) {
          this.reportError('请至少输入一个数字。')
          return
        }

        const operation = (form.operation as HTMLSelectElement).value
        const resultValue = await invoke<number>('calculate_statistics', {
          values,
          operation,
        })

        const resultStr = resultValue.toString()
        this.reportSuccess(
          `统计结果 - ${operation}`,
          resultStr,
          {
            expression: `${operation}([${values.join(', ')}])`,
            result: resultStr,
          },
          {
            panel: 'statistics',
            operation,
            values,
            output: resultValue,
          }
        )
      } catch (error) {
        this.reportError(error)
      }
    })

    const textarea = form.querySelector('textarea') as HTMLTextAreaElement | null
    textarea?.focus()
  }

  private renderBasePanel(): void {
    this.activeType = 'base'
    const dialog = this.setupBaseDialog(
      '进制转换',
      '输入需要转换的数字以及源/目标进制。',
      `
        <form class="advanced-panel-form" data-panel="base" novalidate>
          <div class="form-row">
            <label for="base-number">数字</label>
            <input id="base-number" name="number" type="text" required placeholder="1010" />
          </div>
          <div class="form-grid">
            <div class="form-row">
              <label for="base-from">源进制</label>
              <select id="base-from" name="from" required>
                ${BASE_OPTIONS.map(base => `<option value="${base}">${base}</option>`).join('')}
              </select>
            </div>
            <div class="form-row">
              <label for="base-to">目标进制</label>
              <select id="base-to" name="to" required>
                ${BASE_OPTIONS.map(base => `<option value="${base}">${base}</option>`).join('')}
              </select>
            </div>
          </div>
          <footer class="advanced-panel-footer">
            <button type="submit" class="btn-primary">转换</button>
            <button type="button" class="btn-ghost" data-action="close">取消</button>
          </footer>
        </form>
      `
    )

    const form = dialog.querySelector('form') as HTMLFormElement
    form.addEventListener('submit', async event => {
      event.preventDefault()
      this.clearResult()

      const number = (form.number as HTMLInputElement).value.trim()
      const fromBase = Number.parseInt((form.from as HTMLSelectElement).value, 10)
      const toBase = Number.parseInt((form.to as HTMLSelectElement).value, 10)

      if (!number) {
        this.reportError('请输入需要转换的数字。')
        return
      }

      try {
        const resultValue = await invoke<string>('convert_base', {
          number,
          from_base: fromBase,
          to_base: toBase,
        })

        this.reportSuccess(
          `进制转换 ${fromBase} → ${toBase}`,
          resultValue,
          {
            expression: `${number}_{${fromBase}} → {${toBase}}`,
            result: resultValue,
          },
          {
            panel: 'base',
            fromBase,
            toBase,
            input: number,
            output: resultValue,
          }
        )
      } catch (error) {
        this.reportError(error)
      }
    })

    const numberInput = form.querySelector('input[name="number"]') as HTMLInputElement | null
    numberInput?.focus()
  }

  private clearResult(): void {
    if (this.resultContainer) {
      this.resultContainer.innerHTML = ''
    }
  }

  private reportSuccess(
    title: string,
    message: string,
    history?: { expression: string; result: string },
    metadata?: Record<string, unknown>
  ): void {
    if (this.resultContainer) {
      this.resultContainer.innerHTML = `
        <div class="result-card is-success">
          <h3>${title}</h3>
          <pre>${message}</pre>
        </div>
      `
    }

    const payload: AdvancedPanelResult = {
      summary: title,
      result: message,
    }

    if (history) {
      payload.expression = history.expression
      payload.history = history
    }

    if (metadata) {
      payload.metadata = metadata
    }

    void this.callbacks.onResult(payload)
  }

  private reportError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error)
    if (this.resultContainer) {
      this.resultContainer.innerHTML = `
        <div class="result-card is-error">
          <h3>出现错误</h3>
          <p>${message}</p>
        </div>
      `
    }
    this.callbacks.onError?.(message)
  }
}

export function parseMatrixInput(input: string): number[][] {
  const rows = input
    .split(/\n+/)
    .map(row => row.trim())
    .filter(Boolean)

  if (!rows.length) {
    throw new Error('请至少输入一行矩阵数据。')
  }

  const matrix = rows.map(row => {
    const cells = row.split(/[\s,]+/).filter(Boolean)
    if (!cells.length) {
      throw new Error('每一行必须包含数值。')
    }
    const values = cells.map(value => {
      const num = Number.parseFloat(value)
      if (!Number.isFinite(num)) {
        throw new Error(`无效的数字: ${value}`)
      }
      return num
    })
    return values
  })

  const width = matrix[0]?.length ?? 0
  if (!matrix.every(row => row.length === width)) {
    throw new Error('所有行必须包含相同数量的列。')
  }

  return matrix
}

export function parseNumberList(input: string): number[] {
  return input
    .split(/[\s,]+/)
    .map(value => value.trim())
    .filter(Boolean)
    .map(value => {
      const num = Number.parseFloat(value)
      if (!Number.isFinite(num)) {
        throw new Error(`无效的数字: ${value}`)
      }
      return num
    })
}

export function describeComplexOperation(operation: string): string {
  switch (operation) {
    case 'add':
      return '＋'
    case 'subtract':
      return '－'
    case 'multiply':
      return '×'
    case 'divide':
      return '÷'
    default:
      return operation
  }
}

export function formatMatrix(matrix: number[][]): string {
  return matrix.map(row => `[${row.map(val => formatNumeric(val)).join(', ')}]`).join('\n')
}

export function formatNumeric(value: number): string {
  if (Number.isInteger(value)) return value.toString()
  return Number.parseFloat(value.toFixed(10)).toString()
}

export function mapUnitCategoryLabel(key: string): string {
  switch (key) {
    case 'length':
      return '长度'
    case 'mass':
      return '质量'
    case 'temperature':
      return '温度'
    case 'time':
      return '时间'
    case 'digital':
      return '数字存储'
    default:
      return key
  }
}
