/**
 * 安全表达式求值器（前端回退用）
 * - 支持: + - * / ^ ( )，函数: sin cos tan ln log sqrt，常数: π pi e
 * - 角度单位: degrees | radians | gradians
 * - 仅用于 Tauri 后端不可用时的回退计算；不承诺金融级精度（JS number），但避免使用 eval。
 */

export type AngleUnit = 'degrees' | 'radians' | 'gradians'

export interface EvalOptions {
  angleUnit?: AngleUnit
  precision?: number
}

const toRadians = (x: number, unit: AngleUnit): number => {
  switch (unit) {
    case 'degrees':
      return (x * Math.PI) / 180
    case 'gradians':
      return (x * Math.PI) / 200
    default:
      return x
  }
}

const getArg = (args: number[], i: number): number => {
  const v = args[i]
  if (typeof v !== 'number' || Number.isNaN(v)) throw new Error('函数参数不足')
  return v
}

const functions: Record<string, (args: number[], unit: AngleUnit) => number> = {
  sin: (args, unit) => Math.sin(toRadians(getArg(args, 0), unit)),
  cos: (args, unit) => Math.cos(toRadians(getArg(args, 0), unit)),
  tan: (args, unit) => Math.tan(toRadians(getArg(args, 0), unit)),
  ln: (args) => Math.log(getArg(args, 0)),
  log: (args) => (args.length === 1 ? Math.log10(getArg(args, 0)) : Math.log(getArg(args, 1)) / Math.log(getArg(args, 0))),
  sqrt: (args) => Math.sqrt(getArg(args, 0)),
}

const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 }
const rightAssoc = new Set(['^'])

export function evaluateExpressionSafe(input: string, opts: EvalOptions = {}): string {
  const angleUnit: AngleUnit = opts.angleUnit || 'degrees'
  const precision = Math.max(0, Math.min(20, opts.precision ?? 12))

  const expr = sanitize(input)
  const tokens = tokenize(expr)
  const rpn = toRPN(tokens)
  const result = evalRPN(rpn, angleUnit)

  if (!isFinite(result)) throw new Error('计算结果无效')
  return Number(result.toFixed(precision)).toString()
}

function sanitize(s: string): string {
  return s
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, 'pi')
    .replace(/ℯ/g, 'e')
    .replace(/\s+/g, '')
}

type Tok = { type: 'num'; v: number } | { type: 'op'; v: string } | { type: 'lparen' | 'rparen' } | { type: 'id'; v: string } | { type: 'comma' }

function tokenize(s: string): Tok[] {
  const out: Tok[] = []
  let i = 0
  while (i < s.length) {
    const c = s.charAt(i)
    if (/[0-9.]/.test(c)) {
      let j = i + 1
      while (j < s.length && /[0-9.]/.test(s.charAt(j))) j++
      const num = Number(s.slice(i, j))
      if (Number.isNaN(num)) throw new Error('无效数字')
      out.push({ type: 'num', v: num })
      i = j
    } else if (/[a-zA-Z_]/.test(c)) {
      let j = i + 1
      while (j < s.length && /[a-zA-Z0-9_]/.test(s.charAt(j))) j++
      const id = s.slice(i, j)
      out.push({ type: 'id', v: id })
      i = j
    } else if (c === '+' || c === '-' || c === '*' || c === '/' || c === '^') {
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

  // 处理一元负号：将模式 (op|lparen|start) '-' num 替换为 (op) (lparen) (num * -1)
  const normalized: Tok[] = []
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!
    if (t.type === 'op' && t.v === '-') {
      const prev = tokens[i - 1]
      const next = tokens[i + 1]
      const isUnary = !prev || prev.type === 'op' || prev.type === 'lparen' || prev.type === 'comma'
      if (isUnary && next && next.type === 'num') {
        normalized.push({ type: 'num', v: -next.v })
        i++
        continue
      }
    }
    normalized.push(t)
  }

  for (let i = 0; i < normalized.length; i++) {
    const t = normalized[i]!
    if (t.type === 'num') {
      output.push(t)
    } else if (t.type === 'id') {
      // 函数或常数：常数直接出栈为数字，函数先入栈，等到 lparen 后处理
      if (t.v.toLowerCase() === 'pi') output.push({ type: 'num', v: Math.PI })
      else if (t.v === 'e') output.push({ type: 'num', v: Math.E })
      else ops.push(t)
    } else if (t.type === 'op') {
      while (ops.length) {
        const top = ops[ops.length - 1] as Tok | undefined
        if (top && top.type === 'op') {
          const p1 = precedence[t.v] ?? 0
          const p2 = precedence[(top as { type: 'op'; v: string }).v] ?? 0
          if ((rightAssoc.has(t.v) && p1 < p2) || (!rightAssoc.has(t.v) && p1 <= p2)) {
            output.push(ops.pop()!)
            continue
          }
        }
        break
      }
      ops.push(t)
    } else if (t.type === 'lparen') {
      ops.push(t)
    } else if (t.type === 'rparen') {
      while (ops.length) {
        const top = ops[ops.length - 1] as Tok | undefined
        if (!top || top.type === 'lparen') break
        output.push(ops.pop()!)
      }
      if (!ops.length) throw new Error('括号不匹配')
      ops.pop() // pop lparen
      // 如果栈顶是函数 id，则输出函数
      if (ops.length && ops[ops.length - 1] && ops[ops.length - 1]!.type === 'id') {
        output.push(ops.pop()!)
      }
    } else if (t.type === 'comma') {
      while (ops.length) {
        const top = ops[ops.length - 1] as Tok | undefined
        if (!top || top.type === 'lparen') break
        output.push(ops.pop()!)
      }
      if (!ops.length) throw new Error('参数分隔符位置错误')
    }
  }

  while (ops.length) {
    const top = ops.pop()!
    if (top.type === 'lparen' || top.type === 'rparen') throw new Error('括号不匹配')
    output.push(top)
  }
  return output
}

function evalRPN(rpn: Tok[], unit: AngleUnit): number {
  const st: number[] = []
  const pop2 = () => {
    const b = st.pop(); const a = st.pop();
    if (a == null || b == null) throw new Error('表达式错误')
    return { a, b }
  }
  for (const t of rpn) {
    if (t.type === 'num') st.push(t.v)
    else if (t.type === 'op') {
      const { a, b } = pop2()
      switch (t.v) {
        case '+': st.push(a + b); break
        case '-': st.push(a - b); break
        case '*': st.push(a * b); break
        case '/': st.push(a / b); break
        case '^': st.push(Math.pow(a, b)); break
        default: throw new Error('未知运算符')
      }
    } else if (t.type === 'id') {
      // 函数：从栈中回溯参数直到上一个函数/起点（此处简化为常见单参/双参函数）
      const name = t.v.toLowerCase()
      if (!(name in functions)) throw new Error(`未知函数: ${name}`)
      // 估计参数个数：从前一段 tokens 无法直接得知，约定常用函数参数个数
      const arity = name === 'log' ? (st.length >= 2 ? 2 : 1) : 1
      const args: number[] = []
      for (let i = 0; i < arity; i++) {
        const v = st.pop()
        if (v == null) throw new Error('函数参数不足')
        args.unshift(v)
      }
      const fn = functions[name]
      if (!fn) throw new Error(`未知函数: ${name}`)
      st.push(fn(args, unit))
    }
  }
  if (st.length !== 1) throw new Error('表达式不完整')
  const res = st[0]
  if (typeof res !== 'number') throw new Error('结果类型错误')
  return res
}

export default evaluateExpressionSafe
