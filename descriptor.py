import os
import time
from pathlib import Path

def combine_project_files(output_file="combined_project.txt", root_dir="."):
    """
    Combina archivos relevantes de un proyecto en un solo archivo de texto, omitiendo bases de datos.
    
    Parameters:
    - output_file: Nombre del archivo de salida
    - root_dir: Directorio raíz del proyecto (por defecto, directorio actual)
    """
    # Extensiones de archivo que queremos incluir
    valid_extensions = ('.js', '.html', '.css')
    
    # Archivos/directorios a ignorar
    ignore_dirs = {'node_modules', 'dist', '.git', '__pycache__'}
    ignore_files = {'package-lock.json', 'db.json', output_file}
    
    # Patrones de archivos a omitir (como bases de datos)
    ignore_patterns = ('db', 'data', 'backup')
    
    try:
        with open(output_file, 'w', encoding='utf-8') as outfile:
            # Escribir encabezado
            outfile.write(f"# Proyecto Completo - Generado el {time.ctime(time.time())}\n")
            outfile.write("# Estructura y contenido de archivos clave (sin bases de datos)\n\n")
            
            # Recorrer el directorio raíz
            for root, dirs, files in os.walk(root_dir):
                # Filtrar directorios ignorados
                dirs[:] = [d for d in dirs if d not in ignore_dirs]
                
                # Procesar cada archivo
                for file in files:
                    # Verificar si el archivo tiene extensión válida y no está en la lista de ignorados
                    if (file.endswith(valid_extensions) and 
                        file not in ignore_files and 
                        not any(pattern in file.lower() for pattern in ignore_patterns)):
                        file_path = os.path.join(root, file)
                        relative_path = os.path.relpath(file_path, root_dir)
                        
                        # Escribir separador y nombre del archivo
                        outfile.write(f"\n{'='*80}\n")
                        outfile.write(f"# Archivo: {relative_path}\n")
                        outfile.write(f"{'='*80}\n\n")
                        
                        # Leer y escribir el contenido del archivo
                        try:
                            with open(file_path, 'r', encoding='utf-8') as infile:
                                content = infile.read()
                                outfile.write(content)
                                outfile.write("\n")
                        except Exception as e:
                            outfile.write(f"# Error al leer el archivo: {e}\n")
            
            # Incluir package.json por separado ya que es importante para la estructura
            package_path = os.path.join(root_dir, 'package.json')
            if os.path.exists(package_path):
                outfile.write(f"\n{'='*80}\n")
                outfile.write("# Archivo: package.json\n")
                outfile.write(f"{'='*80}\n\n")
                with open(package_path, 'r', encoding='utf-8') as package_file:
                    outfile.write(package_file.read())
                    outfile.write("\n")
            
            outfile.write(f"\n{'='*80}\n")
            outfile.write("# Fin del proyecto\n")
            
        print(f"Archivo combinado generado con éxito: {output_file}")
        print(f"Tamaño del archivo: {os.path.getsize(output_file)} bytes")
        
    except Exception as e:
        print(f"Error al generar el archivo combinado: {e}")

def main():
    # Obtener el directorio actual
    current_dir = os.getcwd()
    
    # Preguntar al usuario si quiere usar otro directorio
    print(f"Directorio actual: {current_dir}")
    change_dir = input("¿Quieres especificar otro directorio? (s/n): ").lower()
    
    if change_dir == 's':
        new_dir = input("Ingresa la ruta del directorio del proyecto: ")
        if os.path.isdir(new_dir):
            combine_project_files(root_dir=new_dir)
        else:
            print("Directorio no válido. Usando directorio actual.")
            combine_project_files()
    else:
        combine_project_files()

if __name__ == "__main__":
    main()