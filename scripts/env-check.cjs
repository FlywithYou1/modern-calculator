#!/usr/bin/env node
/* *
 * 环境检查脚本
 * 检查开发环境是否满足项目要求 */

const { pathUtils } = require('./path-utils.cjs')

/* *
 * 环境检查器 */
class EnvironmentChecker {
  constructor() {
    this.platform = process.platform
    this.checks = []
    this.results = []
  }

  /* *
   * 运行环境检查 */
  async run() {
    console.log('🔍 检查开发环境...')
    console.log(`📋 平台: ${this.platform}`)
    console.log(`📁 项目根目录: ${pathUtils.getRootDir()}`)
    console.log('')

    // 定义检查项
    this.defineChecks()

    // 运行检查
    for (const check of this.checks) {
      await this.runCheck(check)
    }

    // 生成报告
    this.generateReport()
  }

  /* *
   * 定义检查项 */
  defineChecks() {
    this.checks = [
      {
        name: 'Node.js版本',
        description: '检查Node.js版本是否满足要求',
        command: 'node',
        args: ['--version'],
        minVersion: '18.0.0',
        category: 'runtime'
      },
      {
        name: 'npm版本',
        description: '检查npm版本是否满足要求',
        command: 'npm',
        args: ['--version'],
        minVersion: '9.0.0',
        category: 'runtime'
      },
      {
        name: 'Rust编译器',
        description: '检查Rust编译器是否安装',
        command: 'rustc',
        args: ['--version'],
        category: 'rust'
      },
      {
        name: 'Cargo包管理器',
        description: '检查Cargo是否安装',
        command: 'cargo',
        args: ['--version'],
        category: 'rust'
      },
      {
        name: 'Tauri CLI',
        description: '检查Tauri CLI是否安装',
        command: 'npx',
        args: ['tauri', '--version'],
        category: 'tauri'
      },
      {
        name: 'TypeScript编译器',
        description: '检查TypeScript是否安装',
        command: 'npx',
        args: ['tsc', '--version'],
        category: 'typescript'
      },
      {
        name: 'Vite构建工具',
        description: '检查Vite是否安装',
        command: 'npx',
        args: ['vite', '--version'],
        category: 'build'
      },
      {
        name: '项目依赖',
        description: '检查项目依赖是否已安装',
        checkFn: () => this.checkProjectDependencies(),
        category: 'project'
      },
      {
        name: '配置文件',
        description: '检查必要的配置文件是否存在',
        checkFn: () => this.checkConfigFiles(),
        category: 'project'
      },
      {
        name: '源码结构',
        description: '检查源码目录结构是否完整',
        checkFn: () => this.checkSourceStructure(),
        category: 'project'
      }
    ]
  }

  /* *
   * 运行单个检查 */
  async runCheck(check) {
    console.log(`  检查: ${check.name}`)

    try {
      let result

      if (check.checkFn) {
        // 使用自定义检查函数
        result = await check.checkFn()
      } else {
        // 使用命令检查
        result = await this.runCommandCheck(check)
      }

      this.results.push({
        ...check,
        ...result,
        passed: result.success
      })

      const status = result.success ? '✅' : '❌'
      console.log(`    ${status} ${result.message}`)
    } catch (error) {
      this.results.push({
        ...check,
        passed: false,
        message: `检查失败: ${error.message}`
      })
      console.log(`    ❌ 检查失败: ${error.message}`)
    }
  }

