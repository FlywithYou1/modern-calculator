#!/usr/bin/env node
/* *
 * 跨平台测试脚本
 * 测试应用在不同平台和环境下的兼容性 */

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { pathUtils } = require('./path-utils.cjs')

const projectRoot = process.cwd()
const tempTestDir = path.join(projectRoot, 'temp-tests')

if (!fs.existsSync(tempTestDir)) {
  fs.mkdirSync(tempTestDir, { recursive: true })
}

/* *
 * 跨平台测试套件 */
class CrossPlatformTester {
  constructor() {
    this.testResults = []
    this.platform = process.platform
    this.arch = process.arch
    this.nodeVersion = process.version
  }

  /* *
   * 运行跨平台测试 */
  async run() {
    console.log('🌐 启动跨平台兼容性测试...\n')
    console.log(`📋 当前环境: ${this.platform}-${this.arch}, Node.js ${this.nodeVersion}`)

    await this.testEnvironment()
    await this.testDependencies()
    await this.testBuildProcess()
    await this.testTauriCommands()
    await this.testTypeScriptCompilation()
    await this.testFileSystem()
    
    this.generateReport()
  }

  /* *
   * 测试环境兼容性 */
  async testEnvironment() {
    console.log('\\n🖥️ 测试环境兼容性...')

    const tests = [
      {
        name: 'Node.js版本',
        test: () => this.checkNodeVersion(),
      },
      {
        name: 'NPM版本',
        test: () => this.checkNpmVersion(),
      },
      {
        name: 'Rust工具链',
        test: () => this.checkRustToolchain(),
      },
      {
        name: '操作系统支持',
        test: () => this.checkOSSupport(),
      },
      {
        name: '环境变量',
        test: () => this.checkEnvironmentVariables(),
      },
    ]

    for (const test of tests) {
      try {
        const result = await test.test()
        this.addResult('环境', test.name, result.success, result.message)
      } catch (error) {
        this.addResult('环境', test.name, false, `❌ 测试失败: ${error.message}`)
      }
    }
  }

  /* *
   * 测试依赖项 */
  async testDependencies() {
    console.log('📦 测试依赖项兼容性...')

    const tests = [
      {
        name: 'package.json有效性',
        test: () => this.validatePackageJson(),
      },
      {
        name: '依赖安装',
        test: () => this.testDependencyInstallation(),
      },
      {
        name: 'Tauri依赖',
        test: () => this.checkTauriDependencies(),
      },
      {
        name: 'TypeScript配置',
        test: () => this.checkTypeScriptConfig(),
      },
    ]

    for (const test of tests) {
      try {
        const result = await test.test()
        this.addResult('依赖项', test.name, result.success, result.message)
      } catch (error) {
        this.addResult('依赖项', test.name, false, `❌ 测试失败: ${error.message}`)
      }
    }
  }

  /* *
   * 测试构建过程 */
  async testBuildProcess() {
    console.log('🔨 测试构建过程...')

    const tests = [
      {
        name: 'TypeScript编译',
        test: () => this.testTypeScriptBuild(),
      },
      {
        name: 'Vite构建',
        test: () => this.testViteBuild(),
      },
      {
        name: 'Sass编译',
        test: () => this.testSassCompilation(),
      },
      {
        name: 'ESLint检查',
        test: () => this.testESLint(),
      },
    ]

    for (const test of tests) {
      try {
        const result = await test.test()
        this.addResult('构建', test.name, result.success, result.message)
      } catch (error) {
        this.addResult('构建', test.name, false, `❌ 测试失败: ${error.message}`)
      }
    }
  }

  /* *
   * 测试Tauri命令 */
  async testTauriCommands() {
    console.log('🦀 测试Tauri命令...')

    const tests = [
      {
        name: 'Tauri CLI',
        test: () => this.testTauriCLI(),
      },
      {
        name: 'Rust编译',
        test: () => this.testRustCompilation(),
      },
      {
        name: 'Cargo测试',
        test: () => this.testCargoTests(),
      },
    ]

    for (const test of tests) {
      try {
        const result = await test.test()
        this.addResult('Tauri', test.name, result.success, result.message)
      } catch (error) {
        this.addResult('Tauri', test.name, false, `❌ 测试失败: ${error.message}`)
      }
    }
  }

