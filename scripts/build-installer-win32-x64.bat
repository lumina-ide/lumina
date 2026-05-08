@echo off
echo.
echo ========================================
echo  Lumina - Build Installer Win32 x64
echo ========================================
echo.

echo [1/3] Building Lumina win32-x64...
call npm run gulp vscode-win32-x64
if %errorlevel% neq 0 (
    echo ERROR: Build failed.
    exit /b %errorlevel%
)

echo.
echo [2/3] Copying inno_updater tools...
call npm run gulp vscode-win32-x64-inno-updater
if %errorlevel% neq 0 (
    echo ERROR: inno-updater failed.
    exit /b %errorlevel%
)

echo.
echo [3/3] Building installer...
call npm run gulp vscode-win32-x64-user-setup
if %errorlevel% neq 0 (
    echo ERROR: Installer build failed.
    exit /b %errorlevel%
)

echo.
echo ========================================
echo  Done! Installer at:
echo  .build\win32-x64\user-setup\
echo ========================================
echo.
