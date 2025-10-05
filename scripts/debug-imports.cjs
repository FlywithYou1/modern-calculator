#!/usr/bin/env node
/* *
 * 调试导入路径脚本 */

const fs = require('fs')
const path = require('path')

// 测试文件
const projectRoot = process.cwd()
const relativeFilePath = path.join('src', 'components', 'Calculator.ts')
const filePath = path.join(projectRoot, relativeFilePath)
const content = fs.readFileSync(filePath, 'utf-8')

console.log('🔍 调试导入路径...')
console.log(`📄 文件: ${relativeFilePath}`)
console.log('')

// 测试不同的正则表达式
const patterns = [
  /(import\s+(?:type\s+)?(?:[^'\"]*from\s+)?['\"])..\/types\/calculator(\\.js)?(['\"])/g,
  /(import\s+(?:type\s+)?(?:[^'\"]*from\s+)?['\"])..\/types\/calculator(['\"])/g,
  /from\s+['\"]..\/types\/calculator(['\"])/g,
  /from\s+['\"](..\/types\/calculator)['\"]/g,
]

for (let i = 0; i < patterns.length; i++) {
  const pattern = patterns[i]
  console.log(`模式 ${i + 1}: ${pattern}`)
  
  const matches = content.match(pattern)
  if (matches) {
    console.log(`  匹配到: ${matches.length} 个结果`)
    matches.forEach((match, index) => {
      console.log(`    ${index + 1}. ${match}`)
    })
  } else {
    console.log('  没有匹配到')
  }
  console.log('')
}

// 测试替换
console.log('🔄 测试替换...')
const testContent = "import type { CalculatorState } from '../types/calculator.js'"
console.log(`原始: ${testContent}`)

const replacePattern = /(import\s+(?:type\s+)?(?:[^'\"]*from\s+)?['\"])..\/types\/calculator(\\.js)?(['\"])/g
const replaced = testContent.replace(replacePattern, "$1@/types/calculator$3")
console.log(`替换后: ${replaced}`)