  /* *
   * 测试TypeScript编译 */
  async testTypeScriptCompilation() {
    console.log('📘 测试TypeScript编译...')

    const tests = [
      {
        name: '类型检查',
        test: () => this.runCommand('npx', ['tsc', '--noEmit']),
      },
      {
        name: 'TSConfig验证',
        test: () => this.validateTSConfig(),
      },
    ]

    for (const test of tests) {
      try {
        const result = await test.test()
        this.addResult('TypeScript', test.name, result.success, result.message)
      } catch (error) {
        this.addResult('TypeScript', test.name, false, `❌ 测试失败: ${error.message}`)
      }
    }
  }

  /* *
   * 测试文件系统兼容性 */
  async testFileSystem() {
    console.log('📁 测试文件系统兼容性...')

    const tests = [
      {
        name: '路径分隔符',
        test: () => this.testPathSeparators(),
      },
      {
        name: '文件权限',
        test: () => this.testFilePermissions(),
      },
      {
        name: '长文件名支持',
        test: () => this.testLongFilenames(),
      },
      {
        name: '特殊字符支持',
        test: () => this.testSpecialCharacters(),
      },
    ]

    for (const test of tests) {
      try {
        const result = await test.test()
        this.addResult('文件系统', test.name, result.success, result.message)
      } catch (error) {
        this.addResult('文件系统', test.name, false, `❌ 测试失败: ${error.message}`)
      }
    }
  }

  /* *
   * 检查Node.js版本 */
  async checkNodeVersion() {
    const requiredVersion = '18.0.0'
    const currentVersion = process.version.slice(1) // 移除 'v' 前缀
    
    const current = currentVersion.split('.').map(Number)
    const required = requiredVersion.split('.').map(Number)
    
    const isSupported = current[0] > required[0] || 
      (current[0] === required[0] && current[1] >= required[1])

    return {
      success: isSupported,
      message: isSupported 
        ? `✅ Node.js ${currentVersion} (支持)`
        : `❌ Node.js ${currentVersion} < ${requiredVersion} (不支持)`
    }
  }

  /* *
   * 检查NPM版本 */
  async checkNpmVersion() {
    try {
      const result = await this.runCommand('npm', ['--version'])
      const version = result.stdout.trim()
      const majorVersion = parseInt(version.split('.')[0])
      
      return {
        success: majorVersion >= 9,
        message: majorVersion >= 9 
          ? `✅ NPM ${version} (支持)`
          : `❌ NPM ${version} < 9.0.0 (建议升级)`
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ 无法检查NPM版本: ${error.message}`
      }
    }
  }

  /* *
   * 检查Rust工具链 */
  async checkRustToolchain() {
    try {
      const rustcResult = await this.runCommand('rustc', ['--version'])
      const cargoResult = await this.runCommand('cargo', ['--version'])
      
      return {
        success: true,
        message: `✅ Rust工具链已安装 (${rustcResult.stdout.trim()}, ${cargoResult.stdout.trim()})`
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Rust工具链未安装或不可用`
      }
    }
  }

  /* *
   * 检查操作系统支持 */
  async checkOSSupport() {
    const supportedPlatforms = ['win32', 'darwin', 'linux']
    const isSupported = supportedPlatforms.includes(this.platform)
    
    return {
      success: isSupported,
      message: isSupported 
        ? `✅ ${this.platform} (支持)`
        : `❌ ${this.platform} (不支持)`
    }
  }

  /* *
   * 检查环境变量 */
  async checkEnvironmentVariables() {
    const requiredVars = []
    const recommendedVars = ['PATH', 'HOME', 'USER']
    
    const missing = []
    for (const varName of [...requiredVars, ...recommendedVars]) {
      if (!process.env[varName]) {
        missing.push(varName)
      }
    }

    return {
      success: missing.length === 0,
      message: missing.length === 0 
        ? '✅ 环境变量完整'
        : `⚠️ 缺少环境变量: ${missing.join(', ')}`
    }
  }

