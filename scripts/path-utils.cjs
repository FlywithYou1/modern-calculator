#!/usr/bin/env node
/* *
 * 跨平台路径工具
 * 提供统一的路径处理函数，确保在不同操作系统上的兼容性 */

const path = require('path')
const fs = require('fs')

/* *
 * 路径工具类 */
class PathUtils {
  constructor() {
    this.rootDir = this.findProjectRoot()
    this.platform = process.platform
  }

  /* *
   * 查找项目根目录 */
  findProjectRoot() {
  let currentDir = process.cwd()
    
    // 向上查找直到找到包含 package.json 的目录
    while (currentDir !== path.parse(currentDir).root) {
      const packagePath = path.join(currentDir, 'package.json')
      if (fs.existsSync(packagePath)) {
        return currentDir
      }
      currentDir = path.dirname(currentDir)
    }
    
    // 如果没找到，使用当前脚本所在目录的父目录
  return process.cwd()
  }

  /* *
   * 获取项目根目录的绝对路径 */
  getRootDir() {
    return this.rootDir
  }

  /* *
   * 从项目根目录解析路径 */
  resolveFromRoot(...paths) {
    return path.resolve(this.rootDir, ...paths)
  }

  /* *
   * 获取 src 目录的绝对路径 */
  getSrcDir() {
    return this.resolveFromRoot('src')
  }

  /* *
   * 获取 dist 目录的绝对路径 */
  getDistDir() {
    return this.resolveFromRoot('dist')
  }

  /* *
   * 获取 tauri 目录的绝对路径 */
  getTauriDir() {
    return this.resolveFromRoot('src-tauri')
  }

  /* *
   * 获取脚本目录的绝对路径 */
  getScriptsDir() {
    return this.resolveFromRoot('scripts')
  }

  /* *
   * 获取测试目录的绝对路径 */
  getTestsDir() {
    return this.resolveFromRoot('src', 'tests')
  }

  /* *
   * 获取组件目录的绝对路径 */
  getComponentsDir() {
    return this.resolveFromRoot('src', 'components')
  }

  /* *
   * 获取工具目录的绝对路径 */
  getUtilsDir() {
    return this.resolveFromRoot('src', 'utils')
  }

  /* *
   * 获取样式目录的绝对路径 */
  getStylesDir() {
    return this.resolveFromRoot('src', 'styles')
  }

  /* *
   * 获取类型目录的绝对路径 */
  getTypesDir() {
    return this.resolveFromRoot('src', 'types')
  }

  /* *
   * 获取移动端目录的绝对路径 */
  getMobileDir() {
    return this.resolveFromRoot('src', 'mobile')
  }

  /* *
   * 获取文档目录的绝对路径 */
  getDocsDir() {
    return this.resolveFromRoot('docs')
  }

  /* *
   * 获取构建输出目录的绝对路径 */
  getBuildDir() {
    return this.resolveFromRoot('dist')
  }

  /* *
   * 获取临时目录的绝对路径 */
  getTempDir() {
    return this.resolveFromRoot('temp')
  }

  /* *
   * 获取日志目录的绝对路径 */
  getLogsDir() {
    return this.resolveFromRoot('logs')
  }

  /* *
   * 获取配置文件路径 */
  getConfigPath(configName) {
    return this.resolveFromRoot(configName)
  }

  /* *
   * 获取图标目录的绝对路径 */
  getIconsDir() {
    return this.resolveFromRoot('src-tauri', 'icons')
  }

  /* *
   * 获取密钥库目录的绝对路径 */
  getKeystoreDir() {
    return this.resolveFromRoot('src-tauri', 'keystore')
  }

  /* *
   * 获取 Android 构建目录的绝对路径 */
  getAndroidBuildDir() {
    return this.resolveFromRoot('src-tauri', 'gen', 'android')
  }

  /* *
   * 检查路径是否存在 */
  pathExists(filePath) {
    return fs.existsSync(filePath)
  }

