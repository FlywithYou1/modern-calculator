#!/usr/bin/env node
/* *
 * 导入路径更新脚本
 * 将相对路径导入更新为使用路径别名，提高跨平台兼容性 */

const fs = require('fs')
const path = require('path')
const { pathUtils } = require('./path-utils.cjs')

/* *
 * 路径映射配置 */
const pathMappings = {
  '../types/calculator': '@/types/calculator',
  '../utils/theme': '@/utils/theme',
  '../utils/device': '@/utils/device',
  '../utils/tauri': '@/utils/tauri',
  '../utils/mcp-debugger': '@/utils/mcp-debugger',
  '../mobile/gesture': '@/mobile/gesture',
  '../utils/evaluator': '@/utils/evaluator',
  '../utils/settings-defaults': '@/utils/settings-defaults',
  '../components/Calculator': '@/components/Calculator',
  '../components/History': '@/components/History',
  '../components/Settings': '@/components/Settings',
  '../components': '@/components',
  '../utils': '@/utils',
  '../types': '@/types',
  '../mobile': '@/mobile',
}

/* *
 * 导入更新器 */
class ImportUpdater {
  constructor() {
    this.srcDir = pathUtils.getSrcDir()
    this.updatedFiles = []
  }

  /* *
   * 运行导入更新 */
  async run() {
    console.log('🔄 更新导入路径...')
    console.log(`📁 源码目录: ${this.srcDir}`)
    console.log('')

    // 获取所有TypeScript文件
    const files = this.getTypeScriptFiles()
    console.log(`📄 找到 ${files.length} 个TypeScript文件`)

    // 更新每个文件
    for (const file of files) {
      await this.updateFileImports(file)
    }

    // 生成报告
    this.generateReport()
  }

  /* *
   * 获取所有TypeScript文件 */
  getTypeScriptFiles() {
    const files = []

    const scanDirectory = (dir) => {
      try {
        const items = fs.readdirSync(dir)
        for (const item of items) {
          const fullPath = path.join(dir, item)
          const stat = fs.statSync(fullPath)

          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            scanDirectory(fullPath)
          } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
            files.push(fullPath)
          }
        }
      } catch (error) {
        console.warn(`无法扫描目录 ${dir}: ${error.message}`)
      }
    }

    scanDirectory(this.srcDir)
    return files
  }

  /* *
   * 更新文件中的导入 */
  async updateFileImports(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      let updatedContent = content
      let updated = false

      // 更新导入语句 - 使用带引号的替换
      for (const [oldPath, newPath] of Object.entries(pathMappings)) {
        // 处理带 .js 扩展名的导入
        const oldPathWithExt = oldPath + '.js'
        if (updatedContent.includes(oldPathWithExt)) {
          updatedContent = updatedContent.replace(new RegExp(`['\"]${oldPathWithExt}['\"]`, 'g'), `'${newPath}'`)
          updated = true
        }

        // 处理不带扩展名的导入
        if (updatedContent.includes(oldPath)) {
          updatedContent = updatedContent.replace(new RegExp(`['\"]${oldPath}['\"]`, 'g'), `'${newPath}'`)
          updated = true
        }
      }

      if (updated) {
        // 备份原文件
        const backupPath = filePath + '.bak'
        fs.writeFileSync(backupPath, content)

        // 写入更新后的内容
        fs.writeFileSync(filePath, updatedContent)

        this.updatedFiles.push({
          file: path.relative(this.srcDir, filePath),
          backup: path.relative(this.srcDir, backupPath)
        })

        console.log(`   ✅ 更新: ${path.relative(this.srcDir, filePath)}`)
      }
    } catch (error) {
      console.error(`   ❌ 更新失败: ${path.relative(this.srcDir, filePath)} - ${error.message}`)
    }
  }

  /* *
   * 生成更新报告 */
  generateReport() {
    console.log('')
    console.log('📋 导入路径更新报告')
    console.log('=' .repeat(60))

    if (this.updatedFiles.length === 0) {
      console.log('  没有需要更新的导入路径。')
      return
    }

    console.log(`  更新了 ${this.updatedFiles.length} 个文件:`)
    this.updatedFiles.forEach(item => {
      console.log(`    - ${item.file}`)
      console.log(`      备份: ${item.backup}`)
    })

    console.log('')
    console.log('💡 说明:')
    console.log('  1. 原文件已备份为 .bak 文件')
    console.log('  2. 所有相对路径导入已更新为路径别名')
    console.log('  3. 这提高了跨平台兼容性')
    console.log('')
    console.log('🔧 路径映射:')
    for (const [oldPath, newPath] of Object.entries(pathMappings)) {
      console.log(`    ${oldPath} → ${newPath}`)
    }

    console.log('')
    console.log('⚠️ 注意事项:')
    console.log('  - 请验证更新后的代码是否能正常编译')
    console.log('  - 如果发现问题，可以使用备份文件恢复')
    console.log('  - 建议运行测试确保功能正常')
  }

  /* *
   * 恢复备份文件 */
  async restoreBackups() {
    console.log('🔄 恢复备份文件...')

    for (const item of this.updatedFiles) {
      try {
        const filePath = path.join(this.srcDir, item.file)
        const backupPath = path.join(this.srcDir, item.backup)

        if (fs.existsSync(backupPath)) {
          const backupContent = fs.readFileSync(backupPath, 'utf-8')
          fs.writeFileSync(filePath, backupContent)
          fs.unlinkSync(backupPath)
          console.log(`   ✅ 恢复: ${item.file}`)
        }
      } catch (error) {
        console.error(`   ❌ 恢复失败: ${item.file} - ${error.message}`)
      }
    }

    console.log('')
    console.log('✅ 所有备份文件已恢复')
  }
}

// 主函数
async function main() {
  const updater = new ImportUpdater()
  const command = process.argv[2]

  switch (command) {
    case 'restore':
      await updater.restoreBackups()
      break
    case 'update':
    default:
      await updater.run()
      break
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(error => {
    console.error('💥 导入更新失败:', error.message)
    process.exit(1)
  })
}

module.exports = { ImportUpdater }