@echo off
setlocal enabledelayedexpansion

:: 收集所有参数并转换路径
set "converted_args="
:parse_args
if "%~1"=="" goto :run_windres

set "arg=%~1"

:: 检查参数是否包含路径（包含 : 或 \）
echo !arg! | findstr /C:":" /C:"\" >nul
if !errorlevel! equ 0 (
    :: 转换 Windows 路径为 MSYS2 兼容格式
    :: 将 C:\path\to\file 转换为 /c/path/to/file
    set "arg=!arg:\=/!"
    set "arg=!arg:C:=/c!"
    set "arg=!arg:c:=/c!"
    set "arg=!arg:D:=/d!"
    set "arg=!arg:d:=/d!"
)

set "converted_args=!converted_args! !arg!"
shift
goto :parse_args

:run_windres
:: 使用 MSYS2 的 windres，并添加 --use-temp-file 选项
C:\msys64\ucrt64\bin\windres.exe --use-temp-file %converted_args%
exit /b %errorlevel%
