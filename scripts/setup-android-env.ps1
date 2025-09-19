# Android 环境设置脚本
# 用于科学计算器项目的 Android 开发环境配置

Write-Host "🔧 正在配置 Android 开发环境..." -ForegroundColor Green

# 检查 Android SDK 路径
$ANDROID_HOME = "C:\Users\liang\AppData\Local\Android\Sdk"
if (-not (Test-Path $ANDROID_HOME)) {
    Write-Host "❌ 错误: Android SDK 未找到在 $ANDROID_HOME" -ForegroundColor Red
    Write-Host "请先安装 Android Studio 和 SDK" -ForegroundColor Yellow
    exit 1
}

# 检查 NDK 路径
$NDK_PATH = "$ANDROID_HOME\ndk"
if (-not (Test-Path $NDK_PATH)) {
    Write-Host "❌ 错误: NDK 未找到在 $NDK_PATH" -ForegroundColor Red
    Write-Host "请在 Android Studio 中安装 NDK" -ForegroundColor Yellow
    exit 1
}

# 获取最新的 NDK 版本
$NDK_VERSIONS = Get-ChildItem $NDK_PATH | Sort-Object Name -Descending
if ($NDK_VERSIONS.Count -eq 0) {
    Write-Host "❌ 错误: 没有找到任何 NDK 版本" -ForegroundColor Red
    exit 1
}

$LATEST_NDK = $NDK_VERSIONS[0].Name
$NDK_HOME = "$NDK_PATH\$LATEST_NDK"

Write-Host "✅ 找到 Android SDK: $ANDROID_HOME" -ForegroundColor Green
Write-Host "✅ 找到 NDK 版本: $LATEST_NDK" -ForegroundColor Green

# 设置环境变量
$env:ANDROID_HOME = $ANDROID_HOME
$env:ANDROID_SDK_ROOT = $ANDROID_HOME
$env:NDK_HOME = $NDK_HOME

# 永久设置用户环境变量
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $ANDROID_HOME, "User")
[Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $ANDROID_HOME, "User")
[Environment]::SetEnvironmentVariable("NDK_HOME", $NDK_HOME, "User")

Write-Host "✅ 环境变量已设置:" -ForegroundColor Green
Write-Host "   ANDROID_HOME = $env:ANDROID_HOME" -ForegroundColor Cyan
Write-Host "   ANDROID_SDK_ROOT = $env:ANDROID_SDK_ROOT" -ForegroundColor Cyan
Write-Host "   NDK_HOME = $env:NDK_HOME" -ForegroundColor Cyan

# 检查 Java 版本
Write-Host "`n🔍 检查 Java 版本..." -ForegroundColor Green
try {
    $javaVersion = java -version 2>&1 | Select-String "version" | Select-Object -First 1
    Write-Host "✅ $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ 错误: Java 未安装或不在 PATH 中" -ForegroundColor Red
    Write-Host "请安装 Java 11 或更高版本" -ForegroundColor Yellow
}

# 检查 Rust Android 目标架构
Write-Host "`n🔍 检查 Rust Android 目标架构..." -ForegroundColor Green
$targets = @("aarch64-linux-android", "armv7-linux-androideabi", "i686-linux-android", "x86_64-linux-android")
foreach ($target in $targets) {
    $installed = rustup target list --installed | Select-String $target
    if ($installed) {
        Write-Host "✅ $target 已安装" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $target 未安装，正在安装..." -ForegroundColor Yellow
        rustup target add $target
    }
}

Write-Host "`n🎉 Android 开发环境配置完成!" -ForegroundColor Green
Write-Host "现在可以运行以下命令构建 Android 应用:" -ForegroundColor Cyan
Write-Host "   npm run tauri android build" -ForegroundColor White
Write-Host "   npm run tauri android dev" -ForegroundColor White