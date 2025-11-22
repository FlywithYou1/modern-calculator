@echo off
setlocal enabledelayedexpansion
set "args="
:parse
if "%~1"=="" goto :run
set "arg=%~1"
set "arg=!arg:\=/!"
set "args=!args! "!arg!""
shift
goto :parse

:run
C:\msys64\ucrt64\bin\windres.exe --use-temp-file %args%
