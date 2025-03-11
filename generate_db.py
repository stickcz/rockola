import os
import json
import sys
import platform

def get_music_folder():
    """
    Solicita al usuario que ingrese la carpeta raíz donde están las canciones.
    Valida que la carpeta exista antes de proceder.
    """
    system_os = platform.system().lower()
    example_path = "D:\\Musica" if system_os == "windows" else "/mnt/disco/musica"

    while True:
        print("Por favor, ingresa la ruta completa de la carpeta donde están tus canciones.")
        print(f"Ejemplo en {system_os.capitalize()}: {example_path}")
        music_folder = input("Ruta: ").strip()

        if os.path.isdir(music_folder):
            return music_folder
        else:
            print(f"Error: La carpeta '{music_folder}' no existe. Intenta de nuevo.")

def generate_song_db(music_folder):
    """
    Genera la base de datos de canciones a partir de la carpeta especificada.
    """
    songs = []
    song_id = 1  # Inicia desde 1

    for genre in sorted(os.listdir(music_folder)):
        genre_path = os.path.join(music_folder, genre)
        if os.path.isdir(genre_path):
            for artist in sorted(os.listdir(genre_path)):
                artist_path = os.path.join(genre_path, artist)
                if os.path.isdir(artist_path):
                    for file in sorted(os.listdir(artist_path)):
                        if file.lower().endswith((".mp3", ".mp4", ".avi", ".mpg", ".mpeg")):
                            # Ruta relativa con barras normales (/)
                            relative_path = os.path.join(genre, artist, file).replace("\\", "/")
                            song_entry = {
                                "id": f"{song_id:05d}",
                                "genre": genre,
                                "artist": artist,
                                "title": os.path.splitext(file)[0],
                                "path": relative_path
                            }
                            songs.append(song_entry)
                            song_id += 1

    db_path = "db.json"
    with open(db_path, "w", encoding="utf-8") as f:
        json.dump(songs, f, indent=4, ensure_ascii=False)

    print(f"Base de datos de canciones generada con éxito en '{db_path}'")
    print(f"Total de canciones registradas: {len(songs)}")
    return songs

def update_startup_file(music_folder):
    """
    Actualiza o crea el archivo de inicio según el sistema operativo, solo para Electron.
    """
    system_os = platform.system().lower()
    if system_os == "windows":
        startup_file = "start-rockola.bat"
        music_folder_win = music_folder.replace('/', '\\')
        startup_content = (
            "@echo off\n"
            "title Rockola Digital\n"
            "\n"
            ":: Establecer la variable de entorno MUSIC_DIR\n"
            f"set MUSIC_DIR={music_folder_win}\n"
            "\n"
            ":: Iniciar Electron directamente\n"
            "npx electron main.js\n"
            "\n"
            ":: Mantener la ventana abierta para ver posibles errores\n"
            "pause\n"
        )
    elif system_os == "linux":
        startup_file = "start-rockola.sh"
        startup_content = (
            "#!/bin/bash\n"
            "# Rockola Digital Startup Script\n"
            "\n"
            f"export MUSIC_DIR=\"{music_folder}\"\n"
            "\n"
            "# Iniciar Electron directamente\n"
            "npx electron main.js &\n"
            "\n"
            "echo \"Rockola iniciada. Presiona Ctrl+C para salir.\"\n"
            "wait\n"
        )
    else:
        raise OSError(f"Sistema operativo no soportado: {system_os}")

    with open(startup_file, "w", encoding="utf-8") as f:
        f.write(startup_content)

    if system_os == "linux":
        os.chmod(startup_file, 0o755)

    print(f"Archivo '{startup_file}' actualizado con MUSIC_DIR={music_folder}")

def main():
    system_os = platform.system().lower()
    print(f"Generador de base de datos y configurador para Rockola Digital ({system_os.capitalize()})")
    print("-------------------------------------------------------")
    
    music_folder = get_music_folder()
    generate_song_db(music_folder)
    update_startup_file(music_folder)

    print(f"\nConfiguración completada. Para ejecutar la rockola:")
    if system_os == "windows":
        print("Haz doble clic en 'start-rockola.bat'.")
    elif system_os == "linux":
        print("Ejecuta './start-rockola.sh' en la terminal.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nProceso cancelado por el usuario.")
        sys.exit(0)
    except Exception as e:
        print(f"Error inesperado: {e}")
        sys.exit(1)