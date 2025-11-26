# Modern Calculator 操作手册

## 目录

1. [快速开始](#快速开始)
2. [基础运算](#基础运算)
3. [科学计算](#科学计算)
4. [高级功能](#高级功能)
5. [LaTeX 公式](#latex-公式)
6. [快捷键](#快捷键)
7. [构建产物](#构建产物)
8. [故障排除](#故障排除)

---

## 快速开始

### 安装

**Windows:**
1. 下载 `.msi` 或 `.exe` 安装包
2. 双击运行安装程序
3. 按提示完成安装

**Linux:**
```bash
# Debian/Ubuntu
sudo dpkg -i modern-calculator_*.deb

# 或使用 AppImage (无需安装)
chmod +x Modern-Calculator_*.AppImage
./Modern-Calculator_*.AppImage
```

**Android:**
1. 下载 `.apk` 文件
2. 在设备上允许安装未知来源应用
3. 点击 APK 文件安装

### 启动应用

安装完成后，在开始菜单（Windows）或应用程序列表中找到 "Modern Calculator" 并启动。

---

## 基础运算

### 输入方式

- **鼠标点击**: 点击界面上的数字和运算符按钮
- **键盘输入**: 直接使用键盘输入表达式
- **触摸操作**: 移动端支持触摸按钮

### 支持的运算符

| 运算符 | 功能 | 示例 |
|--------|------|------|
| `+` | 加法 | `5 + 3 = 8` |
| `-` | 减法 | `10 - 4 = 6` |
| `×` 或 `*` | 乘法 | `6 × 7 = 42` |
| `÷` 或 `/` | 除法 | `15 ÷ 3 = 5` |
| `%` | 百分比/取模 | `50% = 0.5` |
| `^` | 幂运算 | `2^8 = 256` |
| `√` | 平方根 | `√16 = 4` |

### 括号使用

支持嵌套括号，按标准数学运算优先级计算：

```
(2 + 3) × (4 - 1) = 15
((5 + 3) × 2)^2 = 256
```

---

## 科学计算

### 三角函数

| 函数 | 描述 | 示例 |
|------|------|------|
| `sin(x)` | 正弦 | `sin(π/6) = 0.5` |
| `cos(x)` | 余弦 | `cos(0) = 1` |
| `tan(x)` | 正切 | `tan(π/4) = 1` |
| `asin(x)` | 反正弦 | `asin(0.5) = π/6` |
| `acos(x)` | 反余弦 | `acos(1) = 0` |
| `atan(x)` | 反正切 | `atan(1) = π/4` |

**角度/弧度切换**: 在设置中可以切换角度制和弧度制。

### 对数与指数

| 函数 | 描述 | 示例 |
|------|------|------|
| `ln(x)` | 自然对数 | `ln(e) = 1` |
| `log(x)` | 常用对数 (底10) | `log(100) = 2` |
| `exp(x)` | e的x次方 | `exp(1) = e ≈ 2.718` |

### 常用常数

| 常数 | 值 | 输入方式 |
|------|-----|----------|
| π (圆周率) | 3.14159... | 点击 `π` 按钮 |
| e (自然常数) | 2.71828... | 点击 `e` 按钮 |

---

## 高级功能

点击 **"高级"** 按钮打开高级功能面板。

### 矩阵运算

**输入格式**: 每行一个矩阵行，元素用空格分隔

```
1 2 3
4 5 6
7 8 9
```

**支持操作**:

| 操作 | 描述 |
|------|------|
| 加法/减法 | 矩阵相加/相减 |
| 乘法 | 矩阵乘法 |
| 转置 | 行列互换 |
| 行列式 | 计算方阵的行列式 |
| 求逆 | 计算逆矩阵 |
| 矩阵迹 | 对角线元素之和 |
| 矩阵秩 | 线性无关行/列数 |
| Frobenius范数 | 矩阵元素平方和的平方根 |
| 矩阵幂 | 矩阵的n次幂（支持负数表示逆矩阵的幂）|
| LU分解 | 分解为下三角和上三角矩阵 |

### 微积分

#### 符号求导
使用符号计算引擎，返回导数表达式：

```
输入: x^2 + 2*x
输出: f'(x) = 2*x + 2
```

#### 数值求导
在指定点计算函数的数值导数：

```
函数: sin(x)
点: x = π/2
结果: f'(π/2) ≈ 0
```

#### 数值积分
使用辛普森法则计算定积分：

```
函数: x^2
区间: [0, 1]
结果: ∫[0,1] x² dx ≈ 0.33333333
```

### 函数图像绘制

1. 输入函数表达式（如 `sin(x)`, `x^2`, `exp(-x^2)`）
2. 设置 X 轴范围
3. 点击"绘制图像"

支持的函数：`sin`, `cos`, `tan`, `exp`, `ln`, `log`, `sqrt`, `abs` 等

### 复数运算

输入复数的实部和虚部，支持加减乘除运算：

```
A = 3 + 4i
B = 1 + 2i
A + B = 4 + 6i
A × B = -5 + 10i
```

### 单位转换

支持类别：
- **长度**: 米、千米、厘米、毫米、英寸、英尺、码、英里
- **质量**: 千克、克、毫克、磅、盎司、吨
- **温度**: 摄氏度、华氏度、开尔文
- **时间**: 秒、分钟、小时、天

### 进制转换

支持 2进制、8进制、10进制、16进制 之间的互转：

```
二进制 1010 → 十进制 10
十六进制 FF → 十进制 255
```

### 统计分析

输入数据集（逗号或空格分隔），计算：
- 均值 (mean)
- 中位数 (median)
- 方差 (variance)
- 标准差 (stdev)
- 最小/最大值
- 求和/乘积
- 极差 (range)

### 方程求解

使用牛顿-拉弗森法数值求解方程：

```
输入: x^2 - 4 = 0
输出: x ≈ 2.000000 或 x ≈ -2.000000
```

---

## LaTeX 公式

计算器支持 LaTeX 数学公式渲染，可以在结果显示中看到格式化的数学表达式。

### 支持的 LaTeX 语法

| 语法 | 效果 | 说明 |
|------|------|------|
| `\frac{a}{b}` | $\frac{a}{b}$ | 分数 |
| `\sqrt{x}` | $\sqrt{x}$ | 平方根 |
| `\sqrt[n]{x}` | $\sqrt[n]{x}$ | n次方根 |
| `x^{n}` | $x^n$ | 上标/幂 |
| `x_{i}` | $x_i$ | 下标 |
| `\sum_{i=1}^{n}` | $\sum_{i=1}^{n}$ | 求和 |
| `\int_{a}^{b}` | $\int_{a}^{b}$ | 积分 |
| `\pi, \theta, \alpha` | $\pi, \theta, \alpha$ | 希腊字母 |
| `\infty` | $\infty$ | 无穷 |
| `\lim_{x \to 0}` | $\lim_{x \to 0}$ | 极限 |

### 示例

- 二次公式: `x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`
- 欧拉公式: `e^{i\pi} + 1 = 0`
- 积分: `\int_0^1 x^2 \, dx = \frac{1}{3}`

---

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `0-9` | 输入数字 |
| `+` `-` `*` `/` | 运算符 |
| `Enter` | 计算结果 |
| `Escape` | 清除当前输入 |
| `Backspace` | 删除最后一个字符 |
| `(` `)` | 括号 |
| `.` | 小数点 |
| `^` | 幂运算 |

---

## 构建产物

### 产物位置

构建完成后，安装包位于以下目录:

| 平台 | 格式 | 路径 |
|------|------|------|
| **Windows** | `.msi` | `src-tauri/target/release/bundle/msi/` |
| **Windows** | `.exe` (NSIS) | `src-tauri/target/release/bundle/nsis/` |
| **Linux** | `.deb` | `src-tauri/target/release/bundle/deb/` |
| **Linux** | `.AppImage` | `src-tauri/target/release/bundle/appimage/` |
| **macOS** | `.dmg` | `src-tauri/target/release/bundle/dmg/` |
| **macOS** | `.app` | `src-tauri/target/release/bundle/macos/` |
| **Android** | `.apk` | `src-tauri/gen/android/app/build/outputs/apk/` |

### 从 GitHub Releases 下载

访问 [Releases 页面](https://github.com/FlywithYou1/modern-calculator/releases) 下载预编译版本:

1. 找到最新的 Release 版本
2. 在 **Assets** 部分选择对应平台的安装包:
   - `Modern-Calculator_x.x.x_x64.msi` - Windows MSI 安装包
   - `Modern-Calculator_x.x.x_x64-setup.exe` - Windows NSIS 安装包
   - `modern-calculator_x.x.x_amd64.deb` - Debian/Ubuntu
   - `Modern-Calculator_x.x.x_amd64.AppImage` - Linux 通用
   - `Modern-Calculator_x.x.x_aarch64.apk` - Android ARM64

### 本地构建

```bash
# 构建所有平台 (需要对应环境)
npm run tauri build

# 仅构建 Debug 版本 (不打包安装程序)
npm run tauri build -- --debug

# Windows (需要 MSYS2 + GNU 工具链)
$env:PATH = "C:\msys64\ucrt64\bin;$env:PATH"
npm run tauri build

# Android
npm run tauri android build --apk
```

---

## 故障排除

### 常见问题

**Q: 计算结果显示 "Error" 或 "NaN"**

A: 可能是：
- 除数为零
- 对负数取平方根
- 对数的参数为负数或零
- 表达式语法错误

**Q: 矩阵运算失败**

A: 检查：
- 矩阵格式是否正确（每行换行，元素空格分隔）
- 矩阵维度是否匹配（加减需同维度，乘法需列数等于行数）
- 求逆矩阵时矩阵是否可逆

**Q: 函数图像不显示**

A: 确保：
- 表达式语法正确
- X 轴范围合理（最小值小于最大值）
- 函数在该范围内有定义

**Q: Windows 构建失败**

A: 本项目使用 GNU 工具链：
1. 确保安装了 MSYS2
2. 将 `C:\msys64\ucrt64\bin` 添加到 PATH
3. 使用 `nightly-x86_64-pc-windows-gnu` 工具链

---

## 技术支持

- **GitHub Issues**: [提交问题](https://github.com/FlywithYou1/modern-calculator/issues)
- **文档**: 查看 [README.md](./README.md)

---

*Modern Calculator v2.0.0 - 高精度科学计算器*
