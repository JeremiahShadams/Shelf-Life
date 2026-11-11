@echo off
cd /d "%~dp0"
title Fresco AI Backend (MobileNetV2 + FastAPI)
echo ========================================================
echo   Starting Fresco AI Backend on 0.0.0.0:8000
echo   Model: MobileNetV2 (44 classes, 22 produce varieties)
echo ========================================================
echo.

if exist ".\.venv\Scripts\activate.bat" (
    call .\.venv\Scripts\activate.bat
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
) else (
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
)

if errorlevel 1 (
    echo.
    echo [ERROR] Backend crashed or failed to start.
    pause
)
