import { describe, it, expect, beforeEach } from 'vitest'
import {
  mcpDebugger,
  trackState,
  trackPerformance,
  trackError,
  getPerformanceMetrics,
  clearDebugData,
} from '@/utils/mcp-debugger'

describe('MCP Debugger - Basic', () => {
  beforeEach(() => {
    clearDebugData()
  })

  it('should track state/performance/error and produce metrics', async () => {
    await mcpDebugger.setEnabled(true)

    trackState({ expression: '1+1', result: '2', memory: '0' })
    trackPerformance({ operation: 'calculate', duration: 120 })
    trackPerformance({ operation: 'calculate', duration: 80 })
    trackError({ type: 'TestError', message: 'oops' })

    const metrics = getPerformanceMetrics()
    expect(metrics).toHaveProperty('calculate')
    const calc = metrics['calculate']!
    expect(calc.count).toBe(2)
    expect(calc.min).toBe(80)
    expect(calc.max).toBe(120)
    expect(Math.round(calc.average)).toBe(100)
  })
})
