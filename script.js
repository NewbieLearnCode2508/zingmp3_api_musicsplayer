// script.js: Tương tác với API và điều khiển trình phát nhạc

// --- 1. DOM Elements ---
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const showFavoritesBtn = document.getElementById('showFavoritesBtn');
const playFavoritesBtn = document.getElementById('playFavoritesBtn');
const autoNextToggle = document.getElementById('autoNextToggle');
const resultsDiv = document.getElementById('results');

// Các element của player
const player = document.getElementById('player');
const playerThumb = document.getElementById('playerThumb');
const playerTitle = document.getElementById('playerTitle');
const playerArtist = document.getElementById('playerArtist');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const rewindBtn = document.getElementById('rewindBtn');
const forwardBtn = document.getElementById('forwardBtn');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const durationTimeEl = document.getElementById('durationTime');
const volumeSlider = document.getElementById('volumeSlider');

// --- 2. Cấu hình cơ bản ---
// Nếu mở bằng Live Server (:5500), tự gọi API từ Express server (:3000).
// Nếu mở trực tiếp từ Express thì giữ đường dẫn tương đối.
const API_BASE_URL = window.location.port === '3000' ? '' : 'http://localhost:3000';

let currentSongList = [];      // Mảng lưu danh sách bài hát hiện tại
let currentSongIndex = 0;      // Chỉ số bài hát đang phát
let audio = new Audio();        // Đối tượng Audio của trình duyệt
let isPlaying = false;
let favoriteSongs = loadFavoriteSongs();
let activeListMode = 'search';

