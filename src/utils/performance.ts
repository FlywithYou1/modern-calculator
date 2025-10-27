


export interface PerformanceMetrics {
  calculationTime: number
  memoryUsage: number
  frameRate: number
  cacheHitRate: number
  errorRate: number
}

export interface PerformanceReport {
  timestamp: number
  metrics: PerformanceMetrics
  context: {
    expression: string
    result: string
    operation: string
  }
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    calculationTime: 0,
    memoryUsage: 0,
    frameRate: 60,
    cacheHitRate: 0,
    errorRate: 0,
  }

  private frameCount = 0
  private lastFrameTime = performance.now()
  private frameRateInterval = 1000
  private calculationTimes: number[] = []
  private cacheHits = 0
  private cacheMisses = 0
  private errors = 0
  private totalOperations = 0

  private reportCallbacks: ((report: PerformanceReport) => void)[] = []

  constructor() {
    this.startFrameRateMonitoring()
    this.startMemoryMonitoring()
  }


  private startFrameRateMonitoring(): void {
    const updateFrameRate = () => {
      const now = performance.now()
      const elapsed = now - this.lastFrameTime

      if (elapsed >= this.frameRateInterval) {
        this.metrics.frameRate = Math.round((this.frameCount * 1000) / elapsed)
        this.frameCount = 0
        this.lastFrameTime = now
      }

      this.frameCount++
      requestAnimationFrame(updateFrameRate)
    }

    requestAnimationFrame(updateFrameRate)
  }


  private startMemoryMonitoring(): void {
    const updateMemory = () => {
      const perf = performance as Performance & { memory?: { usedJSHeapSize: number } }
      const mem = perf.memory
      if (mem && typeof mem.usedJSHeapSize === 'number') {
        this.metrics.memoryUsage = Math.round(mem.usedJSHeapSize / 1024 / 1024)
      }
      setTimeout(updateMemory, 5000)
    }

    updateMemory()
  }


  startCalculation(): () => PerformanceMetrics {
    const startTime = performance.now()
    this.totalOperations++

    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime

      this.calculationTimes.push(duration)
      if (this.calculationTimes.length > 100) {
        this.calculationTimes.shift()
      }

      this.metrics.calculationTime = Math.round(
        this.calculationTimes.reduce((a, b) => a + b, 0) / this.calculationTimes.length
      )

      return this.metrics
    }
  }


  recordCacheHit(): void {
    this.cacheHits++
    this.updateCacheHitRate()
  }


  recordCacheMiss(): void {
    this.cacheMisses++
    this.updateCacheHitRate()
  }


  private updateCacheHitRate(): void {
    const total = this.cacheHits + this.cacheMisses
    this.metrics.cacheHitRate = total > 0 ? (this.cacheHits / total) * 100 : 0
  }


  recordError(): void {
    this.errors++
    this.metrics.errorRate = (this.errors / this.totalOperations) * 100
  }


  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }


  generateReport(context: { expression: string; result: string; operation: string }): PerformanceReport {
    const report: PerformanceReport = {
      timestamp: Date.now(),
      metrics: this.getMetrics(),
      context,
    }

    this.reportCallbacks.forEach(callback => {
      try {
        callback(report)
      } catch (error) {
        console.error('性能报告回调执行失败:', error)
      }
    })

    return report
  }


  onReport(callback: (report: PerformanceReport) => void): () => void {
    this.reportCallbacks.push(callback)

    return () => {
      const index = this.reportCallbacks.indexOf(callback)
      if (index > -1) {
        this.reportCallbacks.splice(index, 1)
      }
    }
  }


  reset(): void {
    this.metrics = {
      calculationTime: 0,
      memoryUsage: 0,
      frameRate: 60,
      cacheHitRate: 0,
      errorRate: 0,
    }
    this.calculationTimes = []
    this.cacheHits = 0
    this.cacheMisses = 0
    this.errors = 0
    this.totalOperations = 0
  }


  isPerformanceAcceptable(): boolean {
    return (
      this.metrics.calculationTime < 100 && 
      this.metrics.frameRate >= 30 && 
      this.metrics.memoryUsage < 100 && 
      this.metrics.errorRate < 5 
    )
  }


  getPerformanceSuggestions(): string[] {
    const suggestions: string[] = []

    if (this.metrics.calculationTime > 100) {
      suggestions.push('计算时间较长，建议优化复杂表达式或启用缓存')
    }

    if (this.metrics.frameRate < 30) {
      suggestions.push('帧率较低，建议减少界面动画复杂度')
    }

    if (this.metrics.memoryUsage > 100) {
      suggestions.push('内存使用较高，建议清理历史记录和缓存')
    }

    if (this.metrics.errorRate > 5) {
      suggestions.push('错误率较高，建议检查输入表达式格式')
    }

    if (this.metrics.cacheHitRate < 50) {
      suggestions.push('缓存命中率较低，建议优化缓存策略')
    }

    return suggestions
  }
}


export const performanceMonitor = new PerformanceMonitor()


if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).performanceMonitor = performanceMonitor
}



export function monitorPerformance(operationName: string) {
  return function (
    _target: unknown,
    _propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      const endMeasurement = performanceMonitor.startCalculation()

      try {
        const result = await method.apply(this, args)
        performanceMonitor.generateReport({
          expression: typeof args[0] === 'string' ? args[0] : '',
          result: typeof result === 'string' ? result : 'success',
          operation: operationName,
        })

        return result
      } catch (error) {
        performanceMonitor.recordError()
        throw error
      } finally {
        endMeasurement()
      }
    }

    return descriptor
  }
}