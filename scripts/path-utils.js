#!/usr/bin/env node
// 简单的路径工具，帮助脚本从项目根目录解析文件路径
import path from 'path'
import { fileURLToPath } from 'url'

// 通过当前脚本位置推断项目根目录（scripts/* 位于根目录下）
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

export const pathUtils = {
  // 从项目根目录解析相对路径
  resolveFromRoot: (...segments) => path.resolve(projectRoot, ...segments),
}

export default pathUtils
