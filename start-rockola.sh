#!/bin/bash
# Rockola Digital Startup Script

# Establecer la variable de entorno MUSIC_DIR
export MUSIC_DIR="/mnt/disco/musica"
export PORT=3000

# Iniciar el servidor en segundo plano
node server.js &

# Esperar 2 segundos para que el servidor esté listo
sleep 2

# Iniciar Electron
node node_modules/electron/dist/electron main.js &

# Mantener el script corriendo (opcional, para depuración)
echo "Rockola iniciada. Presiona Ctrl+C para salir."
wait