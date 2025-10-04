#!/usr/bin/env node
/* *
 * 无障碍测试脚本
 * 检查计算器应用的无障碍支持情况 */

import fs from 'fs'
import path from 'path'

/* *
 * 无障碍测试套件 */
class AccessibilityTester {
  constructor() {
    this.testResults = []
    this.srcDir = path.join(__dirname, '../src')
    this.distDir = path.join(__dirname, '../dist')
  }

  /* *
   * 运行无障碍测试 */
  async run() {
    console.log('♿ 启动无障碍测试...\n')

    await this.testHTMLStructure()
    await this.testARIAAttributes()
    await this.testKeyboardNavigation()
    await this.testColorContrast()
    await this.testTextAlternatives()
    await this.testSemanticStructure()
    await this.testFocusManagement()

    this.generateReport()
  }

  /* *
   * 测试HTML结构 */
  async testHTMLStructure() {
    console.log('🏗️ 测试HTML结构...')

    const tests = [
      {
        name: 'DOCTYPE声明',
        test: () => this.checkFileContains('index.html', '<!DOCTYPE html>'),
      },
      {
        name: 'lang属性',
        test: () => this.checkFileContains('index.html', 'lang='),
      },
      {
        name: 'viewport meta标签',
        test: () => this.checkFileContains('index.html', 'name="viewport"'),
      },
      {
        name: '页面标题',
        test: () => this.checkFileContains('index.html', '<title>'),
      },
    ]

    for (const test of tests) {
      try {
        const passed = await test.test()
        this.addResult('HTML结构', test.name, passed, passed ? '✅ 通过' : '❌ 未找到')
      } catch (error) {
        this.addResult('HTML结构', test.name, false, `❌ 测试失败: ${error.message}`)
      }
    }
  }

