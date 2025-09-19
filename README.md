# 科学计算器 (Tauri Scientific Calculator)

一个基于 Tauri 构建的现代科学计算器，支持多平台桌面与移动（Tauri 2 Mobile）应用，并提供定积分与矩阵行列式等高级科学运算，内置性能模式和国际化（中/英）。

## 功能特性
 - 科学运算: 三角函数、对数、幂运算、开方、阶乘、倒数
 - 高级功能: 定积分（自适应 Simpson 数值法）、矩阵行列式（LU 分解）
 - 常用常数: π、e 等数学常数
 - 数学库: Math.js + 自研数值引擎（积分/行列式）
 - 内存功能: MS、MR、M+、M-、MC
### 开发模式

```pwsh
npm run dev         # 前端调试（Windows PowerShell）
npm run tauri:dev   # Tauri 调试（需 Rust）
```
- **响应式设计**: 适配不同屏幕尺寸
- **主题切换**: 明暗主题支持
### 构建与测试

```pwsh
npm run typecheck
npm run lint
npm run test:run
npm run build
npm run tauri:build
```
- **性能模式**: 高/低性能模式切换
- **GPU 优先**: 所有动画使用 GPU 加速
CI: `.github/workflows/ci.yml` 针对 Windows / macOS / Linux 并行执行 Lint / Format Check / Typecheck / Test / Web 构建，并包含安全审计；`.github/workflows/release.yml` 在三大平台产出安装包并草拟发布（含 Linux WebKitGTK 4.1/4.0 自适应依赖）。
- **智能降级**: 低性能设备自动优化

## 安全、隐私与已知限制

- 不在仓库保存明文密钥；如需签名/发布，请改用 GitHub Secrets 注入。
- 历史/配置为本地存储，后续可接入系统安全存储。
- 积分为数值法；病态矩阵行列式存在数值误差；移动端需另行集成 Capacitor/Flutter。
- **无障碍**: 高对比度和屏幕阅读器支持

## 技术栈

## 技术栈

- 前端: Vanilla TypeScript + Vite（无 React）
- 后端: Tauri (Rust)
- 样式: CSS3 + CSS变量（GPU 优先，支持低性能降级）
- 数学库: Math.js
- 构建: Tauri CLI

## 开发环境要求
├── src/                    # 前端源码（Vanilla）
│   ├── vanilla/            # 应用入口与 UI 逻辑（app.ts、styles.css）
│   ├── lib/                # 计算引擎与工具
│   ├── test/               # 单元测试（Vitest）
│   └── index.css           # 全局样式与主题变量
	 - Android: Android Studio + SDK/NDK (建议 SDK 34+), 启用 USB 调试或使用模拟器
	 - iOS: macOS + Xcode (iOS 15+), 已安装命令行工具与签名证书（真机）

## 🚀 快速开始

### 环境要求
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0  
- **Rust**: >= 1.90.0 (推荐 1.91.0+)
- **系统**: Windows 10+, macOS 10.15+, Ubuntu 20.04+

### 💻 开发环境设置

#### Windows (PowerShell):
```powershell
# 克隆项目
git clone https://github.com/FlywithYou1/modern-calculator.git
cd modern-calculator

# 安装依赖
npm install

# 启动开发服务器
npm run dev
# 或使用 Tauri 开发模式
npm run tauri:dev
```

#### macOS / Linux (bash):
```bash
# 克隆项目  
git clone https://github.com/FlywithYou1/modern-calculator.git
cd modern-calculator

# 安装依赖
npm install

# Linux 需要安装系统依赖
sudo apt-get update
sudo apt-get install -y \
  libglib2.0-dev \
  libgtk-3-dev \
  libwebkit2gtk-4.0-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf

# 启动开发服务器
npm run dev
# 或使用 Tauri 开发模式  
npm run tauri:dev
```

### 🔧 质量检查与构建

#### 开发工作流
```bash
# 类型检查
npm run typecheck

# 代码检查 (基础版)
npx eslint src --ext .ts,.tsx --config eslint.simple.config.js

# 代码格式化
npm run format

# 运行测试
npm run test:run

# 构建前端
npm run build

# 构建 Tauri 应用
npm run tauri:build
```

#### 质量门检查 (CI/CD)
所有提交都会自动执行以下检查：
- ✅ 前端单元测试 (Vitest)
- ⚠️ TypeScript 类型检查 (容错模式)
- ⚠️ ESLint 代码检查 (简化配置)
- ⚠️ Rust 单元测试 (需要系统依赖)
- ✅ 多平台构建测试
## ⚠️ 已知问题与限制

### 当前状态 (v2.0.0)
项目正在积极开发中，以下是当前已知的问题和限制：

