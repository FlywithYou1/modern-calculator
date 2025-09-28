import { describe, it, expect } from 'vitest'
import { evaluateExpressionSafe } from '../utils/evaluator'

describe('evaluateExpressionSafe', () => {
  it('should evaluate basic arithmetic', () => {
    expect(evaluateExpressionSafe('1+2*3')).toBe('7')
    expect(evaluateExpressionSafe('(1+2)*3')).toBe('9')
    expect(evaluateExpressionSafe('10/4', { precision: 4 })).toBe('2.5')
  })

  it('should handle power and sqrt', () => {
    expect(evaluateExpressionSafe('2^3')).toBe('8')
    expect(evaluateExpressionSafe('sqrt(16)')).toBe('4')
  })

  it('should support constants and trig (degrees by default)', () => {
    // sin(30°) = 0.5
    expect(evaluateExpressionSafe('sin(30)', { precision: 6 })).toBe('0.5')
    // cos(60°) = 0.5
    expect(evaluateExpressionSafe('cos(60)', { precision: 6 })).toBe('0.5')
    // 2π ~= 6.283185...
    expect(evaluateExpressionSafe('2*pi', { precision: 6 })).toBe('6.283185')
  })

  it('should evaluate logarithms', () => {
    expect(evaluateExpressionSafe('log(100)')).toBe('2') // log10
    expect(evaluateExpressionSafe('log(2,8)', { precision: 6 })).toBe('3')
    expect(evaluateExpressionSafe('ln(e)')).toBe('1')
  })

  it('should round consistently with precision option', () => {
    expect(evaluateExpressionSafe('0.1+0.2', { precision: 10 })).toBe('0.3')
    expect(evaluateExpressionSafe('1/3', { precision: 8 })).toBe('0.33333333')
    expect(evaluateExpressionSafe('2/3', { precision: 12 })).toBe('0.666666666667')
  })

  it('should throw on invalid input', () => {
    expect(() => evaluateExpressionSafe('foo(1)')).toThrow()
    expect(() => evaluateExpressionSafe('(')).toThrow()
  })
})