function loadFavoriteSongs() {
    try {
        const raw = localStorage.getItem('zingmp3_favorites');
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function saveFavoriteSongs() {
    localStorage.setItem('zingmp3_favorites', JSON.stringify(favoriteSongs));
}

function isFavoriteSong(song) {
    return favoriteSongs.some((item) => item.encodeId === song.encodeId);
}

function toggleFavoriteSong(song) {
    if (!song?.encodeId) return;
    const existingIndex = favoriteSongs.findIndex((item) => item.encodeId === song.encodeId);
    if (existingIndex >= 0) {
        favoriteSongs.splice(existingIndex, 1);
    } else {
        favoriteSongs.unshift(song);
    }
    saveFavoriteSongs();
    if (activeListMode === 'favorites') {
        displaySongs(favoriteSongs, { mode: 'favorites' });
    } else {
        displaySongs(currentSongList, { mode: activeListMode });
    }
}

// --- 3. Các hàm gọi API (SỬ DỤNG PROXY) ---
async function searchSongs(keyword) {
    // Hiển thị trạng thái đang tải
    resultsDiv.innerHTML = `<div class="placeholder"><i class="fas fa-spinner fa-pulse"></i> Đang tìm kiếm "${keyword}"...</div>`;

    try {
        // Gọi API tìm kiếm thông qua proxy
        // Endpoint mẫu: ${API_BASE_URL}/api/search?keyword=...
        // Tham khảo cấu trúc của gói nuxtify-api hoặc các API tương tự
        const response = await axios.get(`${API_BASE_URL}/api/search`, {
            params: { keyword }
        });

        // Xử lý cấu trúc dữ liệu trả về (cần điều chỉnh theo API thực tế)
        if (response.data && response.data.data && response.data.data.items) {
            activeListMode = 'search';
            displaySongs(response.data.data.items, { mode: 'search' });
        } else {
            throw new Error('Không tìm thấy kết quả');
        }
    } catch (error) {
        console.error('Lỗi tìm kiếm:', error);
        const detail = error?.response?.data?.error || error.message;
        resultsDiv.innerHTML = `<div class="placeholder">❌ Không thể tải dữ liệu. Vui lòng thử lại sau.<br><small>Chi tiết: ${detail}</small></div>`;
    }
}

// Hiển thị danh sách bài hát lên giao diện
function displaySongs(songs, options = {}) {
    const mode = options.mode || activeListMode;

    if (!songs || songs.length === 0) {
        const message = mode === 'favorites'
            ? '💖 Danh sách yêu thích đang trống. Hãy bấm tim để thêm bài hát.'
            : '😢 Không tìm thấy bài hát nào. Hãy thử từ khóa khác nhé!';
        resultsDiv.innerHTML = `<div class="placeholder">${message}</div>`;
        currentSongList = songs || [];
        return;
    }

    currentSongList = songs;

    const html = songs.map((song, index) => {
        const thumbnail = song.thumbnail || song.thumb || 'https://via.placeholder.com/120';
        const artists = song.artistsNames || song.artists?.map(a => a.name).join(', ') || 'Không rõ';
        const liked = isFavoriteSong(song);

        return `
            <div class="song-card" data-index="${index}">
                <img class="song-img" src="${thumbnail}" alt="thumbnail" onerror="this.src='https://via.placeholder.com/120'">
                <div class="song-info">
                    <div class="song-row">
                        <div class="song-title">${song.title || 'Không có tiêu đề'}</div>
                        <button class="favorite-btn ${liked ? 'active' : ''}" data-fav-index="${index}" title="Thêm vào yêu thích">
                            <i class="${liked ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                    </div>
                    <div class="song-artist">${artists}</div>
                </div>
            </div>
        `;
    }).join('');

    resultsDiv.innerHTML = html;

    document.querySelectorAll('.song-card').forEach((card) => {
        card.addEventListener('click', () => {
            const idx = parseInt(card.dataset.index, 10);
            playSongAtIndex(idx);
        });
    });

    document.querySelectorAll('.favorite-btn').forEach((btn) => {
        btn.addEventListener('click', (event) => {
            event.stopPropagation();
            const idx = parseInt(btn.dataset.favIndex, 10);
            toggleFavoriteSong(currentSongList[idx]);
        });
    });
}

// --- 4. Hàm phát nhạc ---
async function playSongAtIndex(index) {
    if (!currentSongList[index]) return;

    currentSongIndex = index;
    const song = currentSongList[index];

    // Cập nhật giao diện player
    playerTitle.textContent = song.title || 'Không có tiêu đề';
    const artists = song.artistsNames || song.artists?.map(a => a.name).join(', ') || 'Đang cập nhật...';
    playerArtist.textContent = artists;
    const thumb = song.thumbnail || song.thumb || 'https://via.placeholder.com/50';
    playerThumb.src = thumb;

    // Lấy link stream thực tế
    try {
        // Giả sử API có endpoint để lấy link stream dựa trên encodeId
        const streamUrl = await getStreamingUrl(song.encodeId);
        if (streamUrl) {
            audio.src = streamUrl;
            audio.play().then(() => {
                isPlaying = true;
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            }).catch(err => {
                console.error('Không thể phát nhạc:', err);
                alert('Không thể phát bài hát này. Có thể do lỗi bản quyền hoặc link đã hỏng.');
            });
        } else {
            throw new Error('Không lấy được link phát nhạc');
        }
    } catch (error) {
        console.error('Lỗi lấy stream:', error);
        const detail = error?.response?.data?.error || 'Không thể lấy link phát nhạc cho bài này.';
        alert(detail);
    }
}

// Hàm lấy link stream (cần điều chỉnh theo API thực tế)
async function getStreamingUrl(encodeId) {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/stream`, {
            params: { id: encodeId }
        });

        if (response.data && response.data.data && response.data.data.streamUrl) {
            return response.data.data.streamUrl;
        }

        return null;
    } catch (error) {
        console.error('Lỗi lấy stream URL:', error);
        return null;
    }
}

// --- 5. Điều khiển trình phát ---
function togglePlay() {
    if (!audio.src) {
        // Nếu chưa có bài nào được chọn thì tự động chọn bài đầu tiên trong danh sách
        if (currentSongList.length > 0) {
            playSongAtIndex(0);
        } else {
            alert('Hãy tìm kiếm và chọn một bài hát trước.');
        }
        return;
    }

    if (isPlaying) {
        audio.pause();
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        audio.play();
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }
    isPlaying = !isPlaying;
}

function playNext() {
    if (currentSongList.length === 0) return;
    let nextIndex = currentSongIndex + 1;
    if (nextIndex >= currentSongList.length) nextIndex = 0;
    playSongAtIndex(nextIndex);
}

function playPrev() {
    if (currentSongList.length === 0) return;
    let prevIndex = currentSongIndex - 1;
    if (prevIndex < 0) prevIndex = currentSongList.length - 1;
    playSongAtIndex(prevIndex);
}

function setVolume() {
    audio.volume = volumeSlider.value / 100;
}

function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateProgressUI() {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
        progressBar.value = 0;
        currentTimeEl.textContent = '00:00';
        durationTimeEl.textContent = '00:00';
        return;
    }

    const progressPercent = (audio.currentTime / audio.duration) * 100;
    progressBar.value = Math.min(100, Math.max(0, progressPercent));
    currentTimeEl.textContent = formatTime(audio.currentTime);
    durationTimeEl.textContent = formatTime(audio.duration);
}

function seekProgress() {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const seekTime = (progressBar.value / 100) * audio.duration;
    audio.currentTime = seekTime;
}

function skipByFive(seconds) {
    if (!audio.src) return;
    const target = audio.currentTime + seconds;
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
        audio.currentTime = Math.max(0, target);
        return;
    }
    audio.currentTime = Math.min(audio.duration, Math.max(0, target));
}

// Xử lý khi bài hát kết thúc để tự động phát bài tiếp theo (nếu bật)
audio.addEventListener('ended', () => {
    if (autoNextToggle.checked) {
        playNext();
        return;
    }

    isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
});

audio.addEventListener('timeupdate', updateProgressUI);
audio.addEventListener('loadedmetadata', updateProgressUI);
audio.addEventListener('durationchange', updateProgressUI);

// --- 6. Khởi tạo sự kiện và chạy ứng dụng ---
searchBtn.addEventListener('click', () => {
    const keyword = searchInput.value.trim();
    if (keyword === '') {
        alert('Vui lòng nhập tên bài hát hoặc ca sĩ.');
        return;
    }
    searchSongs(keyword);
});

// Cho phép nhấn Enter để tìm kiếm
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

playBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', playNext);
prevBtn.addEventListener('click', playPrev);
rewindBtn.addEventListener('click', () => skipByFive(-5));
forwardBtn.addEventListener('click', () => skipByFive(5));
progressBar.addEventListener('input', seekProgress);
volumeSlider.addEventListener('input', setVolume);

showFavoritesBtn.addEventListener('click', () => {
    activeListMode = 'favorites';
    displaySongs(favoriteSongs, { mode: 'favorites' });
});

playFavoritesBtn.addEventListener('click', () => {
    if (!favoriteSongs.length) {
        alert('Danh sách yêu thích đang trống.');
        return;
    }

    activeListMode = 'favorites';
    displaySongs(favoriteSongs, { mode: 'favorites' });
    playSongAtIndex(0);
});

// Khởi tạo âm lượng và UI mặc định
audio.volume = volumeSlider.value / 100;
updateProgressUI();

// Gợi ý tìm kiếm mặc định khi tải trang (tùy chọn)
// searchSongs('bui truong linh'); // Bỏ comment nếu muốn tự động tìm kiếm khi vào trang