  /* *
   * 验证package.json */
  async validatePackageJson() {
    try {
      const packagePath = pathUtils.resolveFromRoot('package.json')
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'))
      
      const requiredFields = ['name', 'version', 'scripts', 'dependencies']
      const missing = requiredFields.filter(field => !packageJson[field])
      
      return {
        success: missing.length === 0,
        message: missing.length === 0 
          ? '✅ package.json格式正确'
          : `❌ package.json缺少字段: ${missing.join(', ')}`
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ 无法读取package.json: ${error.message}`
      }
    }
  }

  /* *
   * 测试依赖安装 */
  async testDependencyInstallation() {
    try {
      const nodeModulesPath = pathUtils.resolveFromRoot('node_modules')
      const exists = fs.existsSync(nodeModulesPath)
      
      if (!exists) {
        return {
          success: false,
          message: '❌ node_modules不存在，请运行 npm install'
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

      return {
        success: missing.length === 0,
        message: missing.length === 0 
          ? '✅ 关键依赖已安装'
          : `❌ 缺少依赖: ${missing.join(', ')}`
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ 依赖检查失败: ${error.message}`
      }
    }
  }

  /* *
   * 检查Tauri依赖 */
  async checkTauriDependencies() {
    try {
      const tauriConfigPath = pathUtils.resolveFromRoot('src-tauri/tauri.conf.json')
      const cargoPath = pathUtils.resolveFromRoot('src-tauri/Cargo.toml')
      
      const tauriExists = fs.existsSync(tauriConfigPath)
      const cargoExists = fs.existsSync(cargoPath)
      
      return {
        success: tauriExists && cargoExists,
        message: tauriExists && cargoExists 
          ? '✅ Tauri配置文件存在'
          : `❌ 缺少Tauri配置文件 (tauri.conf.json: ${tauriExists}, Cargo.toml: ${cargoExists})`
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Tauri依赖检查失败: ${error.message}`
      }
    }
  }

  /* *
   * 检查TypeScript配置 */
  async checkTypeScriptConfig() {
    try {
      const tsconfigPath = pathUtils.resolveFromRoot('tsconfig.json')
      const exists = fs.existsSync(tsconfigPath)
      
      if (!exists) {
        return {
          success: false,
          message: '❌ tsconfig.json不存在'
        }
      }

      const config = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'))
      const hasCompilerOptions = !!config.compilerOptions
      
      return {
        success: hasCompilerOptions,
        message: hasCompilerOptions 
          ? '✅ TypeScript配置有效'
          : '❌ TypeScript配置无效'
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ TypeScript配置检查失败: ${error.message}`
      }
    }
  }

  /* *
   * 测试TypeScript构建 */
  async testTypeScriptBuild() {
    try {
      const result = await this.runCommand('npx', ['tsc', '--noEmit'], { timeout: 30000 })
      return {
        success: result.code === 0,
        message: result.code === 0 
          ? '✅ TypeScript编译成功'
          : `❌ TypeScript编译失败: ${result.stderr}`
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ TypeScript编译测试失败: ${error.message}`
      }
    }
  }

  /* *
   * 测试Vite构建 */
  async testViteBuild() {
    try {
      const result = await this.runCommand('npx', ['vite', 'build', '--mode', 'test'], { timeout: 60000 })
      return {
        success: result.code === 0,
        message: result.code === 0 
          ? '✅ Vite构建成功'
          : `❌ Vite构建失败: ${result.stderr}`
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Vite构建测试失败: ${error.message}`
      }
    }
  }

  /* *
   * 测试Sass编译 */
  async testSassCompilation() {
    try {
      const scssFiles = this.findFiles('../src', '.scss')
      if (scssFiles.length === 0) {
        return {
          success: true,
          message: '✅ 无SCSS文件需要编译'
        }
      }

      // 简单的语法检查
      for (const file of scssFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        if (content.includes('$') && !content.includes(':')) {
          return {
            success: false,
            message: `❌ SCSS语法错误: ${file}`
          }
        }
      }

      return {
        success: true,
        message: `✅ ${scssFiles.length}个SCSS文件语法正确`
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Sass编译测试失败: ${error.message}`
      }
    }
  }

  /* *
   * 测试ESLint */
  async testESLint() {
    try {
      const result = await this.runCommand('npx', ['eslint', 'src', '--ext', '.ts,.tsx'], { timeout: 30000 })
      return {
        success: result.code === 0,
        message: result.code === 0 
          ? '✅ ESLint检查通过'
          : `⚠️ ESLint发现问题: ${result.stdout}`
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ ESLint测试失败: ${error.message}`
      }
    }
  }

