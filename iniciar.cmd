@echo off
setlocal
cd /d "%~dp0"
set "ASTRIA_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "ASTRIA_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "node_modules\vite\bin\vite.js" (
  echo Faltan las dependencias. Consulta README.md para preparar el proyecto.
  pause
  exit /b 1
)
echo Astria se abrira en el navegador. Mantene esta ventana abierta mientras jugas.
"%ASTRIA_NODE%" "node_modules\vite\bin\vite.js" --host 127.0.0.1 --open
if errorlevel 1 pause
