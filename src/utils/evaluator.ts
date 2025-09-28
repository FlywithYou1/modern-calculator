import Decimal from 'decimal.js'

Decimal.set({ precision: 50, rounding: Decimal.ROUND_HALF_EVEN, toExpNeg: -100, toExpPos: 100 })

/**
 * 安全表达式求值器（前端回退用）
 * 使用 decimal.js 提供金融级精度，避免 JS 浮点误差。
 * 支持: + - * / ^ ( )，函数: sin cos tan ln log sqrt，常数: π pi e
 */

export type AngleUnit = 'degrees' | 'radians' | 'gradians'

export interface EvalOptions {
  angleUnit?: AngleUnit
  precision?: number
}

const DECIMAL_PI = new Decimal('3.141592653589793238462643383')
const DECIMAL_E = new Decimal('2.718281828459045235360287471')

const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 }
const rightAssoc = new Set(['^'])

type Tok =
  | { type: 'num'; v: Decimal }
  | { type: 'op'; v: string }
  | { type: 'lparen' | 'rparen' }
  | { type: 'id'; v: string }
  | { type: 'comma' }

const toRadians = (x: Decimal, unit: AngleUnit): Decimal => {
  switch (unit) {
    case 'degrees':
      return x.mul(DECIMAL_PI).div(180)
    case 'gradians':
      return x.mul(DECIMAL_PI).div(200)
    default:
      return x
  }
}

const functions: Record<string, (args: Decimal[], unit: AngleUnit) => Decimal> = {
  sin: (args, unit) => Decimal.sin(toRadians(requireArg(args, 0), unit)),
  cos: (args, unit) => Decimal.cos(toRadians(requireArg(args, 0), unit)),
  tan: (args, unit) => Decimal.tan(toRadians(requireArg(args, 0), unit)),
  ln: args => Decimal.ln(requireArg(args, 0)),
  log: args =>
    args.length === 1
      ? Decimal.log10(requireArg(args, 0))
      : Decimal.log(requireArg(args, 1)).div(Decimal.log(requireArg(args, 0))),
  sqrt: args => requireArg(args, 0).sqrt(),
}

function requireArg(args: Decimal[], index: number): Decimal {
  const value = args[index]
  if (!value) throw new Error('函数参数不足')
  return value
}

export function evaluateExpressionSafe(input: string, opts: EvalOptions = {}): string {
  const angleUnit: AngleUnit = opts.angleUnit || 'degrees'
  const precision = Math.max(0, Math.min(28, opts.precision ?? 12))

  const expr = sanitize(input)
  const tokens = tokenize(expr)
  const rpn = toRPN(tokens)
  const result = evalRPN(rpn, angleUnit)

  if (!result.isFinite()) throw new Error('计算结果无效')
  return formatResult(result, precision)
}

function sanitize(s: string): string {
  return s
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, 'pi')
    .replace(/ℯ/g, 'e')
    .replace(/\s+/g, '')
}

function tokenize(input: string): Tok[] {
  const out: Tok[] = []
  let i = 0
  while (i < input.length) {
    const c = input[i]!
    if (/[0-9.]/.test(c)) {
      let j = i + 1
      while (j < input.length && /[0-9.]/.test(input[j]!)) j++
      const literal = input.slice(i, j)
      if (!/^\d*(?:\.\d*)?$/.test(literal)) throw new Error('无效数字')
      out.push({ type: 'num', v: new Decimal(literal) })
      i = j
    } else if (/[a-zA-Z_]/.test(c)) {
      let j = i + 1
      while (j < input.length && /[a-zA-Z0-9_]/.test(input[j]!)) j++
      out.push({ type: 'id', v: input.slice(i, j) })
      i = j
    } else if ('+-*/^'.includes(c)) {
      out.push({ type: 'op', v: c })
      i++
    } else if (c === '(') {
      out.push({ type: 'lparen' })
      i++
    } else if (c === ')') {
      out.push({ type: 'rparen' })
      i++
    } else if (c === ',') {
      out.push({ type: 'comma' })
      i++
    } else {
      throw new Error('无效字符')
    }
  }
  return out
}

