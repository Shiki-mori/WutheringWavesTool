@echo off
rem Source: WuWa Tracker - https://wuwatracker.com/zh-CN/import
rem Script: https://github.com/wuwatracker/wuwatracker/blob/747a48b1b994baa9c372a4fb933ea7588428bd4b/import.ps1
setlocal
powershell.exe -NoProfile -Command "try { iwr -UseBasicParsing -Headers @{'User-Agent'='Mozilla/5.0'} https://raw.githubusercontent.com/wuwatracker/wuwatracker/747a48b1b994baa9c372a4fb933ea7588428bd4b/import.ps1 -ErrorAction Stop | iex } catch { Write-Error $_; exit 1 }"
set "result=%errorlevel%"
pause
exit /b %result%
