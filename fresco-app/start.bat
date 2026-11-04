@echo off
set PATH=C:\Program Files\nodejs;C:\Program Files\Git\cmd;%PATH%
cd /d "%~dp0"
echo Starting Fresco Expo Dev Server...
npx expo start -c