function toRPN(tokens: Tok[]): Tok[] {
  const output: Tok[] = []
  const ops: Tok[] = []

  const normalized: Tok[] = []
  for (let i = 0; i < tokens.length; i++) {
    const current = tokens[i]!
    if (current.type === 'op' && current.v === '-') {
      const prev = tokens[i - 1]
      const next = tokens[i + 1]
      const isUnary = !prev || prev.type === 'op' || prev.type === 'lparen' || prev.type === 'comma'
      if (isUnary) {
        if (next && next.type === 'num') {
          normalized.push({ type: 'num', v: next.v.neg() })
          i++
          continue
        }
        normalized.push({ type: 'num', v: new Decimal(0) })
      }
    }
    normalized.push(current)
  }

  for (const token of normalized) {
    if (token.type === 'num') {
      output.push(token)
    } else if (token.type === 'id') {
      const id = token.v.toLowerCase()
      if (id === 'pi') output.push({ type: 'num', v: DECIMAL_PI })
      else if (id === 'e') output.push({ type: 'num', v: DECIMAL_E })
      else ops.push({ type: 'id', v: id })
    } else if (token.type === 'op') {
      while (ops.length) {
        const top = ops[ops.length - 1]
        if (top?.type === 'op') {
          const p1 = precedence[token.v] ?? 0
          const p2 = precedence[top.v] ?? 0
          if ((rightAssoc.has(token.v) && p1 < p2) || (!rightAssoc.has(token.v) && p1 <= p2)) {
            output.push(ops.pop() as Tok)
            continue
          }
        }
        break
      }
      ops.push(token)
    } else if (token.type === 'lparen') {
      ops.push(token)
    } else if (token.type === 'rparen') {
      while (ops.length) {
        const top = ops[ops.length - 1]
        if (!top || top.type === 'lparen') break
        output.push(ops.pop() as Tok)
      }
      if (!ops.length) throw new Error('括号不匹配')
      ops.pop()
      if (ops.length && ops[ops.length - 1]?.type === 'id') {
        output.push(ops.pop() as Tok)
      }
    } else if (token.type === 'comma') {
      while (ops.length) {
        const top = ops[ops.length - 1]
        if (!top || top.type === 'lparen') break
        output.push(ops.pop() as Tok)
      }
      if (!ops.length) throw new Error('参数分隔符位置错误')
    }
  }

  while (ops.length) {
    const top = ops.pop() as Tok
    if (top.type === 'lparen' || top.type === 'rparen') throw new Error('括号不匹配')
    output.push(top)
  }

  return output
}

function evalRPN(rpn: Tok[], unit: AngleUnit): Decimal {
  const stack: Decimal[] = []
  const pop2 = (): { a: Decimal; b: Decimal } => {
    const b = stack.pop()
    const a = stack.pop()
    if (!a || !b) throw new Error('表达式错误')
    return { a, b }
  }

  for (const token of rpn) {
    if (token.type === 'num') {
      stack.push(token.v)
    } else if (token.type === 'op') {
      const { a, b } = pop2()
      switch (token.v) {
        case '+':
          stack.push(a.plus(b))
          break
        case '-':
          stack.push(a.minus(b))
          break
        case '*':
          stack.push(a.mul(b))
          break
        case '/':
          stack.push(a.div(b))
          break
        case '^':
          stack.push(a.pow(b))
          break
        default:
          throw new Error('未知运算符')
      }
    } else if (token.type === 'id') {
      const name = token.v.toLowerCase()
      const arity = name === 'log' ? (stack.length >= 2 ? 2 : 1) : 1
      const args: Decimal[] = []
      for (let i = 0; i < arity; i++) {
        const value = stack.pop()
        if (!value) throw new Error('函数参数不足')
        args.unshift(value)
      }
      const fn = functions[name]
      if (!fn) throw new Error(`未知函数: ${name}`)
      stack.push(fn(args, unit))
    }
  }

  if (stack.length !== 1) throw new Error('表达式不完整')
  return stack[0]!
}

function formatResult(value: Decimal, precision: number): string {
  if (!value.isFinite()) throw new Error('计算结果无效')
  if (precision === 0) {
    const integer = value.toDecimalPlaces(0, Decimal.ROUND_HALF_EVEN)
    return normalizeString(integer.toString())
  }

  const rounded = value.toDecimalPlaces(precision, Decimal.ROUND_HALF_EVEN)
  const str = rounded.toFixed(precision)
  return normalizeString(str)
}

function normalizeString(input: string): string {
  let s = input
  if (s.includes('e') || s.includes('E')) {
    // decimal.js 会生成科学记数法，根据规范保留原表示
    return s
  }
  if (s.includes('.')) {
    s = s.replace(/\.0+$/, '.0')
    s = s.replace(/\.(\d*?)0+$/, '.$1')
    s = s.replace(/\.$/, '')
  }
  if (s === '-0') s = '0'
  return s
}

export default evaluateExpressionSafe
