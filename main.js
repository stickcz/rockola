const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const path = require('path');
const fs = require('fs');

const MUSIC_DIR = process.env.MUSIC_DIR || process.argv[2] || 'D:\\musica_convertida';
if (!fs.existsSync(MUSIC_DIR)) {
    console.error(`La carpeta de música "${MUSIC_DIR}" no existe.`);
    process.exit(1);
}

let songsDatabase = [];
try {
    const dbPath = path.join(__dirname, 'db.json');
    if (fs.existsSync(dbPath)) {
        songsDatabase = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } else {
        console.error("Archivo db.json no encontrado.");
    }
} catch (error) {
    console.error("Error al cargar la base de datos:", error);
}

const backgroundVideos = [
    { id: "bg1", path: "1.mp4" },
    { id: "bg2", path: "2.mp4" },
    { id: "bg3", path: "3.mp4" }
];
const promoVideo = { path: "rockola.mp4" };

function createWindow() {
    let win = new BrowserWindow({
        width: 1280,
        height: 720,
        fullscreen: true,
        kiosk: true,
        webPreferences: { 
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        frame: false,
        alwaysOnTop: true
    });
    win.webContents.openDevTools();
    win.loadFile(path.join(__dirname, 'public/index.html'));
    win.on('closed', () => {
        win = null;
        app.quit();
    });
}

function registerProtocols() {
    protocol.registerFileProtocol('rockola', (request, callback) => {
        const url = request.url.substr(10);
        let filePath;
        
        if (url.startsWith('musicac/')) {
            const relativePath = url.replace('musicac/', '');
            filePath = path.join(MUSIC_DIR, relativePath);
            console.log(`Intentando servir archivo de música: ${filePath}`);
        
        } else if (url.startsWith('promo/')) {
            filePath = path.join(__dirname, 'promo', url.replace('promo/', ''));
        } else if (url.startsWith('background/')) {
            filePath = path.join(__dirname, 'background', url.replace('background/', ''));
        } else {
            filePath = path.join(__dirname, 'public', url);
        }
        
        console.log(`Sirviendo archivo: ${filePath}`);
        callback({ path: filePath });
    });
}

app.whenReady().then(() => {
    registerProtocols();
    createWindow();
});

ipcMain.handle('get-songs', (event, { page = 1, limit = 20, genre = '' }) => {
    let songs = [...songsDatabase].sort((a, b) => a.id.localeCompare(b.id));
    let totalSongs = songs.length;
    
    if (genre) {
        songs = songs.filter(song => song.genre === genre);
        totalSongs = songs.length;
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const results = songs.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalSongs / limit);
    
    return {
        totalSongs,
        totalPages,
        currentPage: parseInt(page),
        songs: results
    };
});

ipcMain.handle('get-genres', () => {
    const genres = [...new Set(songsDatabase.map(song => song.genre))].sort();
    return genres;
});

ipcMain.handle('get-all-songs', () => {
    return songsDatabase;
});

ipcMain.handle('get-background-video', () => {
    return backgroundVideos[Math.floor(Math.random() * backgroundVideos.length)];
});

ipcMain.handle('get-promo-video', () => {
    return { path: promoVideo.path };
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});