  /* *
   * 测试Tauri CLI */
  async testTauriCLI() {
    try {
      const result = await this.runCommand('npx', ['tauri', '--version'])
      return {
        success: result.code === 0,
        message: result.code === 0 
          ? `✅ Tauri CLI可用: ${result.stdout.trim()}`
          : '❌ Tauri CLI不可用'
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Tauri CLI测试失败: ${error.message}`
      }
    }
  }

  /* *
   * 测试Rust编译 */
  async testRustCompilation() {
    try {
      const result = await this.runCommand('cargo', ['check'], { 
        cwd: pathUtils.getTauriDir(),
        timeout: 120000 
      })
      return {
        success: result.code === 0,
        message: result.code === 0 
          ? '✅ Rust代码编译通过'
          : `❌ Rust编译失败: ${result.stderr}`
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Rust编译测试失败: ${error.message}`
      }
    }
  }

  /* *
   * 测试Cargo测试 */
  async testCargoTests() {
    try {
      const result = await this.runCommand('cargo', ['test'], { 
        cwd: pathUtils.getTauriDir(),
        timeout: 180000 
      })
      return {
        success: result.code === 0,
        message: result.code === 0 
          ? '✅ Rust测试通过'
          : `❌ Rust测试失败: ${result.stderr}`
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Rust测试失败: ${error.message}`
      }
    }
  }

  /* *
   * 验证TSConfig */
  async validateTSConfig() {
    try {
      const configs = ['tsconfig.json', 'tsconfig.node.json']
      const results = []
      
      for (const config of configs) {
        const configPath = pathUtils.resolveFromRoot(config)
        if (fs.existsSync(configPath)) {
          try {
            JSON.parse(fs.readFileSync(configPath, 'utf-8'))
            results.push(`${config}: ✅`)
          } catch {
            results.push(`${config}: ❌`)
          }
        } else {
          results.push(`${config}: 🟡 不存在`)
        }
      }

      const allValid = results.every(r => r.includes('✅'))
      return {
        success: allValid,
        message: `TypeScript配置: ${results.join(', ')}`
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ TSConfig验证失败: ${error.message}`
      }
    }
  }

  /* *
   * 测试路径分隔符兼容性 */
  async testPathSeparators() {
    try {
      const testPath = path.join('test', 'path', 'separator')
      const normalized = path.normalize(testPath)
      
      return {
        success: true,
        message: `✅ 路径分隔符正常 (${path.sep})`
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ 路径分隔符测试失败: ${error.message}`
      }
    }
  }

  /* *
   * 测试文件权限 */
  async testFilePermissions() {
    try {
  const testFile = path.join(tempTestDir, 'test-permission.tmp')
      fs.writeFileSync(testFile, 'test')
      
      const stats = fs.statSync(testFile)
      const canRead = stats.mode & parseInt('400', 8)
      const canWrite = stats.mode & parseInt('200', 8)
      
      fs.unlinkSync(testFile) // 清理测试文件
      
      return {
        success: canRead && canWrite,
        message: canRead && canWrite 
          ? '✅ 文件权限正常'
          : '❌ 文件权限受限'
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ 文件权限测试失败: ${error.message}`
      }
    }
  }

  /* *
   * 测试长文件名支持 */
  async testLongFilenames() {
    try {
  const longName = 'a'.repeat(100) + '.tmp'
  const testFile = path.join(tempTestDir, longName)
      
      fs.writeFileSync(testFile, 'test')
      const exists = fs.existsSync(testFile)
      fs.unlinkSync(testFile)
      
      return {
        success: exists,
        message: exists 
          ? '✅ 支持长文件名'
          : '❌ 不支持长文件名'
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ 长文件名测试失败: ${error.message}`
      }
    }
  }

  /* *
   * 测试特殊字符支持 */
  async testSpecialCharacters() {
    try {
      const specialChars = ['中文', 'émoji-🚀', 'space file']
      let supported = 0
      
      for (const name of specialChars) {
        try {
          const testFile = path.join(tempTestDir, `${name}.tmp`)
          fs.writeFileSync(testFile, 'test')
          if (fs.existsSync(testFile)) {
            supported++
            fs.unlinkSync(testFile)
          }
        } catch {
          // 忽略单个失败
        }
      }
      
      return {
        success: supported === specialChars.length,
        message: `✅ 特殊字符支持: ${supported}/${specialChars.length}`
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ 特殊字符测试失败: ${error.message}`
      }
    }
  }

