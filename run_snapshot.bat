@echo off
powershell.exe -ExecutionPolicy Bypass -File "%~dp0\create_snapshot.ps1"
echo Snapshot created!
pause