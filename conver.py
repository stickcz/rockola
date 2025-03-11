import os
import subprocess
import shutil
from tqdm import tqdm
from multiprocessing import Pool

source_folder = 'G:/rockola/entral1.8'
destination_folder = 'D:/convertida'

def check_video_codec(file_path):
    """Verifica si el video ya usa H.264"""
    try:
        result = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_name', 
                                '-of', 'default=noprint_wrappers=1:nokey=1', file_path], 
                                capture_output=True, text=True)
        return 'h264' in result.stdout.lower()
    except:
        return False

def process_file(args):
    """Procesar un archivo individual con optimización GPU"""
    source_file, dst_folder = args
    relative_path = os.path.relpath(source_file, source_folder)
    dest_file = os.path.join(dst_folder, relative_path)
    dest_dir = os.path.dirname(dest_file)
    
    if not os.path.exists(dest_dir):
        os.makedirs(dest_dir, exist_ok=True)
    
    video_extensions = ('.mpg', '.mp4', '.avi', '.mov', '.wmv')
    audio_extensions = ('.mp3', '.wav', '.flac', '.ogg')
    file_ext = source_file.lower().split('.')[-1]
    
    if source_file.lower().endswith(video_extensions):
        dest_file = dest_file.rsplit('.', 1)[0] + '.mp4'
        if os.path.exists(dest_file):
            return f"Omitiendo {os.path.basename(source_file)}: ya existe"
        
        # Si es MP4 con H.264, copiar directamente
        if file_ext == 'mp4' and check_video_codec(source_file):
            try:
                shutil.copy2(source_file, dest_file)
                return f"Copiado video compatible {os.path.basename(source_file)}"
            except Exception as e:
                return f"Error copiando {os.path.basename(source_file)}: {e}"
        
        # Usar NVENC para codificación rápida con GPU
        command = ['ffmpeg', '-i', source_file, '-c:v', 'h264_nvenc', '-preset', 'p1', 
                   '-c:a', 'mp3', dest_file, '-y']
        try:
            subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return f"Convertido video (GPU) {os.path.basename(source_file)}"
        except subprocess.CalledProcessError:
            # Fallback a CPU si NVENC falla
            command = ['ffmpeg', '-i', source_file, '-c:v', 'libx264', '-preset', 'ultrafast', 
                       '-c:a', 'mp3', dest_file, '-y']
            try:
                subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                return f"Convertido video (CPU) {os.path.basename(source_file)}"
            except subprocess.CalledProcessError as e:
                return f"Error convirtiendo {os.path.basename(source_file)}: {e}"
    
    elif source_file.lower().endswith(audio_extensions):
        dest_file = dest_file.rsplit('.', 1)[0] + '.mp3'
        if os.path.exists(dest_file):
            return f"Omitiendo {os.path.basename(source_file)}: ya existe"
        
        try:
            if file_ext == 'mp3':
                shutil.copy2(source_file, dest_file)
                return f"Copiado audio {os.path.basename(source_file)}"
            else:
                command = ['ffmpeg', '-i', source_file, '-c:a', 'mp3', '-preset', 'ultrafast', 
                           dest_file, '-y']
                subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                return f"Convertido audio {os.path.basename(source_file)}"
        except Exception as e:
            return f"Error procesando {os.path.basename(source_file)}: {e}"
    
    return f"Omitiendo {os.path.basename(source_file)}: formato no soportado"

def convert_files(src_folder, dst_folder):
    if not os.path.exists(dst_folder):
        os.makedirs(dst_folder)
    
    # Recolectar archivos
    files_to_process = [os.path.join(root, file) for root, _, files in os.walk(src_folder) 
                        for file in files]
    total_files = len(files_to_process)
    if total_files == 0:
        print("No se encontraron archivos para procesar.")
        return
    
    # Usar todos los hilos lógicos (8 en tu caso)
    num_workers = 8
    print(f"Usando {num_workers} trabajadores paralelos (CPU) + GPU NVENC")
    
    # Procesar en paralelo
    with Pool(num_workers) as pool:
        results = list(tqdm(pool.imap(process_file, [(f, dst_folder) for f in files_to_process]), 
                           total=total_files, desc="Progresando", unit="archivo"))
    
    # Estadísticas
    processed = sum(1 for r in results if "Convertido" in r or "Copiado" in r)
    omitted = sum(1 for r in results if "Omitiendo" in r)
    errors = sum(1 for r in results if "Error" in r)
    
    print(f"\nProceso completado!")
    print(f"Archivos procesados: {processed}")
    print(f"Archivos omitidos: {omitted}")
    print(f"Errores: {errors}")

if __name__ == "__main__":
    convert_files(source_folder, destination_folder)