  /* *
   * 运行命令检查 */
  async runCommandCheck(check) {
    const { spawn } = require('child_process')

    return new Promise((resolve, reject) => {
      const child = spawn(check.command, check.args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
      })

      let stdout = ''
      let stderr = ''

      child.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      child.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      child.on('close', (code) => {
        if (code === 0) {
          const version = stdout.trim()
          let success = true
          let message = version

          // 检查版本要求
          if (check.minVersion) {
            const currentVersion = this.parseVersion(version)
            const minVersion = this.parseVersion(check.minVersion)
            success = this.compareVersions(currentVersion, minVersion) >= 0
            
            if (success) {
              message = `${version} (满足要求 >= ${check.minVersion})`
            } else {
              message = `${version} (不满足要求 >= ${check.minVersion})`
            }
          }

          resolve({ success, message })
        } else {
          resolve({
            success: false,
            message: `命令执行失败: ${stderr || '未知错误'}`
          })
        }
      })

      child.on('error', (error) => {
        resolve({
          success: false,
          message: `命令不可用: ${error.message}`
        })
      })
    })
  }

  /* *
   * 检查项目依赖 */
  async checkProjectDependencies() {
    const fs = require('fs')
    const path = require('path')

    const nodeModulesPath = pathUtils.resolveFromRoot('node_modules')
    const packageJsonPath = pathUtils.resolveFromRoot('package.json')

    if (!fs.existsSync(nodeModulesPath)) {
      return {
        success: false,
        message: 'node_modules不存在，请运行 npm install'
      }
    }

    if (!fs.existsSync(packageJsonPath)) {
      return {
        success: false,
        message: 'package.json不存在'
      }
    }

    // 检查关键依赖
    const criticalDeps = ['@tauri-apps/api', '@tauri-apps/cli', 'typescript', 'vite']
    const missing = []

    for (const dep of criticalDeps) {
      const depPath = path.join(nodeModulesPath, dep)
      if (!fs.existsSync(depPath)) {
        missing.push(dep)
      }
    }

    if (missing.length > 0) {
      return {
        success: false,
        message: `缺少关键依赖: ${missing.join(', ')}`
      }
    }

    return {
      success: true,
      message: '项目依赖完整'
    }
  }

  /* *
   * 检查配置文件 */
  async checkConfigFiles() {
    const fs = require('fs')

    const configFiles = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'src-tauri/Cargo.toml',
      'src-tauri/tauri.conf.json'
    ]

    const missing = []

    for (const config of configFiles) {
      const configPath = pathUtils.resolveFromRoot(config)
      if (!fs.existsSync(configPath)) {
        missing.push(config)
      }
    }

    if (missing.length > 0) {
      return {
        success: false,
        message: `缺少配置文件: ${missing.join(', ')}`
      }
    }

    return {
      success: true,
      message: '配置文件完整'
    }
  }

  /* *
   * 检查源码结构 */
  async checkSourceStructure() {
    const fs = require('fs')

    const requiredDirs = [
      'src',
      'src/components',
      'src/utils',
      'src/styles',
      'src/tests',
      'src/types'
    ]

    const missing = []

    for (const dir of requiredDirs) {
      const dirPath = pathUtils.resolveFromRoot(dir)
      if (!fs.existsSync(dirPath)) {
        missing.push(dir)
      }
    }

    if (missing.length > 0) {
      return {
        success: false,
        message: `缺少目录: ${missing.join(', ')}`
      }
    }

    return {
      success: true,
      message: '源码结构完整'
    }
  }

  /* *
   * 解析版本号 */
  parseVersion(version) {
    // 移除前缀（如 v1.2.3 -> 1.2.3）
    const cleanVersion = version.replace(/^v/, '')
    const parts = cleanVersion.split('.').map(part => {
      // 移除非数字字符
      const num = part.replace(/\D/g, '')
      return num ? parseInt(num, 10) : 0
    })

    // 确保至少有3个部分
    while (parts.length < 3) {
      parts.push(0)
    }

    return parts
  }

  /* *
   * 比较版本号 */
  compareVersions(v1, v2) {
    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const part1 = v1[i] || 0
      const part2 = v2[i] || 0

      if (part1 > part2) return 1
      if (part1 < part2) return -1
    }

    return 0
  }

  /* *
   * 生成检查报告 */
  generateReport() {
    console.log('')
    console.log('📋 环境检查报告')
    console.log('=' .repeat(60))

    const categories = [...new Set(this.results.map(r => r.category))]
    
    let totalChecks = 0
    let passedChecks = 0

    for (const category of categories) {
      console.log(`\n📂 ${this.formatCategory(category)}:`)
      console.log('-'.repeat(40))
      
      const categoryResults = this.results.filter(r => r.category === category)
      const categoryPassed = categoryResults.filter(r => r.passed).length
      
      categoryResults.forEach(result => {
        const status = result.passed ? '✅' : '❌'
        console.log(`  ${status} ${result.name}: ${result.message}`)
      })
      
      console.log(`  📊 通过率: ${categoryPassed}/${categoryResults.length}`)
      
      totalChecks += categoryResults.length
      passedChecks += categoryPassed
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 总体统计:')
    console.log(`  总检查项: ${totalChecks}`)
    console.log(`  通过项目: ${passedChecks}`)
    console.log(`  失败项目: ${totalChecks - passedChecks}`)
    console.log(`  总通过率: ${((passedChecks / totalChecks) * 100).toFixed(1)}%`)

    // 环境评级
    const passRate = (passedChecks / totalChecks) * 100
    let grade, recommendation

    if (passRate >= 90) {
      grade = 'A+'
      recommendation = '环境配置优秀，可以开始开发！'
    } else if (passRate >= 80) {
      grade = 'A'
      recommendation = '环境配置良好，建议修复少量问题。'
    } else if (passRate >= 70) {
      grade = 'B'
      recommendation = '环境配置一般，需要修复一些问题。'
    } else if (passRate >= 60) {
      grade = 'C'
      recommendation = '环境配置较差，需要重点改进。'
    } else {
      grade = 'D'
      recommendation = '环境配置不足，无法正常开发。'
    }

    console.log(`\n🏆 环境评级: ${grade} - ${recommendation}`)

    // 问题列表
    const failedResults = this.results.filter(r => !r.passed)
    if (failedResults.length > 0) {
      console.log('\n⚠️ 需要修复的问题:')
      failedResults.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.name}: ${result.message}`)
      })
    }

    // 下一步建议
    console.log('\n💡 下一步建议:')
    if (failedResults.length === 0) {
      console.log('  所有检查通过！可以开始开发：')
      console.log('    - npm run dev    启动开发服务器')
      console.log('    - npm run test   运行测试')
      console.log('    - npm run build  构建项目')
    } else {
      console.log('  请先修复上述问题，然后重新运行环境检查。')
    }
  }

  /* *
   * 格式化分类名称 */
  formatCategory(category) {
    const categoryMap = {
      runtime: '运行时环境',
      rust: 'Rust工具链',
      tauri: 'Tauri框架',
      typescript: 'TypeScript',
      build: '构建工具',
      project: '项目结构'
    }

    return categoryMap[category] || category
  }
}

// 运行环境检查
if (require.main === module) {
  const checker = new EnvironmentChecker()
  checker.run().catch(error => {
    console.error('❌ 环境检查失败:', error.message)
    process.exit(1)
  })
}

module.exports = { EnvironmentChecker }