  /* *
   * 确保目录存在，不存在则创建 */
  ensureDir(dirPath) {
    if (!this.pathExists(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
    return dirPath
  }

  /* *
   * 获取跨平台路径分隔符 */
  getPathSeparator() {
    return path.sep
  }

  /* *
   * 规范化路径（处理不同操作系统的路径分隔符） */
  normalizePath(filePath) {
    return path.normalize(filePath)
  }

  /* *
   * 转换为相对路径（相对于项目根目录） */
  toRelativePath(filePath) {
    return path.relative(this.rootDir, filePath)
  }

  /* *
   * 获取当前平台信息 */
  getPlatformInfo() {
    return {
      platform: this.platform,
      arch: process.arch,
      nodeVersion: process.version,
      rootDir: this.rootDir,
      separator: this.getPathSeparator(),
    }
  }

  /* *
   * 检查路径是否为绝对路径 */
  isAbsolutePath(filePath) {
    return path.isAbsolute(filePath)
  }

  /* *
   * 获取路径的目录名 */
  getDirname(filePath) {
    return path.dirname(filePath)
  }

  /* *
   * 获取路径的文件名 */
  getBasename(filePath, ext) {
    return path.basename(filePath, ext)
  }

  /* *
   * 获取路径的扩展名 */
  getExtname(filePath) {
    return path.extname(filePath)
  }
}

// 创建全局实例
const pathUtils = new PathUtils()

// 导出工具函数
module.exports = {
  PathUtils,
  pathUtils,
  
  // 便捷函数
  rootDir: pathUtils.getRootDir(),
  srcDir: pathUtils.getSrcDir(),
  distDir: pathUtils.getDistDir(),
  tauriDir: pathUtils.getTauriDir(),
  scriptsDir: pathUtils.getScriptsDir(),
  testsDir: pathUtils.getTestsDir(),
  componentsDir: pathUtils.getComponentsDir(),
  utilsDir: pathUtils.getUtilsDir(),
  stylesDir: pathUtils.getStylesDir(),
  typesDir: pathUtils.getTypesDir(),
  mobileDir: pathUtils.getMobileDir(),
  docsDir: pathUtils.getDocsDir(),
  buildDir: pathUtils.getBuildDir(),
  tempDir: pathUtils.getTempDir(),
  logsDir: pathUtils.getLogsDir(),
  iconsDir: pathUtils.getIconsDir(),
  keystoreDir: pathUtils.getKeystoreDir(),
  androidBuildDir: pathUtils.getAndroidBuildDir(),
  
  // 工具方法
  resolveFromRoot: (...paths) => pathUtils.resolveFromRoot(...paths),
  ensureDir: (dirPath) => pathUtils.ensureDir(dirPath),
  pathExists: (filePath) => pathUtils.pathExists(filePath),
  normalizePath: (filePath) => pathUtils.normalizePath(filePath),
  toRelativePath: (filePath) => pathUtils.toRelativePath(filePath),
  getPlatformInfo: () => pathUtils.getPlatformInfo(),
  isAbsolutePath: (filePath) => pathUtils.isAbsolutePath(filePath),
  getDirname: (filePath) => pathUtils.getDirname(filePath),
  getBasename: (filePath, ext) => pathUtils.getBasename(filePath, ext),
  getExtname: (filePath) => pathUtils.getExtname(filePath),
}

// 如果直接运行此文件，显示平台信息
if (require.main === module) {
  const info = pathUtils.getPlatformInfo()
  console.log('🚀 跨平台路径工具 - 平台信息:')
  console.log(`   平台: ${info.platform}-${info.arch}`)
  console.log(`   Node.js: ${info.nodeVersion}`)
  console.log(`   项目根目录: ${info.rootDir}`)
  console.log(`   路径分隔符: ${info.separator}`)
  console.log('')
  console.log('📁 关键目录:')
  console.log(`   src: ${pathUtils.getSrcDir()}`)
  console.log(`   dist: ${pathUtils.getDistDir()}`)
  console.log(`   tauri: ${pathUtils.getTauriDir()}`)
  console.log(`   scripts: ${pathUtils.getScriptsDir()}`)
  console.log(`   tests: ${pathUtils.getTestsDir()}`)
}