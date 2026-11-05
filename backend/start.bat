@echo off
cd /d "%~dp0"
echo Starting Fresco FastAPI Backend on 0.0.0.0:8000...
.\.venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

