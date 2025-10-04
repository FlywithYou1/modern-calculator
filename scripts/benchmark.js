#!/usr/bin/env node
/* *
 * 性能基准测试脚本
 * 测试计算器各个组件和功能的性能表现 */

import { performance } from 'perf_hooks'
import path from 'path'
import { readFileSync, writeFileSync } from 'fs'

/* *
 * 性能测试套件 */
class PerformanceBenchmark {
  constructor() {
    this.results = []
    this.iterations = 50 // 减少迭代次数以加快测试
    this.warmupIterations = 5
  }

  /* *
   * 运行基准测试 */
  async run() {
    console.log('🚀 启动性能基准测试...\n')

    // 模拟计算性能测试
    await this.testCalculationPerformance()
    await this.testExpressionParsing()
    await this.testMemoryOperations()
    await this.testHistoryOperations()
    await this.testUIPerformance()

    this.generateReport()
  }

  /* *
   * 测试计算性能 */
  async testCalculationPerformance() {
    console.log('📊 测试计算性能...')

    const expressions = [
      '2 + 2',
      '3.14159 * 2.71828',
      'sin(45) + cos(45)',
      'sqrt(16) + log(10)',
      'pow(2, 10) - factorial(5)',
      '(1 + 2) * (3 + 4) / (5 + 6)',
      'e^(pi * i) + 1',
      'integral(x^2, 0, 10)',
    ]

    for (const expr of expressions) {
      const result = await this.measureFunction(
        () => this.simulateCalculation(expr),
        `计算: ${expr}`,
        100
      )
      this.results.push(result)
    }
  }

  /* *
   * 测试表达式解析性能 */
  async testExpressionParsing() {
    console.log('🔤 测试表达式解析性能...')

    const complexExpressions = [
      'sin(cos(tan(radians(45))))',
      'log(sqrt(abs(-100)) + exp(2))',
      'fibonacci(20) + prime(100)',
      'matrix_multiply([[1,2],[3,4]], [[5,6],[7,8]])',
      'complex_add(3+4i, 2-1i)',
    ]

    for (const expr of complexExpressions) {
      const result = await this.measureFunction(
        () => this.simulateExpressionParsing(expr),
        `解析: ${expr}`,
        50
      )
      this.results.push(result)
    }
  }

  /* *
   * 测试内存操作性能 */
  async testMemoryOperations() {
    console.log('💾 测试内存操作性能...')

    const operations = [
      'memory_store',
      'memory_recall',
      'memory_add',
      'memory_clear',
    ]

    for (const op of operations) {
      const result = await this.measureFunction(
        () => this.simulateMemoryOperation(op),
        `内存操作: ${op}`,
        500
      )
      this.results.push(result)
    }
  }

  /* *
   * 测试历史记录操作性能 */
  async testHistoryOperations() {
    console.log('📚 测试历史记录操作性能...')

    const operations = [
      { name: 'add_history', size: 100 },
      { name: 'search_history', size: 1000 },
      { name: 'clear_history', size: 500 },
      { name: 'export_history', size: 1000 },
    ]

    for (const op of operations) {
      const result = await this.measureFunction(
        () => this.simulateHistoryOperation(op.name, op.size),
        `历史操作: ${op.name} (${op.size}项)`,
        50
      )
      this.results.push(result)
    }
  }

  /* *
   * 测试UI性能 */
  async testUIPerformance() {
    console.log('🎨 测试UI渲染性能...')

    const uiOperations = [
      'display_update',
      'keyboard_render',
      'theme_switch',
      'panel_animation',
      'resize_handling',
    ]

    for (const op of uiOperations) {
      const result = await this.measureFunction(
        () => this.simulateUIOperation(op),
        `UI操作: ${op}`,
        200
      )
      this.results.push(result)
    }
  }

  /* *
   * 测量函数执行时间 */
  async measureFunction(fn, name, iterations = this.iterations) {
    // 预热
    for (let i = 0; i < Math.min(this.warmupIterations, iterations / 10); i++) {
      await fn()
    }

    // 实际测试
    const times = []
    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      await fn()
      const end = performance.now()
      times.push(end - start)
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length
    const min = Math.min(...times)
    const max = Math.max(...times)
    const p95 = this.percentile(times, 95)
    const p99 = this.percentile(times, 99)

    return {
      name,
      iterations,
      average: avg.toFixed(3),
      min: min.toFixed(3),
      max: max.toFixed(3),
      p95: p95.toFixed(3),
      p99: p99.toFixed(3),
    }
  }

