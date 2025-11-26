@echo off
setlocal enabledelayedexpansion
echo === WINDRES CALLED === > C:\Users\liang\Desktop\789\mcp\src-tauri\windres-debug.txt
echo 当前时间: %DATE% %TIME% >> C:\Users\liang\Desktop\789\mcp\src-tauri\windres-debug.txt
echo Wrapper called with arguments: %* >> C:\Users\liang\Desktop\789\mcp\src-tauri\windres-debug.txt
echo Wrapper location: %~f0 >> C:\Users\liang\Desktop\789\mcp\src-tauri\windres-debug.txt
echo Out directory (from cargo): %OUT_DIR% >> C:\Users\liang\Desktop\789\mcp\src-tauri\windres-debug.txt
echo. >> C:\Users\liang\Desktop\789\mcp\src-tauri\windres-debug.txt

set "args="
:parse
if "%~1"=="" goto :run
set "arg=%~1"
echo Raw arg: !arg! >> C:\Users\liang\Desktop\789\mcp\src-tauri\windres-debug.txt
:: 修复路径：将 Windows 路径转换为 MSYS2 兼容的 Unix 风格路径
set "arg=!arg:\=/!"
echo Converted arg: !arg! >> C:\Users\liang\Desktop\789\mcp\src-tauri\windres-debug.txt
set "args=!args! "!arg!""
shift
goto :parse

:run
echo. >> C:\Users\liang\Desktop\789\mcp\src-tauri\windres-debug.txt
echo Final args: %args% >> C:\Users\liang\Desktop\789\mcp\src-tauri\windres-debug.txt
echo Running: C:\msys64\ucrt64\bin\windres.exe --use-temp-file %args% >> C:\Users\liang\Desktop\789\mcp\src-tauri\windres-debug.txt
echo. >> C:\Users\liang\Desktop\789\mcp\src-tauri\windres-debug.txt
C:\msys64\ucrt64\bin\windres.exe --use-temp-file %args% 2>&1 >> C:\Users\liang\Desktop\789\mcp\src-tauri\windres-debug.txt
