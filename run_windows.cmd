@echo off
setlocal
powershell.exe -NoProfile -File "%~dp0scripts\windows-runtime.ps1" -Action Start
set "result=%errorlevel%"
if not "%result%"=="0" pause
exit /b %result%
