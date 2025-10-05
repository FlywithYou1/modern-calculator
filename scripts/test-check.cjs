#!/usr/bin/env node
/* *
 * 测试检查脚本 */

const fs = require('fs')

const content = fs.readFileSync('src/tests/calculator.test.ts', 'utf-8')

console.log('包含 ../components/Calculator:', content.includes('../components/Calculator'))
console.log('包含 "../components/Calculator":', content.includes('"../components/Calculator"'))
console.log("包含 '../components/Calculator':", content.includes("'../components/Calculator'"))

// 检查具体行
const lines = content.split('\n')
for (let i = 0; i < Math.min(10, lines.length); i++) {
  if (lines[i].includes('../components/Calculator')) {
    console.log(`第 ${i + 1} 行: ${lines[i]}`)
  }
}