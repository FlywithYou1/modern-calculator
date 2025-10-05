import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  trackState, 
  trackPerformance, 
  trackError, 
  trackEvent, 
  getDebugSnapshot, 
  clearDebugData, 
  getPerformanceMetrics
} from '@/utils/mcp-debugger'

describe('MCP Debugger', () => {
  beforeEach(() => {
    clearDebugData()
    vi.clearAllMocks()
  })

  afterEach(() => {
    clearDebugData()
  })

  describe('State Tracking', () => {
    it('should track calculator state', () => {
      const state = {
        expression: '2 + 2',
        result: '4',
        memory: '0',
      }

      trackState(state)
      const snapshot = getDebugSnapshot()
      
      expect(snapshot.states).toHaveLength(1)
      expect(snapshot.states.length).toBeGreaterThan(0)
      if (snapshot.states[0]) {
        expect(snapshot.states[0].expression).toBe('2 + 2')
        expect(snapshot.states[0].result).toBe('4')
        expect(snapshot.states[0].timestamp).toBeDefined()
      }
    })

    it('should limit state history', () => {
      for (let i = 0; i < 105; i++) {
        trackState({
          expression: `${i} + ${i}`,
          result: `${i * 2}`,
          memory: '0',
        })
      }

      const snapshot = getDebugSnapshot()
      expect(snapshot.states).toHaveLength(100)
    })
  })

  describe('Performance Tracking', () => {
    it('should track performance metrics', () => {
      trackPerformance({
        operation: 'calculate',
        duration: 125.5,
      })
      
      const snapshot = getDebugSnapshot()
      expect(snapshot.performance).toHaveLength(1)
      
      if (snapshot.performance[0]) {
        expect(snapshot.performance[0].operation).toBe('calculate')
        expect(snapshot.performance[0].duration).toBe(125.5)
      }
    })

    it('should calculate performance statistics', () => {
      trackPerformance({ operation: 'calculate', duration: 100 })
      trackPerformance({ operation: 'calculate', duration: 200 })
      trackPerformance({ operation: 'calculate', duration: 150 })

      const metrics = getPerformanceMetrics()
      expect(Object.keys(metrics)).toContain('calculate')
      
      if (metrics.calculate) {
        expect(metrics.calculate.count).toBe(3)
        expect(metrics.calculate.average).toBe(150)
        expect(metrics.calculate.min).toBe(100)
        expect(metrics.calculate.max).toBe(200)
      }
    })
  })

  describe('Error Tracking', () => {
    it('should track errors with context', () => {
      const error = {
        type: 'CalculationError',
        message: 'Division by zero',
        context: {
          expression: '5 / 0',
        },
      }

      trackError(error)
      const snapshot = getDebugSnapshot()
      
      expect(snapshot.errors).toHaveLength(1)
      if (snapshot.errors[0]) {
        expect(snapshot.errors[0].type).toBe('CalculationError')
        expect(snapshot.errors[0].message).toBe('Division by zero')
      }
    })

    it('should limit error history', () => {
      for (let i = 0; i < 55; i++) {
        trackError({
          type: 'TestError',
          message: `Error ${i}`,
        })
      }

      const snapshot = getDebugSnapshot()
      expect(snapshot.errors).toHaveLength(50)
    })
  })

  describe('Event Tracking', () => {
    it('should track user interaction events', () => {
      const event = {
        type: 'button-click',
        target: 'number-5',
        metadata: {
          deviceType: 'desktop',
        },
      }

      trackEvent(event)
      const snapshot = getDebugSnapshot()
      
      expect(snapshot.events).toHaveLength(1)
      if (snapshot.events[0]) {
        expect(snapshot.events[0].type).toBe('button-click')
        expect(snapshot.events[0].target).toBe('number-5')
      }
    })
  })

  describe('Data Management', () => {
    it('should clear all debug data', () => {
      trackState({ expression: 'test', result: '0', memory: '0' })
      trackPerformance({ operation: 'test', duration: 100 })
      trackError({ type: 'TestError', message: 'Test' })
      trackEvent({ type: 'test', target: 'test' })

      let snapshot = getDebugSnapshot()
      expect(snapshot.states).toHaveLength(1)
      expect(snapshot.performance).toHaveLength(1)
      expect(snapshot.errors).toHaveLength(1)
      expect(snapshot.events).toHaveLength(1)

      clearDebugData()

      snapshot = getDebugSnapshot()
      expect(snapshot.states).toHaveLength(0)
      expect(snapshot.performance).toHaveLength(0)
      expect(snapshot.errors).toHaveLength(0)
      expect(snapshot.events).toHaveLength(0)
    })
  })

  describe('Debug Snapshot', () => {
    it('should generate comprehensive debug snapshot', () => {
      trackState({ expression: 'test', result: '123', memory: '0' })
      trackPerformance({ operation: 'test', duration: 100 })
      trackError({ type: 'TestError', message: 'Test error' })
      trackEvent({ type: 'test-event', target: 'test-target' })

      const snapshot = getDebugSnapshot()
      
      expect(snapshot.timestamp).toBeDefined()
      expect(snapshot.states).toHaveLength(1)
      expect(snapshot.performance).toHaveLength(1)
      expect(snapshot.errors).toHaveLength(1)
      expect(snapshot.events).toHaveLength(1)
      expect(snapshot.system).toBeDefined()
      expect(snapshot.system.userAgent).toBeDefined()
    })

    it('should be JSON serializable', () => {
      trackState({ expression: '2+2', result: '4', memory: '0' })
      trackPerformance({ operation: 'calculate', duration: 50 })
      
      const snapshot = getDebugSnapshot()
      
      expect(() => JSON.stringify(snapshot)).not.toThrow()
      
      const serialized = JSON.stringify(snapshot)
      const parsed = JSON.parse(serialized)
      
      expect(parsed.states).toHaveLength(1)
      expect(parsed.performance).toHaveLength(1)
    })
  })
})