const { contextBridge, ipcRenderer } = require('electron');

// Exponer funciones seguras a la página web
contextBridge.exposeInMainWorld('electronAPI', {
    // API para obtener canciones con paginación y filtrado
    getSongs: (params) => ipcRenderer.invoke('get-songs', params),
    
    // API para obtener todos los géneros musicales
    getGenres: () => ipcRenderer.invoke('get-genres'),
    
    // API para obtener la lista completa de canciones (para búsqueda local)
    getAllSongs: () => ipcRenderer.invoke('get-all-songs'),
    
    // API para obtener un video de fondo aleatorio
    getBackgroundVideo: () => ipcRenderer.invoke('get-background-video'),
    
    // API para obtener el video promocional
    getPromoVideo: () => ipcRenderer.invoke('get-promo-video')
});
