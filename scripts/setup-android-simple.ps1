# Android 环境设置脚本
Write-Host "🔧 正在配置 Android 开发环境..." -ForegroundColor Green

# 设置环境变量
$ANDROID_HOME = "C:\Users\liang\AppData\Local\Android\Sdk"
$NDK_HOME = "C:\Users\liang\AppData\Local\Android\Sdk\ndk\29.0.14033849"

# 设置当前会话环境变量
$env:ANDROID_HOME = $ANDROID_HOME
$env:ANDROID_SDK_ROOT = $ANDROID_HOME
$env:NDK_HOME = $NDK_HOME

# 设置永久环境变量
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $ANDROID_HOME, "User")
[Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $ANDROID_HOME, "User")
[Environment]::SetEnvironmentVariable("NDK_HOME", $NDK_HOME, "User")

Write-Host "✅ 环境变量已设置:" -ForegroundColor Green
Write-Host "   ANDROID_HOME = $env:ANDROID_HOME" -ForegroundColor Cyan
Write-Host "   NDK_HOME = $env:NDK_HOME" -ForegroundColor Cyan

Write-Host "🎉 Android 开发环境配置完成!" -ForegroundColor Green