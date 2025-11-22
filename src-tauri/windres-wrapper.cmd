@echo off
setlocal enabledelayedexpansion
set "args="
:parse
if "%~1"=="" goto :run
set "arg=%~1"
:: Replace backslashes with forward slashes for MinGW compatibility
set "arg=!arg:\=/!"
set "args=!args! "!arg!""
shift
goto :parse

:run
:: Use llvm-rc if available, or windres with specific flags
C:\msys64\ucrt64\bin\windres.exe --use-temp-file %args%
