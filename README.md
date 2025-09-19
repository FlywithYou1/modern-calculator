# 🧮 现代科学计算器 (Modern Scientific Calculator)

基于 **Tauri 2.8** + **TypeScript 5.6** 构建的现代化科学计算器，支持高精度计算、跨平台部署和优雅的用户体验。

[![CI/CD Status](https://img.shields.io/github/actions/workflow/status/FlywithYou1/modern-calculator/ci-cd.yml?branch=main&style=flat-square&logo=github)](https://github.com/FlywithYou1/modern-calculator/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux%20%7C%20Android-lightgrey?style=flat-square)](https://github.com/FlywithYou1/modern-calculator)

## ✨ 主要特性

- **🎯 高精度计算**: 金融级数值精度，避免浮点误差
- **🔬 科学功能**: 三角函数、对数、统计、矩阵、复数运算
- **📱 跨平台**: Windows、macOS、Linux、Android 全平台支持
- **🎨 现代 UI**: 深色/浅色主题，GPU 加速动画，响应式设计
- **⚡ 高性能**: 60fps 流畅体验，智能性能降级
- **🧩 模块化**: TypeScript 严格类型，组件化架构

## 📦 构建产物说明

### 🎯 构建产物位置

#### 前端构建产物 (dist/)
运行 `npm run build` 后，生成的前端资源位于 `dist/` 目录：

```
dist/
├── index.html                     2.72 kB  # 主入口页面
└── assets/
    ├── main-DwZrvMdA.js          90.17 kB  # 主应用代码 (gzip: 21.30 kB)
    ├── main-D79PZLhZ.css         31.69 kB  # 样式文件 (gzip: 6.01 kB)
    ├── evaluator-Bl1E3tPs.js      3.68 kB  # 计算引擎 (gzip: 1.47 kB)
    ├── vendor-B46sw_IK.js         1.67 kB  # 第三方库 (gzip: 0.83 kB)
    └── index-BUDdy0sR.js          1.47 kB  # 入口脚本 (gzip: 0.51 kB)

总大小: ~141 kB → ~31 kB (gzip 压缩率: 78%)
```

#### Android 构建产物
- **项目结构**: `src-tauri/gen/android/` - Android Studio 项目
- **APK 文件**: `src-tauri/gen/android/app/build/outputs/apk/`
- **AAB 文件**: `src-tauri/gen/android/app/build/outputs/bundle/`
- **签名配置**: `src-tauri/keystore/calculator.keystore`

#### 桌面端构建产物 (Tauri)
运行 `npm run tauri:build` 后：
- **Windows**: `src-tauri/target/release/bundle/msi/` (.msi 安装包)
- **macOS**: `src-tauri/target/release/bundle/dmg/` (.dmg 镜像)
- **Linux**: `src-tauri/target/release/bundle/deb/` (.deb 包) 和 `appimage/` (AppImage)

### 🚀 CI/CD 构建产物获取

#### GitHub Actions 自动构建
每次推送到 main 分支或创建 Pull Request 时，会自动触发构建：

1. **前端构建**: 自动运行质量检查和构建
2. **Android 构建**: main 分支自动构建 (PR 时跳过)

#### 下载构建产物
1. 访问 [GitHub Actions](https://github.com/FlywithYou1/modern-calculator/actions)
2. 选择最新的工作流运行
3. 在 "Artifacts" 部分下载：
   - `frontend-build-{run_number}` - 前端构建产物
   - `android-build-{run_number}` - Android 构建产物
4. 产物保留期：7天

#### 构建状态验证
```bash
# 本地验证构建
npm run quality:check  # 运行所有质量检查
npm run build          # 构建前端
npm run tauri:build    # 构建桌面应用 (需要 Rust 环境)
npm run android:build  # 构建 Android (需要 Android SDK)
```


### 🎯 前端构建产物位置

构建完成后，所有前端资源位于 **`dist/`** 目录：

```
dist/
├── index.html                   2.72 kB  # 主页面入口
└── assets/
    ├── main-B7b-1uxb.js        89.30 kB  # 主应用代码 (gzip: 20.96 kB)
    ├── main-D79PZLhZ.css       31.69 kB  # 样式文件 (gzip: 6.01 kB)
    ├── evaluator-Bl1E3tPs.js    3.68 kB  # 计算引擎 (gzip: 1.47 kB)
    ├── vendor-B46sw_IK.js       1.67 kB  # 第三方库 (gzip: 0.83 kB)
    └── index-BUDdy0sR.js        1.47 kB  # 入口脚本 (gzip: 0.51 kB)
```

**💾 优化效果**:
- **总大小**: ~140 kB (原始) → ~31 kB (gzip压缩)
- **压缩率**: 78% 体积减少
- **代码分割**: 计算引擎独立模块，按需加载
- **生产就绪**: 已优化混淆，可直接部署

### 🤖 Android 构建产物

Android 构建产物位于以下目录：
- **APK 文件**: `src-tauri/gen/android/app/build/outputs/apk/`
- **AAB 文件**: `src-tauri/gen/android/app/build/outputs/bundle/`
- **项目源码**: `src-tauri/gen/android/` (完整 Android Studio 项目)

### 🔧 构建命令

```bash
# 前端构建 (生成 dist/ 目录)
npm run build

# Android 构建 (需要 Android SDK + NDK)
npm run android:build

# 桌面端构建 (生成安装包)
npm run tauri:build

# 开发模式
npm run dev              # 仅前端开发
npm run tauri:dev        # 完整 Tauri 开发
```

### 📥 从 CI/CD 获取构建产物

每次推送到 `main` 分支或创建 Pull Request 时，GitHub Actions 会自动构建并提供下载：

1. 访问 [GitHub Actions](https://github.com/FlywithYou1/modern-calculator/actions)
2. 选择最新的工作流运行
3. 在 "Artifacts" 部分下载：
   - **`frontend-build-{run_number}`**: 前端构建产物
   - **`android-build-{run_number}`**: Android 构建产物 (如果成功)

**📅 保留时间**: 7天自动清理

## 🚀 快速开始

### 📋 环境要求

| 工具 | 版本要求 | 用途 |
|------|----------|------|
| **Node.js** | ≥ 18.0.0 | 前端构建和包管理 |
| **npm** | ≥ 9.0.0 | 依赖管理 |
| **Rust** | ≥ 1.89.0 | 后端计算引擎 |
| **系统** | Windows 10+, macOS 10.15+, Ubuntu 20.04+ | 目标平台 |

### ⚡ 一键启动

#### Windows (PowerShell)
```powershell
# 1. 克隆项目
git clone https://github.com/FlywithYou1/modern-calculator.git
cd modern-calculator

# 2. 安装依赖
npm ci

# 3. 启动开发服务器
npm run dev
# 或者启动完整 Tauri 应用
npm run tauri:dev
```

#### macOS / Linux (bash)
```bash
# 1. 克隆项目
git clone https://github.com/FlywithYou1/modern-calculator.git
cd modern-calculator

# 2. 安装系统依赖 (仅 Linux)
sudo apt-get update && sudo apt-get install -y \
  libglib2.0-dev libgtk-3-dev libwebkit2gtk-4.1-dev \
  libayatana-appindicator3-dev librsvg2-dev patchelf

# 3. 安装项目依赖
npm ci

# 4. 启动开发服务器
npm run dev
```

## 🔧 开发工作流

### 📊 质量检查
```bash
# 完整检查流程
npm run typecheck    # TypeScript 类型检查
npm run lint         # ESLint 代码检查  
npm run test:run     # 单元测试 (13/13)
npm run format       # 代码格式化
npm run build        # 前端构建

# 质量门总览
npm run quality:check  # 运行所有检查
```

### 🏗️ 构建部署
```bash
# 前端构建 (生成 dist/)
npm run build

# 桌面应用打包
npm run tauri:build

# Android 构建 (需要 SDK)
npm run android:init    # 初始化 Android 项目
npm run android:build   # 构建 APK/AAB
```

### 🎯 项目架构

```
modern-calculator/
├── 📁 src/                    # 前端源码 (TypeScript + SCSS)
│   ├── 🧩 components/         # 模块化组件
│   │   ├── Calculator.ts      # 主计算器组件
│   │   ├── Display.ts         # 显示屏组件
│   │   ├── Keyboard.ts        # 键盘组件
│   │   ├── History.ts         # 历史记录组件
│   │   └── Settings.ts        # 设置面板组件
│   ├── 🎨 styles/             # SCSS 样式系统
│   ├── 🛠️ utils/              # 工具函数库
│   ├── 🧪 tests/              # 单元测试 (Vitest)
│   └── 📝 types/              # TypeScript 类型定义
├── 📁 src-tauri/              # Rust 后端引擎
│   ├── src/
│   │   ├── math/              # 高精度数学计算
│   │   ├── parser/            # 表达式解析器
│   │   ├── history/           # 历史记录管理
│   │   └── settings/          # 配置管理
│   └── gen/android/           # Android 项目 (构建时生成)
├── 📁 .github/workflows/      # CI/CD 流水线
├── 📦 dist/                   # 前端构建产物
└── 📋 package.json            # 项目配置
```

### 🤖 CI/CD 流水线

项目使用 GitHub Actions 自动化：

- **✅ 质量检查**: TypeScript + ESLint + 测试
- **📦 自动构建**: 每次推送自动生成构建产物
- **🤖 Android 支持**: 主分支自动尝试 Android 构建
- **📥 产物下载**: 7天保留期，Actions 页面下载

## 🎮 使用说明

### ⌨️ 键盘快捷键

| 按键 | 功能 | 按键 | 功能 |
|------|------|------|------|
| `0-9` | 数字输入 | `Enter` / `=` | 计算结果 |
| `+ - * /` | 基础运算 | `Escape` / `C` | 清除 |
| `( )` | 括号 | `Backspace` | 退格 |
| `Ctrl + H` | 历史记录 | `Ctrl + S` | 科学模式 |

### 🔬 科学计算功能

- **基础运算**: 四则运算、百分比、幂运算、开方
- **三角函数**: sin, cos, tan, asin, acos, atan (角度/弧度)
- **对数指数**: ln, log, log₁₀, e^x, 10^x  
- **统计函数**: 阶乘、排列组合、最大公约数、最小公倍数
- **常数库**: π, e, φ (黄金比例), √2 等数学常数
- **内存操作**: MS (存储), MR (读取), M+ (加), MC (清除)

### 📱 移动端特性

- **触摸优化**: 大按钮设计，支持手势操作
- **横竖屏**: 自动适配屏幕方向变化
- **震动反馈**: 按键操作触觉反馈 (可关闭)
- **语音输入**: 数学表达式语音识别 (开发中)

## 🌍 多平台支持

| 平台 | 状态 | 格式 | 说明 |
|------|------|------|------|
| **Windows** | ✅ 完全支持 | `.msi`, `.exe` | Windows 10+ |
| **macOS** | ✅ 完全支持 | `.dmg`, `.app` | macOS 10.15+ |  
| **Linux** | ✅ 完全支持 | `.deb`, `.AppImage` | Ubuntu 20.04+ |
| **Android** | 🚧 构建就绪 | `.apk`, `.aab` | Android 8.0+ |
| **iOS** | 📋 计划中 | `.ipa` | iOS 13.0+ (需 macOS) |

### 📱 Android 构建要求

```bash
# 环境要求
- Android SDK (API 34+)
- Android NDK (26.1.10909125)  
- Java 17 (Temurin LTS)
- Rust Android targets

# 构建步骤
npm run android:init     # 初始化项目
npm run android:build    # 构建 APK/AAB
```

## 🔐 技术架构

### 🏗️ 核心技术栈

| 层级 | 技术选型 | 版本 | 说明 |
|------|----------|------|------|
| **前端** | TypeScript | 5.6+ | 严格类型检查，现代语法 |
| **构建** | Vite | 7.1+ | 快速构建，热更新 |
| **后端** | Rust | 1.89+ | 高性能计算引擎 |
| **框架** | Tauri | 2.8+ | 跨平台桌面/移动应用 |
| **样式** | SCSS | 原生 | GPU 加速动画 |
| **测试** | Vitest | 最新 | 快速单元测试 |

### ⚡ 性能优化

- **代码分割**: 计算引擎独立加载，减少初始包大小
- **懒加载**: 按需加载组件和功能模块  
- **GPU 加速**: 所有动画使用 `transform` + `opacity`
- **智能降级**: 低性能设备自动关闭动画效果
- **内存管理**: 自动清理计算历史，防止内存泄漏
- **缓存策略**: 计算结果缓存，相同表达式快速返回

### 🔒 安全特性

- **CSP 策略**: 严格的内容安全策略，防止 XSS 攻击
- **本地存储**: 计算历史和配置仅保存在本地
- **无数据收集**: 不收集或传输任何用户数据
- **签名验证**: 发布包经过数字签名验证

## 🤝 贡献指南

### 开发流程
1. **Fork** 项目到自己的 GitHub
2. **克隆** Fork 的仓库到本地
3. **创建** 功能分支: `git checkout -b feature/awesome-feature`
4. **开发** 并遵循代码规范
5. **测试** 确保所有检查通过: `npm run quality:check`
6. **提交** 更改: `git commit -m 'Add awesome feature'`
7. **推送** 分支: `git push origin feature/awesome-feature`
8. **创建** Pull Request

### 代码规范
- **TypeScript**: 严格模式，无 `any` 类型
- **ESLint**: 遵循项目配置，无警告
- **Prettier**: 统一代码格式
- **测试**: 新功能需要对应测试用例
- **提交**: 遵循 [Conventional Commits](https://conventionalcommits.org/)

## 📄 许可证

[MIT License](LICENSE) - 自由使用、修改和分发

## 🆘 支持与反馈

- **🐛 Bug 报告**: [GitHub Issues](https://github.com/FlywithYou1/modern-calculator/issues)
- **💡 功能建议**: [GitHub Discussions](https://github.com/FlywithYou1/modern-calculator/discussions)
- **📖 文档**: [项目 Wiki](https://github.com/FlywithYou1/modern-calculator/wiki)
- **📧 联系**: 通过 GitHub Issues 联系维护者

---

<p align="center">
  <strong>🧮 现代科学计算器 - 让计算更精确，更优雅 ✨</strong>
</p>