#### 🔧 配置问题
- **TypeScript**: 类型检查存在依赖冲突，已启用 `skipLibCheck` 容错模式
- **ESLint**: 使用简化配置，完整 TypeScript 解析需要额外配置
- **Vitest**: 某些测试需要 DOM 环境，部分测试在 Node.js 环境下失败
- **依赖版本**: `sass` vs `sass-embedded` 版本不匹配

#### 🐧 Linux 系统依赖  
Rust 后端需要以下系统库：
```bash
sudo apt-get install -y \
  libglib2.0-dev \
  libgtk-3-dev \
  libwebkit2gtk-4.0-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf
```

#### 📱 移动端支持
- Android 构建需要额外的 SDK 和 NDK 配置
- iOS 构建需要 Apple 开发者证书
- 完整移动端支持计划在后续版本中实现

#### 🔐 安全与隐私
- 历史记录和配置文件存储在本地
- 不会收集或传输用户数据
- 签名证书需要通过 GitHub Secrets 配置
- CSP 策略限制脚本执行，增强安全性

### 🚀 工作项功能
尽管存在上述限制，以下功能已可正常使用：
- ✅ 基础数学运算 (加减乘除、百分比、幂运算)
- ✅ 科学计算函数 (三角函数、对数、指数)
- ✅ 计算历史记录和导出
- ✅ 主题切换 (浅色/深色模式)
- ✅ 键盘快捷键支持
- ✅ 响应式界面设计
- ✅ GPU 加速动画 (60fps)
- ✅ MCP 调试接口 (开发模式)

### 🔄 持续改进
我们正在积极解决这些问题：
1. 优化构建配置和依赖管理
2. 完善测试覆盖率和 CI/CD 流程
3. 改进跨平台兼容性
4. 增强移动端体验
5. 扩展高级数学功能
```

macOS / Linux (bash):

```bash
npm install
npm run tauri:dev
```

### 构建应用

```pwsh
npm run tauri:build
```

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `0-9` | 数字输入 |
| `+ - * /` | 基础运算符 |
| `Enter` 或 `=` | 计算结果 |
| `Escape` 或 `C` | 清除 |
| `Backspace` | 退格 |
| `( )` | 括号 |
| `Ctrl + H` | 显示/隐藏历史 |
| `Ctrl + S` | 切换科学模式 |

## 项目结构

\`\`\`
├── src/                    # 前端源码
│   ├── components/         # React 组件
│   ├── contexts/          # React Context
│   ├── App.tsx            # 主应用组件
│   └── main.tsx           # 应用入口
├── src-tauri/             # Tauri 后端
│   ├── src/               # Rust 源码
│   ├── Cargo.toml         # Rust 配置
│   └── tauri.conf.json    # Tauri 配置
├── public/                # 静态资源
├── dist/                  # 构建输出
└── package.json           # 项目配置
\`\`\`

## 贡献指南

1. Fork 项目
2. 创建功能分支: \`git checkout -b feature/new-feature\`
3. 提交更改: \`git commit -m 'Add new feature'\`
4. 推送分支: \`git push origin feature/new-feature\`
5. 提交 Pull Request

## 许可证

MIT License

## 支持平台

- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Linux (Ubuntu 20.04+/22.04+)
- ✅ Android（Tauri 2 Mobile，需初始化工程与签名）
- ✅ iOS（Tauri 2 Mobile，需 macOS/Xcode 与签名）

### 移动端（Android / iOS）

Tauri 2 已支持移动端开发。请先安装上面“移动端先决条件”。

初始化移动项目结构（会在 `src-tauri/` 下生成 android / ios 工程）：

Windows (PowerShell):

```pwsh
npm run android:init
npm run ios:init
```

开发与调试：

```pwsh
# 连接设备或打开模拟器后
npm run android:dev   # Android 调试
npm run ios:dev       # iOS 调试（需 macOS）
```

打包构建：

```pwsh
npm run android:build
npm run ios:build
```

注意：
- Linux 上构建桌面需要 `libwebkit2gtk` 等依赖；Android/iOS 构建需对应平台工具链。
- iOS 真机构建需 Apple 开发者证书与签名配置；Android 发布需 Keystore。

## 性能优化说明

本项目优先使用 GPU 加速来实现流畅的动画效果：

- 所有动画使用 `transform` 和 `opacity` 属性
- 启用 `will-change` 提示浏览器优化
- 响应用户的 `prefers-reduced-motion` 设置
- 智能检测设备性能并自动调整

## 已知限制

- 科学计算精度受 JavaScript 浮点数限制
- 部分高级数学函数需要额外的数学库支持
- 移动端支持正在开发中

---

更多详细信息请参考项目文档或提交 Issue。另见 CONTRIBUTING.md 获取跨平台与 CI 规范。
