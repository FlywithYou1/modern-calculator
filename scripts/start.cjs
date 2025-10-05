#!/usr/bin/env node
/* *
 * 跨平台启动脚本
 * 提供统一的启动接口，确保在不同操作系统上的兼容性 */

const { spawn } = require('child_process')
const { pathUtils } = require('./path-utils.cjs')

/* *
 * 启动管理器 */
class StartupManager {
  constructor() {
    this.platform = process.platform
    this.isWindows = this.platform === 'win32'
    this.isMac = this.platform === 'darwin'
    this.isLinux = this.platform === 'linux'
  }

  /* *
   * 启动开发服务器 */
  async startDevServer() {
    console.log('🚀 启动开发服务器...')
    console.log(`📋 平台: ${this.platform}`)
    console.log(`📁 项目根目录: ${pathUtils.getRootDir()}`)

    try {
      // 检查依赖
      await this.checkDependencies()

      // 启动Vite开发服务器
      await this.runCommand('npm', ['run', 'dev'], {
        cwd: pathUtils.getRootDir(),
        stdio: 'inherit'
      })
    } catch (error) {
      console.error('❌ 启动开发服务器失败:', error.message)
      process.exit(1)
    }
  }

  /* *
   * 启动Tauri开发环境 */
  async startTauriDev() {
    console.log('🦀 启动Tauri开发环境...')

    try {
      // 检查Rust工具链
      await this.checkRustToolchain()

      // 启动Tauri开发
      await this.runCommand('npm', ['run', 'tauri:dev'], {
        cwd: pathUtils.getRootDir(),
        stdio: 'inherit'
      })
    } catch (error) {
      console.error('❌ 启动Tauri开发环境失败:', error.message)
      process.exit(1)
    }
  }

  /* *
   * 启动Android开发环境 */
  async startAndroidDev() {
    console.log('🤖 启动Android开发环境...')

    try {
      // 检查Android环境
      await this.checkAndroidEnvironment()

      // 启动Android开发
      await this.runCommand('npm', ['run', 'android:dev'], {
        cwd: pathUtils.getRootDir(),
        stdio: 'inherit'
      })
    } catch (error) {
      console.error('❌ 启动Android开发环境失败:', error.message)
      process.exit(1)
    }
  }

  /* *
   * 运行测试 */
  async runTests() {
    console.log('🧪 运行测试...')

    try {
      await this.runCommand('npm', ['run', 'test:run'], {
        cwd: pathUtils.getRootDir(),
        stdio: 'inherit'
      })
    } catch (error) {
      console.error('❌ 运行测试失败:', error.message)
      process.exit(1)
    }
  }

  /* *
   * 构建项目 */
  async buildProject() {
    console.log('🔨 构建项目...')

    try {
      await this.runCommand('npm', ['run', 'build'], {
        cwd: pathUtils.getRootDir(),
        stdio: 'inherit'
      })
    } catch (error) {
      console.error('❌ 构建项目失败:', error.message)
      process.exit(1)
    }
  }

  /* *
   * 检查依赖 */
  async checkDependencies() {
    console.log('📦 检查依赖...')

    const checks = [
      {
        name: 'Node.js',
        command: 'node',
        args: ['--version'],
        minVersion: '18.0.0'
      },
      {
        name: 'npm',
        command: 'npm',
        args: ['--version'],
        minVersion: '9.0.0'
      }
    ]

    for (const check of checks) {
      try {
        const result = await this.runCommand(check.command, check.args)
        const version = result.stdout.trim()
        console.log(`   ✅ ${check.name}: ${version}`)
      } catch (error) {
        console.error(`   ❌ ${check.name}: 未安装或不可用`)
        throw new Error(`依赖检查失败: ${check.name} 不可用`)
      }
    }
  }

  /* *
   * 检查Rust工具链 */
  async checkRustToolchain() {
    console.log('🦀 检查Rust工具链...')

    const checks = [
      {
        name: 'Rust编译器',
        command: 'rustc',
        args: ['--version']
      },
      {
        name: 'Cargo包管理器',
        command: 'cargo',
        args: ['--version']
      }
    ]

    for (const check of checks) {
      try {
        const result = await this.runCommand(check.command, check.args)
        const version = result.stdout.trim()
        console.log(`   ✅ ${check.name}: ${version}`)
      } catch (error) {
        console.error(`   ❌ ${check.name}: 未安装或不可用`)
        throw new Error(`Rust工具链检查失败: ${check.name} 不可用`)
      }
    }
  }

  /* *
   * 检查Android环境 */
  async checkAndroidEnvironment() {
    console.log('🤖 检查Android环境...')

    const checks = [
      {
        name: 'Java',
        command: 'java',
        args: ['-version']
      },
      {
        name: 'Android SDK',
        command: 'adb',
        args: ['version']
      }
    ]

    for (const check of checks) {
      try {
        const result = await this.runCommand(check.command, check.args)
        console.log(`   ✅ ${check.name}: 已安装`)
      } catch (error) {
        console.error(`   ❌ ${check.name}: 未安装或不可用`)
        throw new Error(`Android环境检查失败: ${check.name} 不可用`)
      }
    }
  }

  /* *
   * 运行命令 */
  runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const { cwd = pathUtils.getRootDir(), stdio = 'pipe', timeout = 30000 } = options

      const child = spawn(command, args, {
        cwd,
        stdio,
        shell: this.isWindows,
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
   * 显示帮助信息 */
  showHelp() {
    console.log('')
    console.log('🚀 跨平台启动脚本 - 使用说明')
    console.log('==============================')
    console.log('')
    console.log('命令:')
    console.log('  dev         启动开发服务器')
    console.log('  tauri       启动Tauri开发环境')
    console.log('  android     启动Android开发环境')
    console.log('  test        运行测试')
    console.log('  build       构建项目')
    console.log('  help        显示此帮助信息')
    console.log('')
    console.log('示例:')
    console.log('  node scripts/start.js dev')
    console.log('  node scripts/start.js tauri')
    console.log('  node scripts/start.js test')
    console.log('')
    console.log('平台信息:')
    const info = pathUtils.getPlatformInfo()
    console.log(`  操作系统: ${info.platform}-${info.arch}`)
    console.log(`  Node.js: ${info.nodeVersion}`)
    console.log(`  项目根目录: ${info.rootDir}`)
    console.log('')
  }
}

// 主函数
async function main() {
  const manager = new StartupManager()
  const command = process.argv[2]

  switch (command) {
    case 'dev':
      await manager.startDevServer()
      break
    case 'tauri':
      await manager.startTauriDev()
      break
    case 'android':
      await manager.startAndroidDev()
      break
    case 'test':
      await manager.runTests()
      break
    case 'build':
      await manager.buildProject()
      break
    case 'help':
    default:
      manager.showHelp()
      break
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(error => {
    console.error('💥 启动失败:', error.message)
    process.exit(1)
  })
}

module.exports = { StartupManager }