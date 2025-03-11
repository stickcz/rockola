@echo off
title Rockola Digital

:: Establecer la variable de entorno MUSIC_DIR
set MUSIC_DIR=D:\musica_convertida

:: Iniciar Electron directamente
npx electron main.js

:: Mantener la ventana abierta para ver posibles errores
pause