  /* *
   * 测试ARIA属性 */
  async testARIAAttributes() {
    console.log('🎯 测试ARIA属性...')

    const requiredARIA = [
      { pattern: /aria-label=/, name: 'aria-label属性' },
      { pattern: /aria-describedby=/, name: 'aria-describedby属性' },
      { pattern: /role=/, name: 'role属性' },
      { pattern: /aria-expanded=/, name: 'aria-expanded属性' },
      { pattern: /aria-hidden=/, name: 'aria-hidden属性' },
    ]

    const files = this.getSourceFiles(['ts', 'js'])
    
    for (const ariaTest of requiredARIA) {
      let found = false
      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf-8')
          if (ariaTest.pattern.test(content)) {
            found = true
            break
          }
        } catch (error) {
          console.warn(`无法读取文件 ${file}: ${error.message}`)
        }
      }
      this.addResult('ARIA属性', ariaTest.name, found, found ? '✅ 已实现' : '⚠️ 未找到')
    }
  }

  /* *
   * 测试键盘导航 */
  async testKeyboardNavigation() {
    console.log('⌨️ 测试键盘导航...')

    const keyboardTests = [
      {
        name: 'Tab键导航',
        pattern: /tabindex|addEventListener.*keydown/,
      },
      {
        name: 'Enter/Space激活',
        pattern: /Enter|Space.*key/,
      },
      {
        name: '箭头键导航',
        pattern: /ArrowUp|ArrowDown|ArrowLeft|ArrowRight/,
      },
      {
        name: 'Escape键处理',
        pattern: /Escape.*key/,
      },
      {
        name: 'focus管理',
        pattern: /focus\\(\\)|blur\\(\\)|activeElement/,
      },
    ]

    const files = this.getSourceFiles(['ts', 'js'])
    
    for (const test of keyboardTests) {
      let found = false
      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf-8')
          if (test.pattern.test(content)) {
            found = true
            break
          }
        } catch (error) {
          continue
        }
      }
      this.addResult('键盘导航', test.name, found, found ? '✅ 已实现' : '⚠️ 需要添加')
    }
  }

  /* *
   * 测试颜色对比度 */
  async testColorContrast() {
    console.log('🎨 测试颜色对比度...')

    const colorTests = [
      {
        name: '主题颜色变量',
        test: () => this.checkColorVariablesExist(),
      },
      {
        name: '高对比模式',
        test: () => this.checkHighContrastSupport(),
      },
      {
        name: '暗色主题',
        test: () => this.checkDarkThemeSupport(),
      },
    ]

    for (const test of colorTests) {
      try {
        const passed = await test.test()
        this.addResult('颜色对比', test.name, passed, passed ? '✅ 支持' : '⚠️ 需要完善')
      } catch (error) {
        this.addResult('颜色对比', test.name, false, `❌ 测试失败: ${error.message}`)
      }
    }
  }

  /* *
   * 测试文字替代 */
  async testTextAlternatives() {
    console.log('📝 测试文字替代...')

    const altTests = [
      {
        name: '按钮文字说明',
        pattern: /title=|aria-label=.*button/,
      },
      {
        name: '图标文字描述',
        pattern: /alt=|aria-label=.*icon/,
      },
      {
        name: '状态提示文字',
        pattern: /aria-live|role="status"/,
      },
    ]

    const files = this.getSourceFiles(['ts', 'js', 'html'])
    
    for (const test of altTests) {
      let found = false
      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf-8')
          if (test.pattern.test(content)) {
            found = true
            break
          }
        } catch (error) {
          continue
        }
      }
      this.addResult('文字替代', test.name, found, found ? '✅ 已添加' : '⚠️ 需要添加')
    }
  }

  /* *
   * 测试语义结构 */
  async testSemanticStructure() {
    console.log('🏷️ 测试语义结构...')

    const semanticTests = [
      {
        name: 'header标签',
        pattern: /<header|role="banner"/,
      },
      {
        name: 'main标签',
        pattern: /<main|role="main"/,
      },
      {
        name: 'section标签',
        pattern: /<section|role="region"/,
      },
      {
        name: 'nav标签',
        pattern: /<nav|role="navigation"/,
      },
      {
        name: '标题层次',
        pattern: /<h[1-6]|role="heading"/,
      },
    ]

    const files = this.getSourceFiles(['ts', 'js', 'html'])
    
    for (const test of semanticTests) {
      let found = false
      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf-8')
          if (test.pattern.test(content)) {
            found = true
            break
          }
        } catch (error) {
          continue
        }
      }
      this.addResult('语义结构', test.name, found, found ? '✅ 已使用' : '⚠️ 建议添加')
    }
  }

  /* *
   * 测试焦点管理 */
  async testFocusManagement() {
    console.log('🎯 测试焦点管理...')

    const focusTests = [
      {
        name: '焦点样式',
        pattern: /:focus|focus-visible/,
      },
      {
        name: '焦点陷阱',
        pattern: /focus.*trap|modal.*focus/,
      },
      {
        name: '跳过链接',
        pattern: /skip.*link|skip.*content/,
      },
      {
        name: '焦点还原',
        pattern: /previousActiveElement|restoreFocus/,
      },
    ]

    const files = this.getSourceFiles(['ts', 'js', 'scss', 'css'])
    
    for (const test of focusTests) {
      let found = false
      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf-8')
          if (test.pattern.test(content)) {
            found = true
            break
          }
        } catch (error) {
          continue
        }
      }
      this.addResult('焦点管理', test.name, found, found ? '✅ 已实现' : '⚠️ 需要实现')
    }
  }

  /* *
   * 检查文件是否包含指定内容 */
  checkFileContains(filename, content) {
    try {
      const filePath = path.join(__dirname, '..', filename)
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        return fileContent.includes(content)
      }
      return false
    } catch (error) {
      return false
    }
  }

  /* *
   * 检查颜色变量是否存在 */
  checkColorVariablesExist() {
    const scssFiles = this.getSourceFiles(['scss', 'css'])
    for (const file of scssFiles) {
      try {
        const content = fs.readFileSync(file, 'utf-8')
        if (content.includes('--color-') || content.includes('$color-')) {
          return true
        }
      } catch (error) {
        continue
      }
    }
    return false
  }

  /* *
   * 检查高对比模式支持 */
  checkHighContrastSupport() {
    const files = this.getSourceFiles(['scss', 'css', 'ts', 'js'])
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8')
        if (content.includes('prefers-contrast') || content.includes('high-contrast')) {
          return true
        }
      } catch (error) {
        continue
      }
    }
    return false
  }

  /* *
   * 检查暗色主题支持 */
  checkDarkThemeSupport() {
    const files = this.getSourceFiles(['scss', 'css', 'ts', 'js'])
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8')
        if (content.includes('prefers-color-scheme') || content.includes('dark-theme')) {
          return true
        }
      } catch (error) {
        continue
      }
    }
    return false
  }

  /* *
   * 获取源码文件 */
  getSourceFiles(extensions) {
    const files = []
    
    const scanDirectory = (dir) => {
      try {
        const items = fs.readdirSync(dir)
        for (const item of items) {
          const fullPath = path.join(dir, item)
          const stat = fs.statSync(fullPath)
          
          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            scanDirectory(fullPath)
          } else if (stat.isFile()) {
            const ext = path.extname(item).slice(1)
            if (extensions.includes(ext)) {
              files.push(fullPath)
            }
          }
        }
      } catch (error) {
        // 忽略无法访问的目录
      }
    }

    scanDirectory(this.srcDir)
    
    // 同时检查根目录的HTML文件
    try {
      const rootFiles = fs.readdirSync(path.dirname(this.srcDir))
      for (const file of rootFiles) {
        if (file.endsWith('.html')) {
          files.push(path.join(path.dirname(this.srcDir), file))
        }
      }
    } catch (error) {
      // 忽略错误
    }

    return files
  }

  /* *
   * 添加测试结果 */
  addResult(category, name, passed, message) {
    this.testResults.push({
      category,
      name,
      passed,
      message,
    })
  }

  /* *
   * 生成测试报告 */
  generateReport() {
    console.log('\\n📋 无障碍测试报告')
    console.log('=' .repeat(70))

    const categories = [...new Set(this.testResults.map(r => r.category))]
    
    let totalTests = 0
    let passedTests = 0

    for (const category of categories) {
      console.log(`\\n📂 ${category}:`)
      console.log('-'.repeat(50))
      
      const categoryResults = this.testResults.filter(r => r.category === category)
      const categoryPassed = categoryResults.filter(r => r.passed).length
      
      categoryResults.forEach(result => {
        console.log(`  ${result.message} ${result.name}`)
      })
      
      console.log(`  📊 通过率: ${categoryPassed}/${categoryResults.length} (${((categoryPassed / categoryResults.length) * 100).toFixed(1)}%)`)
      
      totalTests += categoryResults.length
      passedTests += categoryPassed
    }

    console.log('\\n' + '='.repeat(70))
    console.log('📊 总体统计:')
    console.log(`  总测试项: ${totalTests}`)
    console.log(`  通过项目: ${passedTests}`)
    console.log(`  失败项目: ${totalTests - passedTests}`)
    console.log(`  总通过率: ${((passedTests / totalTests) * 100).toFixed(1)}%`)

    // 评级
    const passRate = (passedTests / totalTests) * 100
    let grade, recommendation

    if (passRate >= 90) {
      grade = 'A'
      recommendation = '无障碍支持优秀！'
    } else if (passRate >= 75) {
      grade = 'B'
      recommendation = '无障碍支持良好，建议继续完善。'
    } else if (passRate >= 60) {
      grade = 'C'
      recommendation = '无障碍支持一般，需要重点改进。'
    } else {
      grade = 'D'
      recommendation = '无障碍支持不足，急需改进。'
    }

    console.log(`\\n🏆 评级: ${grade} - ${recommendation}`)

    // 改进建议
    const failedResults = this.testResults.filter(r => !r.passed)
    if (failedResults.length > 0) {
      console.log('\\n💡 改进建议:')
      failedResults.forEach(result => {
        console.log(`  - ${result.category}: ${result.name}`)
      })
    }

    // 保存结果
    this.saveResults({ 
      totalTests, 
      passedTests, 
      passRate: passRate.toFixed(1), 
      grade,
      recommendation,
      results: this.testResults,
    })
  }

  /* *
   * 保存测试结果 */
  saveResults(summary) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `a11y-test-results-${timestamp}.json`
    
    const report = {
      timestamp: new Date().toISOString(),
      version: JSON.parse(fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), '../package.json'), 'utf-8')).version,
      summary,
      details: this.testResults,
    }

    try {
      fs.writeFileSync(filename, JSON.stringify(report, null, 2))
      console.log(`\\n💾 测试结果已保存到: ${filename}`)
    } catch (error) {
      console.error('❌ 保存结果失败:', error.message)
    }
  }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new AccessibilityTester()
  tester.run().catch(console.error)
}

export { AccessibilityTester }