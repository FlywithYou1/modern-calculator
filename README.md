# 🧮 Modern Calculator

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Rust](https://img.shields.io/badge/rust-nightly-orange.svg)
![Tauri](https://img.shields.io/badge/tauri-2.x-purple.svg)

**高精度现代科学计算器** | High-Precision Modern Scientific Calculator

[功能特性](#-功能特性) • [安装](#-安装) • [开发](#-开发) • [文档](#-文档) • [贡献](#-贡献)

</div>

---

## ✨ 功能特性

### 🔢 基础计算
- 四则运算、括号嵌套、运算符优先级
- 百分比、幂运算、开方
- 高精度计算（基于 rust_decimal，避免浮点误差）

### 🔬 科学计算
- **三角函数**: sin, cos, tan, asin, acos, atan, sinh, cosh, tanh
- **对数指数**: ln, log, log10, exp
- **常数**: π, e, φ (黄金比例)
- **角度制/弧度制切换**

### 📊 矩阵运算
- 矩阵加减乘、转置、行列式、求逆
- **矩阵迹、矩阵秩、Frobenius 范数**
- **矩阵幂（支持负数幂）**
- **LU 分解**

### 📈 微积分
- **符号求导** (基于 mathjs)
- **数值求导** (五点中心差分法)
- **数值积分** (辛普森法则)
- **函数图像绘制** (Chart.js 渲染)

### 🔧 实用工具
- **复数运算**: 加减乘除
- **单位转换**: 长度、质量、温度、时间
- **进制转换**: 2/8/10/16 进制互转
- **统计分析**: 均值、方差、标准差、中位数等
- **方程求解**: 牛顿-拉弗森法数值解

### 🎨 用户体验
- 深色/浅色主题切换
- 计算历史记录（可导出）
- 完整键盘快捷键支持
- 响应式设计，适配桌面和移动端

---

## 📥 安装

### 预编译版本

从 [Releases](https://github.com/FlywithYou1/modern-calculator/releases) 下载：

| 平台 | 格式 | 说明 |
|------|------|------|
| Windows | `.msi` / `.exe` | 推荐使用 MSI 安装包 |
| Linux | `.deb` / `.AppImage` | Debian/Ubuntu 使用 deb，其他发行版使用 AppImage |
| Android | `.apk` | 直接安装 APK |

### 从源码构建

#### 前置要求

- **Node.js** 20+
- **Rust** nightly (GNU 工具链 for Windows)
- **MSYS2** (仅 Windows，提供 MinGW-w64 工具链)

#### Windows (GNU 工具链)

```powershell
# 1. 安装 MSYS2 (https://www.msys2.org/)
# 2. 在 MSYS2 UCRT64 中安装工具链
pacman -S mingw-w64-ucrt-x86_64-gcc mingw-w64-ucrt-x86_64-toolchain

# 3. 安装 Rust nightly GNU
rustup default nightly-x86_64-pc-windows-gnu

# 4. 设置环境变量（每次构建前）
$env:PATH = "C:\msys64\ucrt64\bin;$env:PATH"

# 5. 构建
npm ci
npm run build
npm run tauri build
```

#### Linux

```bash
# 安装系统依赖 (Ubuntu/Debian)
sudo apt-get install -y \
  libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev \
  librsvg2-dev patchelf libsoup-3.0-dev libjavascriptcoregtk-4.1-dev

# 安装 Rust nightly
rustup default nightly

# 构建
npm ci
npm run build
npm run tauri build
```

#### macOS

```bash
# 安装 Xcode Command Line Tools
xcode-select --install

# 安装 Rust nightly
rustup default nightly

# 构建
npm ci
npm run build
npm run tauri build
```

---

## 🛠️ 开发

### 本地开发

```bash
# 安装依赖
npm ci

# 启动开发服务器（热重载）
npm run tauri dev
```

### 项目结构

```
modern-calculator/
├── src/                    # 前端源码 (Vue 3 + TypeScript)
│   ├── components/         # Vue 组件
│   │   ├── Calculator.vue  # 主计算器
│   │   ├── AdvancedPanels.vue  # 高级功能面板
│   │   └── TitleBar.vue    # 标题栏
│   ├── locales/            # 国际化
│   └── utils/              # 工具函数
├── src-tauri/              # Rust 后端
│   └── src/
│       ├── commands.rs     # Tauri 命令
│       ├── math/           # 数学计算模块
│       ├── parser/         # 表达式解析器
│       ├── history/        # 历史记录管理
│       └── settings/       # 设置管理
├── .github/workflows/      # CI/CD 配置
│   ├── ci-cd.yml           # 持续集成
│   └── release.yml         # 自动发布
└── docs/                   # 文档
    └── USAGE.md            # 操作手册
```

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Vue 3 + TypeScript |
| 构建工具 | Vite 7 |
| 图表库 | Chart.js |
| 数学库 | mathjs (前端), rust_decimal + num-complex (后端) |
| 桌面框架 | Tauri 2.0 |
| 后端语言 | Rust (nightly) |
| 工具链 | GNU (Windows), LLVM (Linux/macOS) |

---

## 📚 文档

- [操作手册](./docs/USAGE.md) - 详细使用说明
- [开发规范](./.github/copilot-instructions.md) - 代码规范和设计指南

---

## 🚀 发布

### 自动发布

推送 tag 时自动触发 Release 构建：

```bash
git tag v2.1.0
git push origin v2.1.0
```

### 手动发布

在 GitHub Actions 中手动触发 `release.yml` 工作流，输入版本号。

---

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 开发要求

- 遵循项目代码规范
- 为新功能编写测试
- 更新相关文档

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

---

## 🙏 致谢

- [Tauri](https://tauri.app/) - 跨平台桌面应用框架
- [Vue.js](https://vuejs.org/) - 前端框架
- [rust_decimal](https://crates.io/crates/rust_decimal) - 高精度十进制库
- [mathjs](https://mathjs.org/) - JavaScript 数学库
- [Chart.js](https://www.chartjs.org/) - 图表库

---

<div align="center">

**Made with ❤️ using Rust + Vue + Tauri**

</div>