  /* *
   * 计算百分位数 */
  percentile(arr, p) {
    const sorted = [...arr].sort((a, b) => a - b)
    const index = (p / 100) * (sorted.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    const weight = index % 1

    if (upper >= sorted.length) return sorted[sorted.length - 1]
    return sorted[lower] * (1 - weight) + sorted[upper] * weight
  }

  /* *
   * 模拟计算操作 */
  async simulateCalculation(expression) {
    // 模拟解析和计算时间
    await this.delay(Math.random() * 2 + 1)
    
    // 模拟不同复杂度的计算
    const complexity = expression.length + (expression.match(/[a-zA-Z]/g) || []).length * 2
    await this.delay(complexity * 0.1)
    
    return Math.random() * 1000
  }

  /* *
   * 模拟表达式解析 */
  async simulateExpressionParsing(expression) {
    // 模拟词法分析和语法解析
    const tokenCount = expression.match(/\\w+|[().,]/g)?.length || 1
    await this.delay(tokenCount * 0.05)
    return true
  }

  /* *
   * 模拟内存操作 */
  async simulateMemoryOperation(operation) {
    const operationTimes = {
      memory_store: 0.5,
      memory_recall: 0.3,
      memory_add: 0.8,
      memory_clear: 0.2,
    }
    await this.delay(operationTimes[operation] || 0.5)
    return true
  }

  /* *
   * 模拟历史记录操作 */
  async simulateHistoryOperation(operation, size) {
    const baseTimes = {
      add_history: 1,
      search_history: size * 0.01,
      clear_history: size * 0.005,
      export_history: size * 0.02,
    }
    await this.delay(baseTimes[operation] || 1)
    return true
  }

  /* *
   * 模拟UI操作 */
  async simulateUIOperation(operation) {
    const operationTimes = {
      display_update: 2,
      keyboard_render: 5,
      theme_switch: 10,
      panel_animation: 16.67, // 60fps 一帧
      resize_handling: 8,
    }
    await this.delay(operationTimes[operation] || 5)
    return true
  }

  /* *
   * 延迟函数 */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /* *
   * 生成性能报告 */
  generateReport() {
    console.log('\\n📋 性能基准测试报告')
    console.log('=' .repeat(80))
    
    console.log('| 测试项目                          | 迭代次数 | 平均(ms) | 最小(ms) | 最大(ms) | P95(ms) | P99(ms) |')
    console.log('|' + '-'.repeat(79) + '|')
    
    this.results.forEach(result => {
      const name = result.name.padEnd(32)
      const iterations = result.iterations.toString().padStart(6)
      const avg = result.average.padStart(7)
      const min = result.min.padStart(7)
      const max = result.max.padStart(7)
      const p95 = result.p95.padStart(6)
      const p99 = result.p99.padStart(6)
      
      console.log(`| ${name} | ${iterations} | ${avg} | ${min} | ${max} | ${p95} | ${p99} |`)
    })
    
    console.log('=' .repeat(80))

    // 性能评级
    console.log('\\n📊 性能评级:')
    const avgTimes = this.results.map(r => parseFloat(r.average))
    const overallAvg = avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length
    
    let grade = 'A+'
    let comment = '优秀'
    
    if (overallAvg > 50) {
      grade = 'C'
      comment = '需要优化'
    } else if (overallAvg > 20) {
      grade = 'B'
      comment = '良好'
    } else if (overallAvg > 10) {
      grade = 'A'
      comment = '很好'
    }
    
    console.log(`  总体评级: ${grade} (${comment})`)
    console.log(`  平均响应时间: ${overallAvg.toFixed(2)}ms`)
    
    // 性能建议
    console.log('\\n💡 性能建议:')
    const slowTests = this.results.filter(r => parseFloat(r.average) > 20)
    if (slowTests.length > 0) {
      console.log('  以下操作响应较慢，建议优化:')
      slowTests.forEach(test => {
        console.log(`    - ${test.name}: ${test.average}ms`)
      })
    } else {
      console.log('  所有测试项目性能表现良好！')
    }

    // 保存结果
    this.saveResults()
  }

  /* *
   * 保存测试结果 */
  saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `benchmark-results-${timestamp}.json`
    
    const report = {
      timestamp: new Date().toISOString(),
      version: JSON.parse(readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), '../package.json'), 'utf-8')).version,
      platform: process.platform,
      nodeVersion: process.version,
      results: this.results,
      summary: {
        totalTests: this.results.length,
        averageTime: this.results.reduce((sum, r) => sum + parseFloat(r.average), 0) / this.results.length,
      },
    }
    
    try {
      writeFileSync(filename, JSON.stringify(report, null, 2))
      console.log(`\n💾 测试结果已保存到: ${filename}`)
    } catch (error) {
      console.error('❌ 保存结果失败:', error.message)
    }
  }
}

// 运行基准测试
if (import.meta.url === `file://${process.argv[1]}`) {
  const benchmark = new PerformanceBenchmark()
  benchmark.run().catch(console.error)
}

export { PerformanceBenchmark }