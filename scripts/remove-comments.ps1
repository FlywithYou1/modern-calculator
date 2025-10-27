param(
    [string]$Path = ".",
    [switch]$Preview = $false
)

$ErrorActionPreference = "Stop"

function Remove-Comments {
    param([string]$Content)
    
    $lines = $Content -split "`r?`n"
    $result = @()
    $inBlockComment = $false
    $inJsDoc = $false
    
    foreach ($line in $lines) {
        $processedLine = $line
        
        if ($inBlockComment -or $inJsDoc) {
            if ($line -match '\*/') {
                $inBlockComment = $false
                $inJsDoc = $false
                $processedLine = $line -replace '.*?\*/', ''
            } else {
                continue
            }
        }
        
        if ($processedLine -match '/\*\*') {
            $inJsDoc = $true
            $processedLine = $processedLine -replace '/\*\*.*', ''
        }
        
        if ($processedLine -match '/\*') {
            if ($processedLine -match '/\*.*\*/') {
                $processedLine = $processedLine -replace '/\*.*?\*/', ''
            } else {
                $inBlockComment = $true
                $processedLine = $processedLine -replace '/\*.*', ''
            }
        }
        
        $processedLine = $processedLine -replace '//.*$', ''
        
        if ($processedLine -match '\S' -or $processedLine -eq '') {
            $result += $processedLine
        }
    }
    
    return ($result -join "`n")
}

$tsFiles = @(
    "src\components\Calculator.ts",
    "src\components\Keyboard.ts",
    "src\components\History.ts",
    "src\components\Settings.ts",
    "src\components\AdvancedPanels.ts",
    "src\components\MCPDebugPanel.ts",
    "src\utils\accessibility.ts",
    "src\utils\device.ts",
    "src\utils\evaluator.ts",
    "src\utils\i18n.ts",
    "src\utils\mcp-debugger.ts",
    "src\utils\performance.ts",
    "src\utils\settings-defaults.ts",
    "src\utils\tauri.ts",
    "src\utils\theme.ts",
    "src\tests\advanced-panels.test.ts",
    "src\tests\calculator.test.ts",
    "src\tests\debugger.test.ts",
    "src\tests\device.test.ts",
    "src\tests\evaluator.test.ts",
    "src\tests\history.test.ts",
    "src\tests\mcp.test.ts",
    "src\tests\settings.test.ts",
    "src\tests\theme-manager.test.ts"
)

$rsFiles = @(
    "src-tauri\src\main.rs",
    "src-tauri\src\lib.rs",
    "src-tauri\src\commands.rs",
    "src-tauri\src\voice.rs",
    "src-tauri\src\math\mod.rs",
    "src-tauri\src\parser\mod.rs",
    "src-tauri\src\mcp\mod.rs",
    "src-tauri\src\settings\mod.rs",
    "src-tauri\src\history\mod.rs"
)

Write-Host "🗑️ 移除代码注释工具" -ForegroundColor Cyan
Write-Host ""

$processedCount = 0
$totalFiles = $tsFiles.Count + $rsFiles.Count

foreach ($file in $tsFiles + $rsFiles) {
    $fullPath = Join-Path $Path $file
    
    if (-not (Test-Path $fullPath)) {
        Write-Host "⚠️  跳过 $file (文件不存在)" -ForegroundColor Yellow
        continue
    }
    
    $processedCount++
    Write-Host "[$processedCount/$totalFiles] 处理 $file..." -ForegroundColor Gray
    
    $content = Get-Content $fullPath -Raw -Encoding UTF8
    $cleaned = Remove-Comments -Content $content
    
    if ($Preview) {
        Write-Host "  预览模式：将移除 $((($content -split "`n").Count) - (($cleaned -split "`n").Count)) 行注释" -ForegroundColor Yellow
    } else {
        $cleaned | Out-File $fullPath -Encoding UTF8 -NoNewline
        Write-Host "  ✅ 完成" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✨ 处理完成：$processedCount/$totalFiles 个文件" -ForegroundColor Green

if ($Preview) {
    Write-Host ""
    Write-Host "💡 这是预览模式。运行 'npm run remove-comments' 执行实际移除。" -ForegroundColor Cyan
}
