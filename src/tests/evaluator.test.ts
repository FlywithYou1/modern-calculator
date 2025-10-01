/**
 * Evaluator 工具函数测试
 * 覆盖表达式计算、解析和验证的所有功能
 */

import { describe, it, expect } from 'vitest'
import { evaluateExpressionSafe, type EvalOptions } from '../utils/evaluator.js'

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
    expect(() => evaluateExpressionSafe('1/0')).toThrow()
    expect(() => evaluateExpressionSafe('sqrt(-1)')).toThrow()
    expect(() => evaluateExpressionSafe('log(-1)')).toThrow()
  })

  it('should handle complex expressions with correct operator precedence', () => {
    expect(evaluateExpressionSafe('2+3*4-5')).toBe('9')
    expect(evaluateExpressionSafe('(2+3)*4-5')).toBe('15')
    expect(evaluateExpressionSafe('2+3*(4-5)')).toBe('-1')
    expect(evaluateExpressionSafe('2^3^2')).toBe('512') // Right associative: 2^(3^2)
  })

  it('should handle negative numbers correctly', () => {
    expect(evaluateExpressionSafe('-2+3')).toBe('1')
    expect(evaluateExpressionSafe('2*-3')).toBe('-6')
    expect(evaluateExpressionSafe('-2-3')).toBe('-5')
    expect(evaluateExpressionSafe('(-2)^3')).toBe('-8')
  })

  it('should support scientific notation', () => {
    expect(evaluateExpressionSafe('1e3+2e3')).toBe('3000')
    expect(evaluateExpressionSafe('2.5e-2*100')).toBe('2.5')
    expect(evaluateExpressionSafe('1e6/1e3')).toBe('1000')
  })

  it('should handle angle units correctly', () => {
    // Degrees (default)
    expect(evaluateExpressionSafe('sin(30)', { precision: 6 })).toBe('0.5')
    expect(evaluateExpressionSafe('cos(60)', { precision: 6 })).toBe('0.5')
    expect(evaluateExpressionSafe('tan(45)', { precision: 6 })).toBe('1')
    
    // Radians
    expect(evaluateExpressionSafe('sin(pi/6)', { precision: 6, angleUnit: 'radians' })).toBe('0.5')
    expect(evaluateExpressionSafe('cos(pi/3)', { precision: 6, angleUnit: 'radians' })).toBe('0.5')
    expect(evaluateExpressionSafe('tan(pi/4)', { precision: 6, angleUnit: 'radians' })).toBe('1')
    
    // Gradians
    expect(evaluateExpressionSafe('sin(50)', { precision: 6, angleUnit: 'gradians' })).toBe('0.7071067') // sin(50g) = sin(π/4)
  })

  it('should handle mathematical constants', () => {
    expect(evaluateExpressionSafe('pi', { precision: 10 })).toBe('3.1415926536')
    expect(evaluateExpressionSafe('e', { precision: 10 })).toBe('2.7182818285')
    expect(evaluateExpressionSafe('pi+e', { precision: 10 })).toBe('5.8598744820')
  })

  it('should handle edge cases and boundary values', () => {
    expect(evaluateExpressionSafe('0+0')).toBe('0')
    expect(evaluateExpressionSafe('0*12345')).toBe('0')
    expect(evaluateExpressionSafe('1*1')).toBe('1')
    expect(evaluateExpressionSafe('-1*-1')).toBe('1')
    expect(evaluateExpressionSafe('1000000+1000000')).toBe('2000000')
  })

  it('should handle decimal precision correctly', () => {
    expect(evaluateExpressionSafe('0.1+0.2', { precision: 0 })).toBe('0')
    expect(evaluateExpressionSafe('0.1+0.2', { precision: 1 })).toBe('0.3')
    expect(evaluateExpressionSafe('0.1+0.2', { precision: 10 })).toBe('0.3')
    expect(evaluateExpressionSafe('1/3', { precision: 3 })).toBe('0.333')
    expect(evaluateExpressionSafe('1/3', { precision: 15 })).toBe('0.333333333333333')
  })

  it('should handle function with multiple arguments', () => {
    expect(evaluateExpressionSafe('log(10,100)')).toBe('2') // log base 10 of 100
    expect(evaluateExpressionSafe('log(2,8)')).toBe('3') // log base 2 of 8
    expect(evaluateExpressionSafe('log(10)', { precision: 10 })).toBe('1') // log10(10)
  })

  it('should handle special numeric results', () => {
    expect(evaluateExpressionSafe('1/0')).toBe('Infinity')
    expect(evaluateExpressionSafe('-1/0')).toBe('-Infinity')
    expect(evaluateExpressionSafe('0/0')).toBe('NaN')
  })

  it('should handle very large and very small numbers', () => {
    expect(evaluateExpressionSafe('1e20+1e20')).toBe('2e+20')
    expect(evaluateExpressionSafe('1e-20*2')).toBe('2e-20')
    expect(evaluateExpressionSafe('1234567890123456789+1')).toBe('1234567890123456790')
  })

  it('should handle nested functions', () => {
    expect(evaluateExpressionSafe('sqrt(sin(30)^2+cos(30)^2)', { precision: 6 })).toBe('1') // Pythagorean identity
    expect(evaluateExpressionSafe('log(10,log(2,8))')).toBe('3') // log base 10 of log base 2 of 8
  })

  it('should handle parentheses nesting', () => {
    expect(evaluateExpressionSafe('(((((1)))))')).toBe('1')
    expect(evaluateExpressionSafe('(((2+3)*4)-5)/2')).toBe('7.5')
    expect(evaluateExpressionSafe('(2+(3*(4+5)))')).toBe('29')
  })

  it('should handle whitespace in expressions', () => {
    expect(evaluateExpressionSafe(' 2 + 3 * 4 ')).toBe('14')
    expect(evaluateExpressionSafe(' ( 2 + 3 ) * 4 ')).toBe('20')
    expect(evaluateExpressionSafe('sin ( 30 )', { precision: 6 })).toBe('0.5')
  })

  it('should handle scientific notation with different cases', () => {
    expect(evaluateExpressionSafe('1E3+2e3')).toBe('3000')
    expect(evaluateExpressionSafe('1.5E-2*100')).toBe('1.5')
    expect(evaluateExpressionSafe('2.5e+2-150')).toBe('100')
  })

  it('should handle division edge cases', () => {
    expect(evaluateExpressionSafe('5/2', { precision: 5 })).toBe('2.5')
    expect(evaluateExpressionSafe('1/3', { precision: 6 })).toBe('0.333333')
    expect(evaluateExpressionSafe('2/3', { precision: 6 })).toBe('0.666667')
    expect(() => evaluateExpressionSafe('1/0')).not.toThrow() // Should return Infinity
  })
})

describe('Evaluator Performance', () => {
  it('should handle large expressions efficiently', () => {
    const startTime = performance.now()
    
    // Test with a moderately complex expression
    for (let i = 0; i < 100; i++) {
      evaluateExpressionSafe(`${i} + ${i * 2} - ${i / 2}`)
    }
    
    const endTime = performance.now()
    expect(endTime - startTime).toBeLessThan(500) // Should complete in less than 500ms
  })

  it('should handle nested function calls efficiently', () => {
    const complexExpression = 'sqrt(sin(45)^2 + cos(45)^2) + log(10,100) + exp(0)'
    const startTime = performance.now()
    
    evaluateExpressionSafe(complexExpression)
    
    const endTime = performance.now()
    expect(endTime - startTime).toBeLessThan(100) // Should complete in less than 100ms
  })
})
