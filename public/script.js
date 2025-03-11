document.addEventListener("DOMContentLoaded", async function () {
    const songList = document.getElementById("songs");
    const searchInput = document.getElementById("search");
    const videoPlayer = document.getElementById("videoPlayer");
    const prevButton = document.getElementById("prevPage");
    const nextButton = document.getElementById("nextPage");
    const genreDisplay = document.getElementById("genreDisplay");
    const creditsElement = document.getElementById("credits");
    const noCreditsOverlay = document.getElementById("noCreditsOverlay");
    const notification = document.getElementById("notification");
    const currentSongDisplay = document.getElementById("currentSong");
    const nextSongsDisplay = document.getElementById("nextSongs");

    let allSongs = [];
    let songsData = [];
    let currentPage = 1;
    let totalPages = 1;
    const limit = 26;
    let currentGenre = '';
    let genres = [];
    let genreIndex = 0;
    let playlist = [];
    let isPlaying = false;
    let credits = 1;
    let holdTimer = null;
    let currentAudioPlayer = null;
    let isHoldActive = false;

    document.addEventListener('mousemove', (event) => {
        if (event.target !== searchInput && event.target !== prevButton && event.target !== nextButton) {
            event.preventDefault();
        }
    });

    document.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        credits++;
        creditsElement.textContent = credits;
        checkCredits();
        searchInput.focus();
    });

    document.addEventListener('click', (event) => {
        if (playlist.length > 0 && isPlaying && event.target !== prevButton && event.target !== nextButton) {
            console.log("Clic izquierdo: Intentando siguiente canción");
            stopCurrentPlayback();
            playNextSong();
        }
    });

    document.addEventListener('keydown', (event) => {
        const key = event.key;
        if (/^[0-9]$/.test(key)) {
            event.preventDefault();
            if (document.activeElement !== searchInput) searchInput.focus();
            searchInput.value += key;
            searchInput.dispatchEvent(new Event('input'));
        } else if (key === '-') {
            event.preventDefault();
            if (genreIndex > 0) {
                genreIndex--;
                currentGenre = genres[genreIndex];
                currentPage = 1;
                fetchSongs(currentPage, currentGenre);
            }
        } else if (key === '+') {
            event.preventDefault();
            if (genreIndex < genres.length - 1) {
                genreIndex++;
                currentGenre = genres[genreIndex];
                currentPage = 1;
                fetchSongs(currentPage, currentGenre);
            }
        } else if (key === '/') {
            event.preventDefault();
            if (currentPage > 1) {
                currentPage--;
                fetchSongs(currentPage, '');
            }
        } else if (key === '*') {
            event.preventDefault();
            if (currentPage < totalPages) {
                currentPage++;
                fetchSongs(currentPage, '');
            }
        } else if (key === 'Enter') {
            event.preventDefault();
            if (searchInput.value.length > 0) {
                searchInput.value = searchInput.value.slice(0, -1);
                searchInput.dispatchEvent(new Event('input'));
            }
        } else if (key === '.') {
            event.preventDefault();
            if (!isHoldActive) {
                isHoldActive = true;
                holdTimer = setTimeout(() => {
                    if (playlist.length > 0 && isPlaying) {
                        console.log("Punto: Avanzando a siguiente canción");
                        stopCurrentPlayback();
                        playNextSong();
                    }
                    isHoldActive = false;
                }, 5000);
            }
        } else if (!['Backspace'].includes(key)) {
            event.preventDefault();
        }
    });

    document.addEventListener('keyup', (event) => {
        if (event.key === '.') {
            clearTimeout(holdTimer);
            isHoldActive = false;
        }
    });

    async function fetchGenres() {
        try {
            console.log("Intentando cargar géneros...");
            if (!window.electronAPI) {
                console.error("electronAPI no está definido");
                throw new Error("electronAPI no está disponible");
            }
            genres = await window.electronAPI.getGenres();
            console.log("Géneros cargados:", genres);
            if (genres.length === 0) {
                console.warn("No se encontraron géneros en la base de datos");
                genres = ['Todos'];
            }
            genreIndex = 0;
            currentGenre = genres[0];
            updateGenreDisplay();
        } catch (error) {
            console.error("Error en fetchGenres:", error.message);
            showNotification("Error al cargar géneros");
            genres = ['Todos'];
            currentGenre = genres[0];
            updateGenreDisplay();
        }
    }

    async function fetchAllSongs() {
        try {
            console.log("Cargando todas las canciones...");
            allSongs = await window.electronAPI.getAllSongs();
            console.log("Canciones cargadas:", allSongs);
            totalPages = Math.ceil(allSongs.length / limit);
            if (allSongs.length === 0) {
                console.warn("No se cargaron canciones desde la base de datos");
                showNotification("No hay canciones disponibles");
            }
        } catch (error) {
            console.error("Error en fetchAllSongs:", error);
            showNotification("Error al cargar canciones");
        }
    }

    async function fetchSongs(page, genre) {
        try {
            if (genre && genre !== 'Todos') {
                const data = await window.electronAPI.getSongs({ page, limit, genre });
                songsData = data.songs;
                totalPages = data.totalPages;
                currentPage = data.currentPage;
            } else {
                songsData = allSongs.slice((page - 1) * limit, page * limit);
                totalPages = Math.ceil(allSongs.length / limit);
                currentPage = page;
            }
            console.log("Canciones renderizadas para página", currentPage, ":", songsData);
            renderSongs(songsData);
            updateGenreDisplay();
        } catch (error) {
            console.error("Error en fetchSongs:", error);
            showNotification("Error al cargar canciones");
        }
    }

    function renderSongs(songs) {
        songList.innerHTML = "";
        songs.forEach(song => {
            const li = document.createElement("li");
            li.textContent = `${song.id} - ${song.artist} - ${song.title}`;
            songList.appendChild(li);
        });
    }

    function updateGenreDisplay() {
        genreDisplay.textContent = `Género actual: ${currentGenre || 'Todos'}`;
    }

    async function addToPlaylist(path) {
        if (credits > 0) {
            console.log("Añadiendo a playlist:", path);
            playlist.push(path);
            console.log("Playlist actual:", playlist);
            credits--;
            creditsElement.textContent = credits;
            checkCredits();
            updateNextSongs();
            if (!isPlaying) {
                console.log("No hay reproducción activa, iniciando playNextSong...");
                playNextSong();
            }
        } else {
            showNoCreditsOverlay();
            checkCredits();
        }
    }

    function stopCurrentPlayback() {
        if (currentAudioPlayer) {
            currentAudioPlayer.pause();
            currentAudioPlayer.remove();
            currentAudioPlayer = null;
        }
        if (videoPlayer.src) {
            videoPlayer.pause();
            videoPlayer.src = '';
            videoPlayer.load();
        }
    }

    function playNextSong() {
        if (playlist.length > 0) {
            console.log("Reproduciendo próxima canción de la playlist...");
            stopCurrentPlayback();
            const nextSong = playlist.shift();
            console.log("Canción seleccionada:", nextSong);
            playSong(nextSong);
            updateNextSongs();
        } else {
            isPlaying = false;
            stopCurrentPlayback();
            checkCredits();
            console.log("Playlist vacía, deteniendo reproducción");
        }
    }

    async function playSong(path) {
        const videoPath = `rockola://musicac/${encodeURIComponent(path)}`;
        console.log(`Intentando reproducir: ${videoPath}`);
        videoPlayer.src = videoPath;
        try {
            await videoPlayer.play();
            console.log("Reproducción iniciada con éxito");
            videoPlayer.onended = () => {
                console.log("Video terminado");
                playNextSong();
            };
        } catch (error) {
            console.error("Error al reproducir el video:", error);
            playNextSong();
        }
    }
    function updateCurrentSongDisplay(path) {
        const song = allSongs.find(s => s.path === path) || { id: "N/A", title: "Desconocido", artist: "Desconocido" };
        currentSongDisplay.textContent = `Reproduciendo: ${song.id} - ${song.artist} - ${song.title}`;
    }

    function updateNextSongs() {
        console.log("Actualizando lista de próximas canciones...");
        nextSongsDisplay.innerHTML = "";
        if (playlist.length === 0) {
            console.log("Playlist vacía, no hay canciones para mostrar");
            return;
        }
        playlist.slice(0, 6).forEach((path, index) => {
            const song = allSongs.find(s => s.path === path) || { id: "N/A", title: "Desconocido", artist: "Desconocido" };
            const li = document.createElement("li");
            li.textContent = `${index + 1}. ${song.id} - ${song.artist} - ${song.title}`;
            nextSongsDisplay.appendChild(li);
            console.log(`Añadido a la lista: ${li.textContent}`);
        });
    }

    async function checkCredits() {
        if (credits === 0) {
            enterFullScreen();
            disableControls();
            songList.style.display = 'none';
            if (playlist.length === 0) {
                try {
                    const promo = await window.electronAPI.getPromoVideo();
                    videoPlayer.src = `rockola://promo/${encodeURIComponent(promo.path)}`;
                    videoPlayer.loop = true;
                    videoPlayer.load();
                    await videoPlayer.play();
                    isPlaying = false;
                } catch (error) {
                    console.error(error);
                    showNotification("Error al cargar video promocional");
                }
            }
        } else {
            exitFullScreen();
            enableControls();
            songList.style.display = 'block';
            videoPlayer.loop = false;
            if (!isPlaying && playlist.length > 0) playNextSong();
        }
    }

    function enterFullScreen() {
        if (videoPlayer.requestFullscreen) videoPlayer.requestFullscreen();
    }

    function exitFullScreen() {
        if (document.fullscreenElement) document.exitFullscreen();
    }

    function disableControls() {
        searchInput.disabled = true;
        prevButton.disabled = true;
        nextButton.disabled = true;
    }

    function enableControls() {
        searchInput.disabled = false;
        prevButton.disabled = false;
        nextButton.disabled = false;
        searchInput.focus();
    }

    function showNoCreditsOverlay() {
        noCreditsOverlay.style.display = 'flex';
        setTimeout(() => noCreditsOverlay.style.display = 'none', 2000);
    }

    function showNotification(message) {
        notification.textContent = message;
        notification.style.display = 'block';
        setTimeout(() => notification.style.display = 'none', 2000);
    }

    searchInput.addEventListener("input", async function () {
        const query = searchInput.value.toLowerCase();
        if (query.length === 5) {
            console.log("Buscando canción con ID:", query);
            const song = allSongs.find(s => s.id === query);
            if (song) {
                console.log("Canción encontrada:", song);
                addToPlaylist(song.path);
                showNotification(`Canción ${song.title} añadida`);
            } else {
                console.log("Canción no encontrada para ID:", query);
                showNotification("Canción no encontrada");
            }
            searchInput.value = "";
            renderSongs(songsData);
        }
    });

    prevButton.addEventListener("click", function () {
        if (currentPage > 1) {
            currentPage--;
            fetchSongs(currentPage, '');
        }
    });

    nextButton.addEventListener("click", function () {
        if (currentPage < totalPages) {
            currentPage++;
            fetchSongs(currentPage, '');
        }
    });

    async function initializeApp() {
        try {
            console.log("Inicializando aplicación...");
            await fetchAllSongs();
            await fetchGenres();
            await fetchSongs(currentPage, '');
            console.log("Aplicación inicializada con éxito");
        } catch (error) {
            console.error("Error al inicializar la aplicación:", error);
        }
    }

    initializeApp();
});