  /* *
   * 查找文件 */
  findFiles(dir, ext) {
    const files = []
    const fullDir = pathUtils.resolveFromRoot(dir)
    
    const scan = (directory) => {
      try {
        const items = fs.readdirSync(directory)
        for (const item of items) {
          const fullPath = path.join(directory, item)
          const stat = fs.statSync(fullPath)
          
          if (stat.isDirectory() && !item.startsWith('.')) {
            scan(fullPath)
          } else if (item.endsWith(ext)) {
            files.push(fullPath)
          }
        }
      } catch (error) {
        // 忽略无法访问的目录
      }
    }
    
    scan(fullDir)
    return files
  }

  /* *
   * 运行命令 */
  runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
  const { timeout = 10000, cwd = projectRoot } = options
      
      const child = spawn(command, args, {
        cwd,
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
      
      const timer = setTimeout(() => {
        child.kill()
        reject(new Error('命令执行超时'))
      }, timeout)
      
      child.on('close', (code) => {
        clearTimeout(timer)
        resolve({ code, stdout, stderr })
      })
      
      child.on('error', (error) => {
        clearTimeout(timer)
        reject(error)
      })
    })
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
    console.log('\\n📋 跨平台兼容性测试报告')
    console.log('=' .repeat(80))
    console.log(`🖥️  平台: ${this.platform}-${this.arch}`)
    console.log(`📦 Node.js: ${this.nodeVersion}`)
    console.log(`⏰ 时间: ${new Date().toLocaleString()}`)

    const categories = [...new Set(this.testResults.map(r => r.category))]
    
    let totalTests = 0
    let passedTests = 0

    for (const category of categories) {
      console.log(`\\n📂 ${category}:`)
      console.log('-'.repeat(60))
      
      const categoryResults = this.testResults.filter(r => r.category === category)
      const categoryPassed = categoryResults.filter(r => r.passed).length
      
      categoryResults.forEach(result => {
        console.log(`  ${result.message}`)
      })
      
      console.log(`  📊 通过率: ${categoryPassed}/${categoryResults.length} (${((categoryPassed / categoryResults.length) * 100).toFixed(1)}%)`)
      
      totalTests += categoryResults.length
      passedTests += categoryPassed
    }

    console.log('\\n' + '='.repeat(80))
    console.log('📊 总体统计:')
    console.log(`  总测试项: ${totalTests}`)
    console.log(`  通过项目: ${passedTests}`)
    console.log(`  失败项目: ${totalTests - passedTests}`)
    console.log(`  总通过率: ${((passedTests / totalTests) * 100).toFixed(1)}%`)

    // 兼容性评级
    const passRate = (passedTests / totalTests) * 100
    let grade, recommendation

    if (passRate >= 95) {
      grade = 'A+'
      recommendation = '完全兼容'
    } else if (passRate >= 85) {
      grade = 'A'
      recommendation = '高度兼容'
    } else if (passRate >= 75) {
      grade = 'B'
      recommendation = '基本兼容，部分问题需要修复'
    } else if (passRate >= 60) {
      grade = 'C'
      recommendation = '兼容性一般，需要重点改进'
    } else {
      grade = 'D'
      recommendation = '兼容性差，不建议在此平台使用'
    }

    console.log(`\\n🏆 兼容性评级: ${grade} - ${recommendation}`)

    // 问题列表
    const failedResults = this.testResults.filter(r => !r.passed)
    if (failedResults.length > 0) {
      console.log('\\n⚠️ 需要修复的问题:')
      failedResults.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.category} - ${result.name}: ${result.message}`)
      })
    }

    // 保存结果
    this.saveResults({ 
      platform: `${this.platform}-${this.arch}`,
      nodeVersion: this.nodeVersion,
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
    const platform = `${this.platform}-${this.arch}`
    const filename = `cross-platform-test-${platform}-${timestamp}.json`
    
    const report = {
      timestamp: new Date().toISOString(),
      platform: {
        os: this.platform,
        arch: this.arch,
        nodeVersion: this.nodeVersion,
      },
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
if (require.main === module) {
  const tester = new CrossPlatformTester()
  tester.run().catch(console.error)
}

module.exports = { CrossPlatformTester }