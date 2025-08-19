// ==UserScript==
// @name         Simple player
// @namespace    http://hajaulee.github.io/anytv-web/
// @version      1.0.43.30
// @description  A simpler player for movie webpage.
// @author       Haule
// @match        https://*/*
// @grant        GM.getValue
// @grant        GM.setValue
// @inject-into  content
// @run-at      document-start
// ==/UserScript==

const VERSION = "1.0.43";

// ============================
// #region TEMPLATE HTML
// ============================

// Template chính cho giao diện người dùng
const MAIN_TEMPLATE = /* html */ `
    <div class="h-main-container">
        <!-- Màn hình chính -->
        <div id="main-screen">
            <div class="header">
                <button class="icon-button" onclick="location.href='https://hajaulee.github.io/anytv-web/'">〈</button>
                <span style="flex: 1 1 auto"></span>
                <button id="open-search-button" class="icon-button">🔍</button>
                <div class="menu-container">
                    <button id="open-menu-button"class="icon-button">⋮</button>
                    <div class="menu" id="main-menu">
                        <button id="open-setting-btn" class="menu-item">Cài đặt</button>
                        <button id="show-version-btn" class="menu-item">Phiên bản</button>
                    </div>
                </div>
            </div>
            <div class="content-container">
                <h2 class="category-header">Thích</h2>
                <div id="favorite-movies" class="movie-list"></div>
                <h2 class="category-header">Mới</h2>
                <div id="latest-movies" class="movie-list"></div>
                <h2 class="category-header">Hot</h2>
                <div id="popular-movies" class="movie-list"></div>
            </div>
        </div>

        <!-- Màn hình tìm kiếm -->
        <div id="search-screen" style="display: none">
            <div class="header">
                <button id="search-back-button" class="icon-button" >〈</button>
                <input id="search-keyword-input" placeholder="Nhập từ khóa..." class="input-search" autofocus>
                <button id="search-button" class="icon-button">🔍</button>
            </div>
            <div class="content-container">
                <div id="search-filters-container" class="search-filters-container"></div>
                <h2 class="category-header">Kết quả tìm kiếm</h2>
                <div id="search-movies" class="movie-list"></div>
            </div>
        </div>

        <!-- Màn hình cài đặt -->
        <div id="setting-screen" style="display: none">
            <div class="header">
                <button id="setting-back-button" class="icon-button" >〈</button>
                <span style="flex: 1 1 auto"></span>
                <button id="save-setting-button" class="icon-button">💾</button>
            </div>
            <div class="content-container">
            </div>
        </div>

        <!-- Màn hình chi tiết phim -->
        <div id="detail-movie-screen" style="display: none">
            <div class="header detail-movie-header">
                <button id="detail-back-button" class="icon-button">〈</button>
                <span style="flex: 1 1 auto"></span>
                <button id="detail-refresh-button" class="icon-button">↻</button>
            </div>
            <div class="content-container detail-movie-container">
                <div class="detail-movie-info">
                    <div id="detail-movie-bg"></div>
                    <img id="detail-movie-image">
                    <div id="detail-movie-title"></div>
                    <div id="detail-movie-genres"></div>
                    <div class="detail-movie-action-container">
                        <button id="add-favorite" class="detail-movie-action">Yêu thích</button>
                        <button id="remove-favorite" class="detail-movie-action" style="display: none">Bỏ thích</button>
                    </div>
                    <div id="detail-movie-description"></div>
                </div>
                <div class="episode-list"></div>
            </div>
        </div>

        <!-- Màn hình trình phát phim -->
        <div id="player-screen" class="screen" style="display: none">
            <div class="cover"></div>
            <div class="float-movie-player">
                <div class="header player-header">
                    <button id="player-back-button" class="icon-button">〈</button>
                    <span id="player-title"></span>
                </div>
                <iframe id="player-iframe" src="" class="player-iframe" frameborder="0"></iframe>
            </div>
        </div>

        <!-- Màn hình loading -->
        <div id="loading-screen" class="cover" style="display: none">
            <span class="loader"></span>
        </div>

        <!-- Snackbar thông báo -->
        <div id="snackbar">Some text some message..</div>
    </div>
`;

// Template cho danh sách phim đang chờ tải dự liệu
const MOVIE_LIST_PLACEHOLDER_TEMPLATE = /* html */ `
    <div class="card-movie-placeholder"><span class="loader"></span></div>
    <div class="card-movie-placeholder"><span class="loader"></span></div>
    <div class="card-movie-placeholder"><span class="loader"></span></div>
`;

// Template cho thẻ phim
const MOVIE_CARD_TEMPLATE = /* html */ `
<div class="card-movie" style="width: calc({{thumbnailRatio}} * max(25dvh, 192px) - 48px)">
  <img src="{{cardImageUrl}}" alt="{{title}}"/>
  <p class="card-badge">{{watchingEpisode}}{{latestEpisode}}</p>
  <div class="movie-title">{{title}}</div>
  <div class="movie-genres">{{genres}} &nbsp;</div>
</div>
`;

// Template cho tập phim
const EPISODE_TEMPLATE = /* html */ `
<div class="movie-episode">
    <div class="movie-episode-title">{{title}}</div>
    <div class="movie-episode-watched-time"></div>
</div>
`;

// ============================
// #endregion
// ============================


// ============================
// #region STYLES (CSS)
// ============================

const STYLES = /* css */ `
    /* CSS cho giao diện */
    html, body {
        overflow: hidden;
        width: 100dvw;
        height: 100dvh;
        padding: 0;
        margin: 0;
    }

    .h-main-container {
        position: fixed;
        width: 100dvw;
        height: 100dvh;
        z-index: 999999;
        top: 0;
        left: 0;
        padding: 0;
        background: #252728;
        color: white;
        // opacity: 0.5;
    }

    .screen {
        width: 100dvw;
        height: 100dvh;
    }

    .category-header {
        color: white;
        font-weight: bold;
        font-size: 24px;
        margin-top: 5px;
    }

    .movie-list {
        overflow-x: auto;
        overflow-y: hidden;
        white-space: nowrap;
        height: max(26dvh, 200px);
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
    }

    .movie-list::-webkit-scrollbar {
        display: none; /* Chrome, Safari, and Opera */
    }

    .movie-list .card-movie {
        margin-right: 1em;
    }

    .card-movie {
        height: max(25dvh, 192px);
        display: inline-block;
        position: relative;
        background-color: blue;
        color: white;
        border-radius: 5px;
    }

    .card-movie-placeholder {
        height: 145px;
        display: inline-block;
        position: relative;
        width: 117px;
        margin-right: 1em;
    }

    .card-movie-placeholder .loader {
        position: absolute;
    }

    .card-movie .card-badge {
        top: 0.5em;
        position: absolute;
        right: 0.5em;
        background: green;
        color: white;
        padding: 0.3em;
        border-radius: 0.2em;
        opacity: 0.9;
    }

    .card-movie img {
        border-radius: 5px;
        height: calc(100% - 48px);
        width: 100%;
        object-fit: cover;
    }

    .movie-title {
        padding: 2px 5px;
        overflow: hidden;
        text-shadow: 1px 1px 2px #252728;
        font-size: 16px;
    }

    .movie-genres {
        padding: 2px 5px;
        overflow: hidden;
        font-size: 12px;
    }

    .menu-container {
        position: relative;
        display: inline-block;
    }

    .menu {
        display: none;
        position: absolute;
        background-color: #323243;
        min-width: 160px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        z-index: 1;
        border-radius: 5px;
        top: 25px;
        right: 25px;
    }

    .menu-item {
        color: white;
        padding: 12px 16px;
        text-decoration: none;
        display: block;
        text-align: left;
        width: 100%;
        background: transparent;
        padding: 5px 14px;
        margin: 0;
        font-size: 18px;
        border: 0;
    }

    .menu-item:hover {
        background-color: #575757;
    }

    .setting-field input[type="checkbox"] {
        display: inline-block;
        width: 2.5em;
        height: 1.5em;
    }

    .setting-field label {
        display: inline-block;
        margin-left: 5px;
        font-size: 14px;
        color: white;
        padding-top: .625rem;
        padding-bottom: .625rem;
    }

    .setting-field input {
        width: 100%;
        padding: 5px;
        margin: 5px 0;
        border-radius: 5px;
        border: 1px solid #ccc;
        background-color: #f9f9f9;
        color: #333;
        height: 2.5em;
        outline: none;
     }


    .input-search {
        color: white;
        background: transparent;
        padding: 0;
        margin: 0;
        margin-left: 10px;
        outline: none;
        border: none;
        width: 100%;
    }

    .search-filters-container {
        padding: 5px;
        background: #323243;
        border-radius: 5px;
        margin: 5px 0;
    }

    .filter-content-container {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        background: #323243;
    }

    .filter-container select {
        background: transparent;
        color: white;
        border: 1px solid grey;
        border-radius: 3px;
        line-height: normal;
        height: 2.5em;
        display: block;
        padding: .5rem 1rem;
    }

    .filter-container option {
        background: #323243;
        color: white;
    }

    .filter-notice {
        color: lightgreen;
        font-size: 12px;
        margin: 5px 0;
    }

    #detail-movie-screen {
        width: 100dvw;
        height: 100dvh;
    }

    .header {
        height: 36px;
        overflow: visible;
        display: flex;
        align-items: center;
        padding: 0 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .content-container {
        width: 100dvw;
        padding: 0 10px;
        height: calc(100dvh - 36px);
        overflow-y: auto;
    }

    .detail-movie-container {
        display: flex;
        flex-wrap: wrap;
    }

    .detail-movie-info {
        width: min(500px, 100vw);
        position: relative;
    }
    #detail-movie-bg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-size: cover;
        filter: blur(8px);
        z-index: -1;
        opacity: 0.5;
    }
    #detail-movie-image {
        height: 33dvh;
        width: 100%;
        object-fit: contain;
    }
    #detail-movie-title {
        text-align: center;
        font-size: 24px;
    }
    #detail-movie-genres {
        text-align: center;
    }
    .detail-movie-action-container {
        display: flex;
        justify-content: center;
        padding: 5px;
    }

    .detail-movie-action {
        background: #323243;
        border: 0;
        height: 40px;
        border-radius: 5px;
        padding: 5px 10px;
        margin: 0;
        line-height: 0;
        font-size: 14px;
        color: white;
    }

    .episode-list {
        flex: 1 1 auto;
        padding: 1em;
        overflow-y: auto;
    }
    .movie-episode {
        height: 56px;
        cursor: pointer;
    }
    .movie-episode-title {
        font-size: 16px;
    }
    .movie-episode-watched-time {
        font-size: 12px;
    }
    .movie-episode-watched {
        opacity: 0.5;
    }
    .movie-episode-watching {
        font-weight: bold;
        color: lightgreen;
    }

    .cover {
        position: fixed;
        top: 0;
        left: 0;
        width: 100dvw;
        height: 100dvh;
        overflow: hidden;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .float-movie-player {
        position: absolute;
        top: max(10dvh, 10dvw);
        left: 5dvw;
        width: 90dvw;
        height: min(80dvh, 80dvw);
        border-radius: 20px;
        overflow: hidden;
        background-color: rgba(0, 0, 0, 0.7);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .player-header {
        padding-left: 10px;
        cursor: grab;
    }

    #player-title {
        margin-left: 10px;
    }

    .player-iframe {
        width: 100%;
        height: calc(100% - 36px);
        position: absolute;
    }

    .icon-button {
        border-radius: 20px !important;
        height: 34px;
        background-color: transparent;
        font-size: 16px;
        width: 34px;
        padding: 0;
        margin: 0;
        border: 0;
        color: white;
    }

    .load-more-button {
        font-size: 100px;
        width: 16dvh;
        height: max(25dvh, 192px);
        background: #122332;
        border-radius: 10px !important;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        vertical-align: top;
        border: 0;
        color: white;
    }

    #snackbar {
        visibility: hidden;
        min-width: 250px;
        background-color: #333;
        color: #fff;
        text-align: center;
        border-radius: 2px;
        padding: 16px;
        position: fixed;
        z-index: 1;
        left: 50%;
        bottom: 30px;
        font-size: 17px;
        transform: translateX(-50%);
      }

      #snackbar.show {
        visibility: visible;
        -webkit-animation: fadein 0.5s, fadeout 0.5s 2.5s;
        animation: fadein 0.5s, fadeout 0.5s 2.5s;
      }

      @-webkit-keyframes fadein {
        from {bottom: 0; opacity: 0;}
        to {bottom: 30px; opacity: 1;}
      }

      @keyframes fadein {
        from {bottom: 0; opacity: 0;}
        to {bottom: 30px; opacity: 1;}
      }

      @-webkit-keyframes fadeout {
        from {bottom: 30px; opacity: 1;}
        to {bottom: 0; opacity: 0;}
      }

      @keyframes fadeout {
        from {bottom: 30px; opacity: 1;}
        to {bottom: 0; opacity: 0;}
      }

      /* CSS for loading spinner */
      .loader {
        width: 120px;
        height: 150px;
        background-color: #fff;
        background-repeat: no-repeat;
        background-image: linear-gradient(#ddd 50%, #bbb 51%),
          linear-gradient(#ddd, #ddd), linear-gradient(#ddd, #ddd),
          radial-gradient(ellipse at center, #aaa 25%, #eee 26%, #eee 50%, #0000 55%),
          radial-gradient(ellipse at center, #aaa 25%, #eee 26%, #eee 50%, #0000 55%),
          radial-gradient(ellipse at center, #aaa 25%, #eee 26%, #eee 50%, #0000 55%);
        background-position: 0 20px, 45px 0, 8px 6px, 55px 3px, 75px 3px, 95px 3px;
        background-size: 100% 4px, 1px 23px, 30px 8px, 15px 15px, 15px 15px, 15px 15px;
        position: relative;
        border-radius: 6%;
        animation: shake 3s ease-in-out infinite;
        transform-origin: 60px 180px;
      }
      .loader:before {
        content: "";
        position: absolute;
        left: 5px;
        top: 100%;
        width: 7px;
        height: 5px;
        background: #aaa;
        border-radius: 0 0 4px 4px;
        box-shadow: 102px 0 #aaa;
      }

      .loader:after {
        content: "";
        position: absolute;
        width: 95px;
        height: 95px;
        left: 0;
        right: 0;
        margin: auto;
        bottom: 20px;
        background-color: #bbdefb;
        background-image:
          linear-gradient( to right, #0004 0%, #0004 49%, #0000 50%, #0000 100% ),
          linear-gradient(135deg, #64b5f6 50%, #607d8b 51%);
        background-size: 30px 100%, 90px 80px;
        border-radius: 50%;
        background-repeat: repeat, no-repeat;
        background-position: 0 0;
        box-sizing: border-box;
        border: 10px solid #DDD;
        box-shadow: 0 0 0 4px #999 inset, 0 0 6px 6px #0004 inset;
        animation: spin 3s ease-in-out infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg) }
        50% { transform: rotate(360deg) }
        75% { transform: rotate(750deg) }
        100% { transform: rotate(1800deg) }
      }
      @keyframes shake {
        65%, 80%, 88%, 96% { transform: rotate(0.5deg) }
        50%, 75%, 84%, 92% { transform: rotate(-0.5deg) }
        0%, 50%, 100%  { transform: rotate(0) }
      }
`;

// ============================
// #endregion
// ============================

// ============================
// #region CÁC HÀM TIỆN ÍCH
// ============================

function fillTemplate(template, obj) {
    let content = template;
    Object.keys(obj).forEach(key => {
        content = content.replaceAll(`{{${key}}}`, obj[key] ?? '');
    })
    return content;
}

function createDom(content) {
    const templateDiv = document.createElement('div');
    templateDiv.innerHTML = content;
    return templateDiv.firstElementChild;
}

function toastMsg(msg) {
    var x = document.getElementById("snackbar");
    x.className = "show";
    x.innerHTML = msg;
    setTimeout(function () { x.className = x.className.replace("show", ""); }, 3000);
}

function setIntervalImmediate(func, interval) {
    func();
    return setInterval(func, interval);
}

function tryUtil(func, interval, timeout) {
    let result = func();
    let totalTime = 0;
    if (!result) {
        const timer = setInterval(() => {
            let result1 = func();
            totalTime += interval;
            if (result1 || totalTime > timeout) {
                clearInterval(timer);
            }
        }, interval);
    }
}

function removeEmptyValues(obj) {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, value]) => value != null && value !== '')
    );
}

function zeroPad(num, size) {
    return String(num).padStart(size, '0');
}

function formatDuration(duration) {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = Math.floor(duration % 60);
    return `${hours > 0 ? zeroPad(hours, 2) + ':' : ''}${zeroPad(minutes, 2) + ':'}${zeroPad(seconds, 2)}`;
}

async function addMainStyle() {
    // Add the styles to the document
    const styleTag = document.createElement('style');
    styleTag.textContent = STYLES;
    return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
            if (document.head) {
                clearInterval(interval);
                document.head.appendChild(styleTag);
                resolve(true);
            }
        }, 100);
    });
}
function addMainTemplate() {
    // Add the template to the body
    setIntervalImmediate(() => {
        if (!document.querySelector('.h-main-container')) {
            const templateDiv = document.createElement('div');
            templateDiv.innerHTML = MAIN_TEMPLATE;
            if (document.body) {
                document.body.appendChild(templateDiv.firstElementChild);
            } else if (document.documentElement) {
                document.documentElement.appendChild(templateDiv.firstElementChild);
            }

            if (document.querySelector('.h-main-container')){
                // Emit event to notify that the main template is loaded
                document.dispatchEvent(new Event("MainTemplateLoaded"));
            }
        }
    }, 1000);
}

function showLoadingScreen() {
    document.getElementById("loading-screen").style.display = 'flex';
}

function hideLoadingScreen() {
    document.getElementById("loading-screen").style.display = 'none';
}

async function loadDataFromSharedStorage(key, defaultValue) {
    return new Promise(async (resolve, reject) => {
        try {
            const value = await GM.getValue(key, defaultValue);
            if (window.anytvSetting){
                const setting = window.anytvSetting;
                if (setting.enableSync.value){
                    const url = setting.syncUrl.value + '/' + setting.syncKey.value + '/' + key + '.json';
                    fetch(url, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(response => {
                        if (response.ok) {
                            return response.json();
                        } else {
                            throw new Error('Network response was not ok');
                        }
                    }).then(data => {
                        resolve(data ?? value ?? defaultValue);
                    })
                } else{
                    resolve(value ?? defaultValue);
                }
            } else{
                resolve(value ?? defaultValue);
            }
        } catch (error) {
            reject(error);
        }
    });
}

async function saveDataToSharedStorage(key, value, skipCheckFrequency) {
    return new Promise((resolve, reject) => {
        try {
            GM.setValue(key, value);
            if (window.anytvSetting){
                const setting = window.anytvSetting;
                if (!skipCheckFrequency){
                    if (
                        window.latestSyncTime &&
                        window.latestSyncTime > new Date().getTime() - 60000
                    ) {
                        console.log("Sync running frequency too high.");
                        window.skippedSyncData = {
                        ...window.skippedSyncData,
                            [key]: value,
                        }
                        console.log(window.skippedSyncData)
                        return;
                    }
                }
                if (setting.enableSync.value){
                    const url = setting.syncUrl.value + '/' + setting.syncKey.value + '/' + key + '.json';
                    fetch(url, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(value)
                    }).then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        window.latestSyncTime = new Date().getTime();
                        if (window.skippedSyncData){
                            window.skippedSyncData[key] = null;
                        }
                    })
                }
            }
            resolve(true);
        } catch (error) {
            reject(error);
        }
    });
}

function syncDataSyncOnClose(){
    const setting = window.anytvSetting;
    if (setting?.enableSync?.value && window.skippedSyncData){
        Object.keys(window.skippedSyncData).forEach(key => {
            const value = window.skippedSyncData[key];
            if (value) {
                const url = setting.syncUrl.value + '/' + setting.syncKey.value + '/' + key + '.json';
                fetch(url, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        keepalive: true,
                        body: JSON.stringify(value)
                    }).then();
            }
        })
    }
}

function httpGetSync(url) {
    // Get data from the URL synchronously
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, false); // false makes the request synchronous

    xhr.send(null);
    if (xhr.status === 200) {
        return xhr.responseText;
    } else {
        console.error("Error fetching data:", xhr.statusText);
        return null;
    }
}

function makeFloatMoviePlayerDraggable() {
    const player = document.querySelector('.float-movie-player');
    const header = document.querySelector('.player-header');
    if (!player || !header) return;

    let isDragging = false;
    let startX, startY, startLeft, startTop;

    header.style.cursor = 'grab';

    // Use pointer events for both mouse and touch
    header.addEventListener('pointerdown', function(e) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = player.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;
        document.body.style.userSelect = 'none';
        header.setPointerCapture(e.pointerId);
        header.style.cursor = 'grabbing';
    });

    header.addEventListener('pointermove', function(e) {
        if (!isDragging) return;
        let dx = e.clientX - startX;
        let dy = e.clientY - startY;
        player.style.left = (startLeft + dx) + 'px';
        player.style.top = (startTop + dy) + 'px';
        player.style.right = '';
        player.style.bottom = '';
        player.style.position = 'fixed';
    });

    header.addEventListener('pointerup', function(e) {
        if (isDragging) {
            isDragging = false;
            document.body.style.userSelect = '';
            header.releasePointerCapture(e.pointerId);
            header.style.cursor = 'grab';
        }
    });

    // Prevent scrolling while dragging on touch
    header.addEventListener('touchmove', function(e) {
        if (isDragging) e.preventDefault();
    }, { passive: false });
}

// ============================
// #endregion
// ============================


// ============================
// #region NGUỒN DỮ LIỆU
// ============================

class BaseSource {

    name = "Base";
    thumbnailRatio = 0.75;
    needBypassIframe = false;
    baseUrl = "https://abc.xyz";

    // POPULAR MOVIES
    popularMovieRequest(page) { return null }
    popularMovieUrl(page) { return null }
    popularMoviesParse(doc) { return null }
    popularMovieSelector() { return null }
    popularMovieFromElement(e) { return null }

    // LATEST MOVIES
    latestMovieRequest(page) { return null }
    latestMovieUrl(page) { return null }
    latestMoviesParse(doc) { return null }
    latestMovieSelector() { return null }
    latestMovieFromElement(element) { return null }

    // SEARCH MOVIES
    filterConfig() { return null }
    searchMovieRequest(keyword, filters, page) { return null }
    searchMovieUrl(keyword, filters, page) { return null }
    searchMoviesParse(doc) { return null }
    searchMovieSelector() { return null }
    searchMovieFromElement(e) { return null }


    // MOVIE DETAIL
    movieDetailParse(doc) { return null }
    relatedMoviesParse(doc) { return null }

    // EPISODES
    firstEpisodeUrl(doc) { return null }
    episodesParse(doc) { return null }
    episodeSelector() { return null }
    episodeFromElement(e) { return null }

    // PLAYER
    moviePlayerSelector() { return "video" }
    moviePlayerContainerSelector() { return this.moviePlayerSelector() }
    onMoviePageLoadedJavascript() { return null }

    movieServerSelector() { return null }
}

class Animet extends BaseSource {

    name = "Animet";
    thumbnailRatio = 0.75;
    baseUrl = "https://anime7.site";

    // POPULAR MOVIES
    popularMovieUrl(page) {
        return `${this.baseUrl}/bang-xep-hang/month.html`;
    }
    popularMovieSelector() { return "li.group" }
    popularMovieFromElement(e) {
        const movieUrl = e.querySelector("a").getAttribute("href")
        const title = e.querySelector(".title-item")?.textContent?.trim()
        const episodeText = e.querySelector(".mli-eps")?.textContent?.trim()

        const match = episodeText?.match(/\d+/);
        const episodeNum = match ? parseInt(match[0], 10) : null;

        return {
            latestEpisode: episodeNum,
            title: title,  //Title
            description: "",
            genres: '',
            movieUrl: movieUrl,
            cardImageUrl: e.querySelector("img").getAttribute("src"),  // Bg Image
            backgroundImageUrl: e.querySelector("img").getAttribute("src") // Card image
        }
    }


    // LATEST MOVIES
    latestMovieUrl(page) {
        return `${this.baseUrl}/danh-sach/phim-moi-cap-nhat/trang-${page}.html`;
    }

    latestMovieSelector() {
        return "li.TPostMv";
    }

    latestMovieFromElement(e) {
        const movieUrl = e.querySelector("a").getAttribute("href")
        const title = e.querySelector(".Title").textContent?.trim()
        const description = e.querySelector(".Description p")?.textContent?.trim() ?? ""
        const genres = [...e.querySelectorAll(".Genre a")].map(it => it.textContent?.trim()).join(", ")
        const episodeText = e.querySelector(".mli-eps")?.textContent;

        const match = episodeText?.match(/\d+$/);
        const episodeNum = match ? parseInt(match[0], 10) : null;

        return {
            latestEpisode: episodeNum,
            title: title,  //Title
            description: description,
            genres: genres,
            movieUrl: movieUrl,
            cardImageUrl: e.querySelector("img").getAttribute("src"),  // Bg Image
            backgroundImageUrl: e.querySelector("img").getAttribute("src") // Card image
        }
    }

    // SEARCH MOVIES
    filterConfig() {
        return {
            values: {
                genre: {
                    label: "Thể loại",
                    options: [
                        { value: "", label: "" },
                        { value: "seinen", label: "Seinen" },
                        { value: "ac-quy", label: "Ác Quỷ" },
                        { value: "am-nhac", label: "Âm Nhạc" },
                        { value: "anime", label: "Anime" },
                        { value: "bao-luc", label: "Bạo Lực" },
                        { value: "bi-an", label: "Bí Ẩn" },
                        { value: "bi-an-sieu-nhien", label: "Bíẩn - Siêu nhiên" },
                        { value: "cars", label: "Cars" },
                        { value: "cartoon", label: "Cartoon" },
                        { value: "cgdct", label: "CGDCT" },
                        { value: "chien-tranh", label: "Chiến Tranh" },
                        { value: "cn-animation", label: "CN Animation" },
                        { value: "co-trang", label: "Cổ Trang" },
                        { value: "dementia", label: "Dementia" },
                        { value: "di-gioi", label: "Dị Giới" },
                        { value: "drama", label: "Drama" },
                        { value: "du-hanh-thoi-gian", label: "Du Hành Thời Gian" },
                        { value: "ecchi", label: "Ecchi" },
                        { value: "game", label: "Game" },
                        { value: "gay-can", label: "Gây cấn" },
                        { value: "gia-tuong", label: "Giả Tưởng" },
                        { value: "gia-dinh", label: "Gia Đình" },
                        { value: "hai-huoc", label: "Hài Hước" },
                        { value: "haiten", label: "Haiten" },
                        { value: "hanh-dong", label: "Hành Động" },
                        { value: "harem", label: "Harem" },
                        { value: "hinh-su", label: "Hình Sự" },
                        { value: "hoan-doi-gioi-tinh", label: "Hoán Đổi Giới Tính" },
                        { value: "hoat-hinh", label: "Hoạt Hình" },
                        { value: "hoc-duong", label: "Học Đường" },
                        { value: "hoi-hop", label: "Hồi hộp" },
                        { value: "huyen-ao", label: "Huyền Ảo" },
                        { value: "huyen-huyen", label: "Huyền Huyễn" },
                        { value: "isekai", label: "Isekai" },
                        { value: "josei", label: "Josei" },
                        { value: "khoa-hoc", label: "Khoa Học" },
                        { value: "kids", label: "Kids" },
                        { value: "kiem-hiep", label: "Kiếm Hiệp" },
                        { value: "kinh-di", label: "Kinh Dị" },
                        { value: "lang-man", label: "Lãng mạn" },
                        { value: "lich-su", label: "Lịch Sử" },
                        { value: "live-action", label: "Live Action" },
                        { value: "ma-ca-rong", label: "Ma Cà Rồng" },
                        { value: "mecha", label: "Mecha" },
                        { value: "movie-ova", label: "Movie & OVA" },
                        { value: "mystery", label: "Mystery" },
                        { value: "ninja", label: "Ninja" },
                        { value: "ona", label: "ONA" },
                        { value: "parody", label: "Parody" },
                        { value: "phep-thuat", label: "Phép Thuật" },
                        { value: "phieu-luu", label: "Phiêu Lưu" },
                        { value: "police", label: "Police" },
                        { value: "quan-doi", label: "Quân Đội" },
                        { value: "samurai", label: "Samurai" },
                        { value: "shoujo", label: "Shoujo" },
                        { value: "shoujo-ai", label: "Shoujo Ai" },
                        { value: "shounen", label: "Shounen" },
                        { value: "shounen-ai", label: "Shounen Ai" },
                        { value: "sieu-nang-luc", label: "Siêu Năng Lực" },
                        { value: "sieu-nhien", label: "Siêu Nhiên" },
                        { value: "special", label: "Special" },
                        { value: "tai-lieu", label: "Tài liệu" },
                        { value: "tam-ly", label: "Tâm Lý" },
                        { value: "than-thoai", label: "Thần Thoại" },
                        { value: "the-gioi-song-song", label: "Thế Giới Song Song" },
                        { value: "the-thao", label: "Thể Thao" },
                        { value: "thriller", label: "Thriller" },
                        { value: "tien-hiep", label: "Tiên Hiệp" },
                        { value: "tieu-thuyet", label: "Tiểu Thuyết" },
                        { value: "tinh-cam", label: "Tình Cảm" },
                        { value: "tinh-tay-ba", label: "Tình Tay Ba" },
                        { value: "tinh-yeu", label: "Tình Yêu" },
                        { value: "tokusatsu", label: "Tokusatsu" },
                        { value: "tragedy", label: "Tragedy" },
                        { value: "trailer", label: "Trailer" },
                        { value: "trinh-tham", label: "Trinh Thám" },
                        { value: "truyen-hinh", label: "Truyền Hình" },
                        { value: "tv-show", label: "TV Show" },
                        { value: "vien-tay", label: "Viễn Tây" },
                        { value: "vien-tuong", label: "Viễn Tưởng" },
                        { value: "vo-thuat", label: "Võ Thuật" },
                        { value: "vu-tru", label: "Vũ Trụ" },
                        { value: "yaoi", label: "Yaoi" },
                        { value: "yuri", label: "Yuri" },
                        { value: "doi-thuong", label: "Đời Thường" }
                    ]
                },
                year: {
                    label: "Năm",
                    options: [
                        { value: "", label: "" }
                    ].concat([...Array(20).keys()].map(it => {
                        const year = new Date().getFullYear() - it;
                        return { value: year, label: year }
                    }))
                }
            },
            notice: "Không thể dùng bộ lọc khi nhập từ khóa tìm kiếm",
        }
    }
    searchMovieUrl(keyword, filters, page) {
        if (keyword) {
            keyword = keyword.replaceAll(" ", "-")
            return `${this.baseUrl}/tim-kiem/${keyword}/trang-${page}.html`;
        } else {
            const genre = filters?.genre ?? "";
            const year = filters?.year ?? "";
            if (genre) {
                return `${this.baseUrl}/the-loai/${genre}/trang-${page}.html`;
            } else if (year) {
                return `${this.baseUrl}/danh-sach/phim-nam-${year}/trang-${page}.html`;
            }
        }
    }
    searchMovieSelector() { return this.latestMovieSelector() }
    searchMovieFromElement(e) { return this.latestMovieFromElement(e) }

    // MOVIE DETAIL
    movieDetailParse(doc) {
        const movie = {}
        movie.description = doc.querySelector(".Description")?.textContent?.trim() ?? ""
        movie.genres = [...doc.querySelectorAll(".InfoList li:nth-child(2) a")].map(it => it.textContent?.trim()).join(", ")
        return movie
    }

    firstEpisodeUrl(doc) {
        return doc.querySelector(".Image a").getAttribute("href")
    }

    episodeSelector() { return "#list-server > div:nth-child(1) a" }

    episodeFromElement(e) {
        return {
            title: e?.textContent?.trim(),
            url: e.getAttribute("href")
        }
    }

    moviePlayerContainerSelector() { return "#watch-block div"; }

    movieServerSelector() { return "#list-server1 .server-item"; }
}

class Phimmoi extends BaseSource {

    name = "Phimmoi"
    thumbnailRatio = 1.7
    baseUrl = "https://phimmoichill.boo";

    // LATEST MOVIES
    latestMovieUrl(page) {
        return `${this.baseUrl}/list/phim-bo/page-${page}/`
    }

    latestMovieSelector() {
        return ".list-film .item.small"
    }

    latestMovieFromElement(e) {
        const movieUrl = e.querySelector("a").getAttribute("href")
        const title = e.querySelector("h3").textContent?.trim()
        const imgUrl = e.querySelector("img").getAttribute("src")
        const episodeText = e.querySelector(".label").textContent?.trim()

        const match = episodeText?.match(/\d+/);
        const episodeNum = match ? parseInt(match[0], 10) : null;

        return {
            latestEpisode: episodeNum,
            title: title,  //Title
            description: "",
            genres: '',
            movieUrl: movieUrl,
            cardImageUrl: imgUrl,  // Bg Image
            backgroundImageUrl: imgUrl // Card image
        }
    }

    // POPULAR MOVIES
    popularMovieUrl(page) {
        return `${this.baseUrl}/list/phim-hot/page-${page}/`
    }

    popularMovieSelector() {
        return this.latestMovieSelector()
    }

    popularMovieFromElement(e) {
        return this.latestMovieFromElement(e)
    }

    // SEARCH MOVIES
    filterConfig() {
        return {
            values: {
                list: {
                    label: 'Danh sách phim',
                    options: [
                        { label: '', value: '' },
                        { label: 'Phim Bộ', value: 'phim-bo' },
                        { label: 'Phim Lẻ', value: 'phim-le' },
                        { label: 'Phim Chiếu Rạp', value: 'phim-chieu-rap' },
                        { label: 'Top IMDB', value: 'top-imdb' },
                        { label: 'Phim Hot', value: 'phim-hot' },
                        { label: 'Phim Netflix', value: 'phim-netflix' },
                        { label: 'Phim DC Comic', value: 'phim-dc' },
                        { label: 'Phim Marvel', value: 'phim-marvel' },
                        { label: 'Phim HD', value: 'phim-hd' }
                    ]
                },
                genre: {
                    label: 'Thể loại',
                    options: [
                        { label: '', value: '' },
                        { label: 'Phim Hành Động', value: 'phim-hanh-dong' },
                        { label: 'Phim Võ Thuật', value: 'phim-vo-thuat' },
                        { label: 'Phim Tình Cảm', value: 'phim-tinh-cam' },
                        { label: 'Phim Hoạt Hình', value: 'phim-hoat-hinh' },
                        { label: 'Phim Hài Hước', value: 'phim-hai-huoc' },
                        { label: 'Phim Viễn Tưởng', value: 'phim-vien-tuong' },
                        { label: 'Phim Cổ Trang', value: 'phim-co-trang' },
                        { label: 'Phim Phiêu Lưu', value: 'phim-phieu-luu' },
                        { label: 'Phim Tâm Lý', value: 'phim-tam-ly' },
                        { label: 'Phim Khoa Học', value: 'phim-khoa-hoc' },
                        { label: 'Phim Hình Sự', value: 'phim-hinh-su' },
                        { label: 'Phim Ma - Kinh Dị', value: 'phim-ma-kinh-di' },
                        { label: 'Phim Chiến Tranh', value: 'phim-chien-tranh' },
                        { label: 'Phim Âm Nhạc', value: 'phim-am-nhac' },
                        { label: 'Phim Thể Thao', value: 'phim-the-thao' },
                        { label: 'Phim Thần Thoại', value: 'phim-than-thoai' },
                        { label: 'Game show', value: 'game-show' },
                        { label: 'Phim Truyền Hình', value: 'phim-truyen-hinh' },
                        { label: 'Phim Chiếu Rạp', value: 'phim-chieu-rap' },
                        { label: 'Phim Anime', value: 'phim-anime' },
                        { label: 'Phim Sắp Chiếu', value: 'phim-sap-chieu' },
                        { label: 'Phim Thuyết Minh', value: 'phim-thuyet-minh' },
                    ]
                },
                country: {
                    label: 'Quốc gia',
                    options: [
                        { label: '', value: '' },
                        { label: 'Phim Trung Quốc', value: 'phim-trung-quoc' },
                        { label: 'Phim Hàn Quốc', value: 'phim-han-quoc' },
                        { label: 'Phim Nhật Bản', value: 'phim-nhat-ban' },
                        { label: 'Phim Âu Mỹ', value: 'phim-au-my' },
                        { label: 'Phim Thái Lan', value: 'phim-thai-lan' },
                        { label: 'Phim Đài Loan', value: 'phim-dai-loan' },
                        { label: 'Phim Tổng Hợp', value: 'phim-tong-hop' },
                        { label: 'Phim Hồng Kông', value: 'phim-hong-kong' },
                        { label: 'Phim Ấn Độ', value: 'phim-an-do' },
                    ]
                }
            },
            notice: "Không thể dùng bộ lọc khi nhập từ khóa tìm kiếm",
        }
    }
    searchMovieUrl(keyword, filters, page) {
        if (keyword) {
            return `${this.baseUrl}/tim-kiem/${keyword.replace(" ", "+")}/page-${page}/`
        } else {
            const genre = filters?.genre ?? "";
            const country = filters?.country ?? "";
            const list = filters?.list ?? "";
            if (genre) {
                return `${this.baseUrl}/genre/${genre}/page-${page}/`
            } else if (country) {
                return `${this.baseUrl}/country/${country}/page-${page}/`
            } else if (list) {
                return `${this.baseUrl}/list/${list}/page-${page}/`
            }
        }
    }

    searchMovieSelector() {
        return this.latestMovieSelector()
    }

    searchMovieFromElement(e) {
        return this.latestMovieFromElement(e)
    }

    // MOVIE DETAIL
    movieDetailParse(doc) {
        const movie = {}
        movie.description = doc.querySelector(".film-content")?.textContent?.trim() ?? ""
        movie.genres = [...doc.querySelector(".entry-meta li:nth-child(4)")?.querySelectorAll("a")].map(it => it.textContent).join(", ")
        return movie
    }

    firstEpisodeUrl(doc) {
        return doc.querySelector(".film-info a").getAttribute("href")
    }

    episodesParse(doc) {
        if (doc.querySelector("#box-player") != null) {
            if (doc.querySelector("#list_episodes") != null) {
                return [...doc.querySelectorAll("#list_episodes a")].map(it => {
                    const episodeText = it.textContent?.trim();
                    const match = episodeText?.match(/\d+/);
                    const episodeNum = match ? parseInt(match[0], 10) : episodeText;
                    return {
                        title: episodeNum,
                        url: it.getAttribute("href")
                    }
                });
            } else {
                return [{ title: "Xem ngay", url: doc.location.href }]
            }
        }
        return []

    }

    episodeSelector() {
        return ""
    }

    episodeFromElement(e) {
        return { title: "", url: "" }
    }

    moviePlayerContainerSelector() { return "#media-player-box"; }

    movieServerSelector() { return "#pm-server"; }
}

/* WIP */
class Rophim extends BaseSource {

    name = "Rpphim";
    thumbnailRatio = 0.764;
    needBypassIframe = true;
    baseUrl = "https://www.rophim.me";
    cardImageRoot = 'https://static.nutscdn.com/vimg/300-0/';
    bgImageRoot = 'https://static.nutscdn.com/vimg/1920-0/';

    // POPULAR MOVIES
    popularMovieUrl(page) {
        const currentYear = new Date().getFullYear();
        return `https://api.rophim.me/v1/movie/filterV2?years=${currentYear},${currentYear - 1}&sort=total_views&page=${page}`
    }
    popularMoviesParse(doc) { return this.latestMoviesParse(doc) }
    popularMovieSelector() { return null }
    popularMovieFromElement(e) { return null }

    // LATEST MOVIES
    latestMovieUrl(page) {
        const currentYear = new Date().getFullYear();
        return `https://api.rophim.me/v1/movie/filterV2?years=${currentYear},${currentYear - 1}&type=2&sort=updated_at&page=${page}`
    }
    latestMoviesParse(doc) {
        const jsonData = doc.querySelector("body").textContent;
        const data = JSON.parse(jsonData);
        if (data.result.items){
            return data.result.items.map(it => {

                return {
                    title: it.title,
                    movieUrl: `${this.baseUrl}/phim/${it.slug}.${it._id}`,
                    cardImageUrl: this.cardImageRoot + it.images.posters[0].path.split("/").slice(-1)[0],
                    backgroundImageUrl: this.bgImageRoot + it.images.backdrops[0].path.split("/").slice(-1)[0],
                    latestEpisode: it.type == 2 ? it.latest_episode[1] : null,
                    description: it.overview,
                    genres: it.genres.map(ge => ge.name).join(", "),
                }
            });
        }
        return []
    }
    latestMovieSelector() { return null }
    latestMovieFromElement(element) { return null }

    // SEARCH MOVIES
    filterConfig() { return null }
    searchMovieUrl(keyword, filters, page) {
        return `https://api.rophim.me/v1/movie/filterV2?sort=updated_at&page=${page}&keyword=${keyword}`
    }
    searchMoviesParse(doc) { return this.latestMoviesParse(doc) }
    searchMovieSelector() { return null }
    searchMovieFromElement(e) { return null }


    // MOVIE DETAIL
    movieDetailParse(doc) { return {} }
    relatedMoviesParse(doc) { return null }

    // EPISODES
    firstEpisodeUrl(doc) { return null }
    episodesParse(doc) {
        const moviePath = doc.url.split("/").slice(-1)[0];
        const movieId = moviePath.split(".").slice(-1)[0];
        const episodeUrl = `https://api.rophim.me/v1/movie/seasons?mId=${movieId}`;
        const jsonData = httpGetSync(episodeUrl);
        const data = JSON.parse(jsonData);
        const episodes = [];
        data.result.forEach(season => {
            season.episodes.forEach(episode => {
                episodes.push({
                    title: episode.episode_number,
                    url: `${this.baseUrl}/xem-phim/moviePath?ep=${episode.episode_number}&ss=${season.season_number}`
                });
            });
        });
        return episodes
    }
    episodeSelector() { return null }
    episodeFromElement(e) { return null }

    // PLAYER
    moviePlayerSelector() { return "video" }
    moviePlayerContainerSelector() { return this.moviePlayerSelector() }
    onMoviePageLoadedJavascript() { return null }

    movieServerSelector() { return null }
}

class Shin404 extends BaseSource {

    name = "Shin404";
    thumbnailRatio = 1.33;
    baseUrl = "https://www.shin404.com/";

    // POPULAR MOVIES
    popularMovieRequest(page) { 
        return fetch(`${this.baseUrl}/home?category=movie`, {
            "headers": {
                "accept": "text/x-component",
                "accept-language": "vi,en-GB;q=0.9,en;q=0.8,en-US;q=0.7,zh-CN;q=0.6,zh;q=0.5",
                "content-type": "text/plain;charset=UTF-8",
                "next-action": "7f6b6541a305f0eea74437e1b74b9c07432e0dffa0",
                "priority": "u=1, i",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin"
            },
            "referrer": `${this.baseUrl}/home?category=movie`,
            "body": `[{\"limit\":20,\"page\":${page}, \"category\":\"movie\"}]`,
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
            }).then(res => res.text())
     }
    popularMovieUrl(page) { return null }
    popularMoviesParse(doc) { 
        const data = JSON.parse(doc.trim().split("\n")[1].slice(2));
        return data?.data?.items?.map(item => ({
            title: item.title,
            movieUrl: `${this.baseUrl}/home/watch/${item._id}`,
            cardImageUrl: `https://assets.shin404.com/thumbnails/${item.detail.thumbnailCdnId}`,
            backgroundImageUrl: `https://assets.shin404.com/thumbnails/${item.detail.thumbnailCdnId}`,
            latestEpisode: null,
            description: "",
            genres: [""],
        })) ?? []; 
    }
    popularMovieSelector() { return null }
    popularMovieFromElement(e) { return null }

    // LATEST MOVIES
    latestMovieRequest(page) { 
        return fetch(`${this.baseUrl}/home?category=newest`, {
            "headers": {
                "accept": "text/x-component",
                "accept-language": "vi,en-GB;q=0.9,en;q=0.8,en-US;q=0.7,zh-CN;q=0.6,zh;q=0.5",
                "content-type": "text/plain;charset=UTF-8",
                "next-action": "7f6b6541a305f0eea74437e1b74b9c07432e0dffa0",
                "priority": "u=1, i",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin"
            },
            "referrer": `${this.baseUrl}/home?category=newest`,
            "body": `[{\"limit\":20,\"page\":${page}}]`,
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
            }).then(res => res.text())
     }
    latestMovieUrl(page) { return null }
    latestMoviesParse(doc) { return this.popularMoviesParse(doc) }
    latestMovieSelector() { return null }
    latestMovieFromElement(element) { return null }

    // SEARCH MOVIES
    filterConfig() { return null }
    searchMovieRequest(keyword, filters, page) { 
        return fetch(`${this.baseUrl}/home/home?title=${keyword?.replace(/ /g, '+')}`, {
            "headers": {
                "accept": "text/x-component",
                "accept-language": "vi,en-GB;q=0.9,en;q=0.8,en-US;q=0.7,zh-CN;q=0.6,zh;q=0.5",
                "content-type": "text/plain;charset=UTF-8",
                "next-action": "7f6b6541a305f0eea74437e1b74b9c07432e0dffa0",
                "priority": "u=1, i",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin"
            },
            "referrer": `${this.baseUrl}/home?category=newest`,
            "body": `[{\"limit\": ${5 * page},\"title\": \"${keyword}\"}]`,
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
            }).then(res => res.text())
     }
    searchMovieUrl(keyword, filters, page) { return null }
    searchMoviesParse(doc) { return this.popularMoviesParse(doc) }
    searchMovieSelector() { return null }
    searchMovieFromElement(e) { return null }


    // MOVIE DETAIL
    movieDetailParse(doc) { return {} }
    relatedMoviesParse(doc) { return null }

    // EPISODES
    firstEpisodeUrl(doc) { return null }
    episodesParse(doc) { return [{ title: "Xem ngay", url: doc.location.href }] }
    episodeSelector() { return null }
    episodeFromElement(e) { return null }

    // PLAYER
    moviePlayerSelector() { return "video" }
    moviePlayerContainerSelector() { return "#videoWatch" }
    onMoviePageLoadedJavascript() { return null }

    movieServerSelector() { return ".change-server-select" }
}

// ============================
// #endregion
// ============================


// ============================
// #region WEBVIEW
// ============================


class WebView {

    iframe = null;
    constructor() {
        // Add the iframe to the body
        this.iframe = document.createElement('iframe');
        document.body.appendChild(this.iframe);
    }

    async loadUrl(url, bypassIframe) {
        console.log("Loading:", url);
        if (bypassIframe) {
            return await fetch(url).then(response => response.text()).then(text => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, "text/html");
                doc.url = url;
                return doc;
            });
        } else {
            this.iframe.src = url;
            return await new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve(this.iframe.contentDocument || this.iframe.contentWindow.document);
                }, 3000);
            });
        }

    }

    destroy() {
        this.iframe?.remove();
    }
}


// ============================
// #endregion
// ============================

// ============================
// #region ENGINE
// ============================

class Engine {
    source = null;
    currentLatestMoviesPage = 0;
    currentPopularMoviesPage = 0;
    currentSearchMoviesPage = 0;
    currentSearchKeyword = null;
    currentSearchFilters = null;

    selectingMovie = null;

    moviePool = {};

    favoriteMovies = [];
    latestMovies = [];
    popularMovies = [];
    searchMovies = [];

    constructor(source) {
        this.source = source;
    }

    updateMovie(movie) {
        const movieInPool = this.moviePool[movie.title] ?? movie;
        movieInPool.thumbnailRatio = this.source.thumbnailRatio;

        // Copy all properties from movie to movieInPool if they are not already set
        Object.keys(movie).forEach(key => {
            if (movie[key] && !movieInPool[key]) {
                movieInPool[key] = movie[key];
            }
        });

        // Update lastEpisode if it is greater than the one in the pool
        if (movie.latestEpisode && movieInPool.latestEpisode) {
            if(Number(movieInPool.latestEpisode) < Number(movie.latestEpisode)) {
                movieInPool.latestEpisode = movie.latestEpisode;
            }
        }

        this.moviePool[movie.title] = movieInPool;
        return movieInPool;
    }

    updateEpisodeList(oldList, newList) {
        if (!oldList?.length) {
            return newList;
        }
        const episodeDict = oldList.reduce((acc, episode) => {
            acc[episode.url] = episode;
            return acc;
        }, {});

        // Copy info from old to new to keep currentTime and duration info
        newList.forEach(episode => {
            if (episodeDict[episode.url]) {
                episode.currentTime = episodeDict[episode.url].currentTime;
                episode.duration = episodeDict[episode.url].duration;
            }
        });

        return newList;
    }

    updateMovieList(currentList, newData) {
        newData.forEach(movie => {
            if (!currentList.some(m => m.title == movie.title)) {
                movie = this.updateMovie(movie);
                currentList.push(movie);
            }
        })
    }

    async getLatestMovies() {
        const promise = new Promise((resolve, reject) => {
            this.currentLatestMoviesPage++;
            const webView = new WebView();
            let webLoadingPromise = this.source.latestMovieRequest(this.currentLatestMoviesPage);
            if (!webLoadingPromise) {
                webLoadingPromise = webView.loadUrl(this.source.latestMovieUrl(this.currentLatestMoviesPage), this.source.needBypassIframe);
            }
            webLoadingPromise.then((doc) => {
                var movieList = this.source.latestMoviesParse(doc)
                if (movieList == null) {
                    movieList = [...doc.querySelectorAll(this.source.latestMovieSelector())].filter(it => it).map(it => {
                        return this.source.latestMovieFromElement(it)
                    });
                }

                // Emit result
                console.log(`Loaded ${movieList.length} latest movies.`);
                this.updateMovieList(this.latestMovies, movieList);

                webView.destroy();
                resolve(this.latestMovies);
            }
            );
        });
        return promise
    }

    async getPopularMovies() {
        const promise = new Promise((resolve, reject) => {
            this.currentPopularMoviesPage++;
            const webView = new WebView();
            let webLoadingPromise = this.source.popularMovieRequest(this.currentPopularMoviesPage);
            if (!webLoadingPromise) {
                webLoadingPromise = webView.loadUrl(this.source.popularMovieUrl(this.currentPopularMoviesPage), this.source.needBypassIframe);
            }
            webLoadingPromise.then((doc) => {
                var movieList = this.source.popularMoviesParse(doc)
                if (movieList == null) {
                    movieList = [...doc.querySelectorAll(this.source.popularMovieSelector())].filter(it => it).map(it => {
                        return this.source.popularMovieFromElement(it)
                    });
                }

                // Emit result
                console.log(`Loaded ${movieList.length} popular movies.`);
                this.updateMovieList(this.popularMovies, movieList);

                webView.destroy();
                resolve(this.popularMovies);
            }
            );
        });
        return promise
    }

    async getSearchMovies(keyword, filters) {
        const promise = new Promise((resolve, reject) => {
            if (keyword != this.currentSearchKeyword || !this.isEqual(filters, this.currentSearchFilters)) {
                this.currentSearchKeyword = keyword;
                this.currentSearchFilters = filters;
                this.currentSearchMoviesPage = 0;
                this.searchMovies = [];
            }
            this.currentSearchMoviesPage++;
            const webView = new WebView();
            let webLoadingPromise = this.source.searchMovieRequest(keyword, filters, this.currentSearchMoviesPage);
            if (!webLoadingPromise) {
                webLoadingPromise = webView.loadUrl(this.source.searchMovieUrl(keyword, filters, this.currentSearchMoviesPage), this.source.needBypassIframe);
            }
            webLoadingPromise.then((doc) => {
                var movieList = this.source.searchMoviesParse(doc)
                if (movieList == null) {
                    movieList = [...doc.querySelectorAll(this.source.searchMovieSelector())].filter(it => it).map(it => {
                        return this.source.searchMovieFromElement(it)
                    });
                }

                // Emit result
                console.log(`Loaded ${movieList.length} search movies.`);
                this.updateMovieList(this.searchMovies, movieList);
                webView.destroy();
                resolve(this.searchMovies);
            }
            );
        });
        return promise
    }

    async getMovieDetail(movie) {
        const promise = new Promise((resolve, reject) => {
            const webView = new WebView();
            const webLoadingPromise = webView.loadUrl(movie.movieUrl, this.source.needBypassIframe);

            const handleResults = (detailMovie, episodes) => {
                detailMovie.episodeList = this.updateEpisodeList(detailMovie.episodeList, episodes);
                detailMovie.detailLoaded = true;
                if (!detailMovie.latestEpisode) {
                    detailMovie.latestEpisode = episodes[episodes.length - 1]?.title;
                }
                this.saveFavoriteMovies();

                webView.destroy();
                resolve(detailMovie);
            };

            webLoadingPromise.then(doc => {
                const detailMovie = this.updateMovie({ ...movie, ...this.source.movieDetailParse(doc) });
                const firstEpisodeUrl = this.source.firstEpisodeUrl(doc)
                if (!firstEpisodeUrl) {
                    const episodes = this.getMovieEpisodes(doc, null, true);

                    handleResults(detailMovie, episodes);
                } else {
                    const webLoadingPromise1 = webView.loadUrl(firstEpisodeUrl, this.source.needBypassIframe);
                    webLoadingPromise1.then(doc1 => {
                        var episodes = this.getMovieEpisodes(doc1, firstEpisodeUrl, true)
                        handleResults(detailMovie, episodes);
                    });
                }

            });
        });

        return promise
    }

    getMovieEpisodes(
        doc,
        firstEpisodeUrl,
        contentPageFinished
    ) {
        var episodes = this.source.episodesParse(doc)
        if (!episodes?.length) {
            episodes = [...doc.querySelectorAll(this.source.episodeSelector())].filter(it => it).map(it => {
                return this.source.episodeFromElement(it)
            });

        }
        // when can not get episode list, but has firstEpisodeUrl -> set it to episode
        if (contentPageFinished && !episodes?.length && firstEpisodeUrl != null) {
            episodes = [{ title: "Xem ngay", url: firstEpisodeUrl }]
        }
        return episodes
    }

    async getFavoriteMovies() {
        if (!this.favoriteMovies.length) {
            let favoriteMoviesData = await loadDataFromSharedStorage( this.source.name + ':FAVORITE_MOVIES', []);
            if (typeof(favoriteMoviesData) == 'string'){
                favoriteMoviesData = JSON.parse(favoriteMoviesData);
            }
            this.favoriteMovies = favoriteMoviesData
                .map(movie => ({ ...movie, detailLoaded: false }))
                .map(movie => this.updateMovie(movie));
        }
        return this.favoriteMovies;
    }

    async saveFavoriteMovies() {
        await saveDataToSharedStorage(this.source.name + ':FAVORITE_MOVIES', this.favoriteMovies);
        return this.favoriteMovies;
    }

    addFavotiteMovie(movie) {
        movie = this.updateMovie(movie);
        if (this.favoriteMovies.every(m => m.title != movie)) {
            this.favoriteMovies.unshift(movie);
            this.saveFavoriteMovies();
        }
        return movie;
    }

    removeFavotiteMovie(movie) {
        movie = this.updateMovie(movie);
        this.favoriteMovies = this.favoriteMovies.filter(m => m.title != movie.title)
        this.saveFavoriteMovies();
        return movie;
    }

    isEqual(obj1, obj2) {
        if (obj1 == null && obj2 == null) return true;
        if (obj1 == null || obj2 == null) return false;
        return Object.keys(obj1).every(key => obj1[key] === obj2[key]);
    }
}

// ============================
// #endregion
// ============================


// ============================
// #region SCREENS
// ============================

class BaseScreen {

    constructor(engine, parent) {
        this.engine = engine;
        this.parent = parent;
        this.screenContent = null;
        this.init();
    }

    init() { }
    update() { }
    hide() {
        this.screenContent.style.display = 'none';
    }
    show() {
        this.screenContent.style.display = 'block';
    }
    back() {
        this.hide();
        this.parent?.update();
        this.parent?.show();
    }
}

class MainScreen extends BaseScreen {

    init() {
        this.screenContent = document.getElementById("main-screen");
        this.favoriteMoviesDiv = document.getElementById("favorite-movies");
        this.latestMoviesDiv = document.getElementById("latest-movies");
        this.popularMoviesDiv = document.getElementById("popular-movies");
        this.searchButton = document.getElementById("open-search-button");
        this.menuButton = document.getElementById("open-menu-button");
        this.mainMenu = document.getElementById("main-menu");
        this.openSettingButton = document.getElementById("open-setting-btn");
        this.showVersionButton = document.getElementById("show-version-btn");

        this.searchButton.onclick = (e) => {
            this.gotoSearchSreen();
        };
        this.menuButton.onclick = (e) => {
            this.mainMenu.style.display = this.mainMenu.style.display == 'block' ? 'none' : 'block';
        };

        this.openSettingButton.onclick = (e) => {
            this.mainMenu.style.display = 'none';
            this.gotoSettingSreen();
        };

        this.showVersionButton.onclick = (e) => {
            this.mainMenu.style.display = 'none';
            toastMsg("Phiên bản: " + VERSION);
        };

        document.addEventListener('click', (e) => {
            if (this.mainMenu.style.display == 'block' && e.target.closest(".menu-container") == null) {
                this.mainMenu.style.display = 'none';
            }
        });

        this.popularMoviesDiv.innerHTML = MOVIE_LIST_PLACEHOLDER_TEMPLATE;
        this.latestMoviesDiv.innerHTML = MOVIE_LIST_PLACEHOLDER_TEMPLATE;
        this.engine.getFavoriteMovies().then(() => this.updateFavoriteMovies());
        this.engine.getPopularMovies().then(() => this.updatePopularMovies());
        this.engine.getLatestMovies().then(() => {
            // Update all movies after loading latest movies to update latestEpisode
            this.update();
            this.engine.saveFavoriteMovies();
        });
    }

    update() {
        this.updateFavoriteMovies();
        this.updateLatestMovies();
        this.updatePopularMovies();
    }

    gotoSearchSreen() {
        this.hide();
        const searchScreen = new SearchScreen(this.engine, this);
        searchScreen.show();
    }

    gotoSettingSreen() {
        this.hide();
        const settingScreen = new SettingScreen(this.engine, this);
        settingScreen.show();
    }

    gotoDetailScreen(movie) {
        this.hide();
        const detailScreen = new DetailScreen(this.engine, this, movie);
        detailScreen.show(movie);
    }

    updateFavoriteMovies() {
        this.showMovieList(this.favoriteMoviesDiv, this.engine.favoriteMovies);
    }

    updateLatestMovies() {
        this.showMovieList(this.latestMoviesDiv, this.engine.latestMovies);
        const loadMoreButton = createDom(`<button class="load-more-button">+</button>`);
        loadMoreButton.onclick = (e) => {
            toastMsg("Đang tải danh sách phim mới...");
            this.engine.getLatestMovies().then(() => this.updateLatestMovies());
        }
        this.latestMoviesDiv.appendChild(loadMoreButton);
    }

    updatePopularMovies() {
        this.showMovieList(this.popularMoviesDiv, this.engine.popularMovies);
        const loadMoreButton = createDom(`<button class="load-more-button">+</button>`);
        loadMoreButton.onclick = (e) => {
            toastMsg("Đang tải danh sách phim hot...");
            this.engine.getPopularMovies().then(() => this.updatePopularMovies());
        }
        this.popularMoviesDiv.appendChild(loadMoreButton);
    }

    showMovieList(movieListDiv, movies) {
        movieListDiv.innerHTML = '';
        movies.forEach(movie => {
            const cardContent = fillTemplate(MOVIE_CARD_TEMPLATE, {
                ...movie,
                watchingEpisode: movie.watchingEpisode ? `${movie.watchingEpisode}/` : ''
            });
            const cardDom = createDom(cardContent);
            cardDom.addEventListener('click', (e) => {
                console.log("CLick movie: ", movie);

                this.gotoDetailScreen(movie);
            })
            movieListDiv.appendChild(cardDom);
        });
    }

}

class SettingScreen extends BaseScreen {

    init() {
        this.screenContent = document.getElementById("setting-screen");
        this.backButton = document.getElementById("setting-back-button");
        this.saveSettingButton = document.getElementById("save-setting-button");
        this.settingContentDiv = this.screenContent.querySelector(".content-container");

        this.backButton.onclick = (e) => this.back();

        this.saveSettingButton.onclick = (e) => this.saveSetting();

        this.defaultSetting = {
            enableSync: {
                label: "Bật đồng bộ",
                value: false,
                type: "checkbox",
            },
            syncKey: {
                label: "Khóa đồng bộ",
                value: "",
                type: "text",
            },
            syncUrl: {
                label: "URL đồng bộ",
                value: "https://example.com",
                type: "text",
            }
        }
        this.setting = JSON.parse(JSON.stringify(this.defaultSetting));


        loadDataFromSharedStorage(':SETTING', this.defaultSetting).then((setting) => {
            if (typeof(setting) == 'string'){
                setting = JSON.parse(setting);
            }
            this.setting = setting;
            window.anytvSetting = setting;
            this.initSettingUI(setting);
        });
    }

    initSettingUI(setting) {
        this.settingContentDiv.innerHTML = '';
        Object.keys(setting).forEach(key => {
            const value = setting[key];
            const settingField = createDom(
                `<div class="setting-field">
                <label for="setting-field-${key}">${value.label}</label>
                <input id="setting-field-${key}" type="${value.type}" value="${value.value}"/>
                </div>`
            );
            const input = settingField.querySelector('#setting-field-' + key);
            if (value.type == 'checkbox') {
                input.checked = value.value;
            }
            this.settingContentDiv.appendChild(settingField);
        });
    }

    saveSetting() {
        const setting = this.setting;
        Object.keys(setting).forEach(key => {
            const value = setting[key];
            const input = document.getElementById("setting-field-" + key);
            if (value.type == 'checkbox') {
                value.value = input.checked;
            } else {
                value.value = input.value;
            }
        });
        saveDataToSharedStorage(':SETTING', setting);
        window.anytvSetting = setting;
        toastMsg("Đã lưu cài đặt.");
    }
}

class SearchScreen extends BaseScreen {

    init() {
        this.screenContent = document.getElementById("search-screen");
        this.searchKeywordInput = document.getElementById("search-keyword-input");
        this.movieListDiv = document.getElementById("search-movies");
        this.searchButton = document.getElementById("search-button");
        this.backButton = document.getElementById("search-back-button");

        const searchFilterDiv = document.getElementById("search-filters-container");
        if (searchFilterDiv.innerHTML == '') {
            const filterConfig = this.engine.source.filterConfig();
            if (filterConfig) {
                this.createFilterComponent(searchFilterDiv, filterConfig);
            } else {
                searchFilterDiv.style.display = 'none';
            }
        }

        this.searchButton.onclick = (e) => {
            this.search();
        }
        this.searchKeywordInput.onkeydown = (e) => {
            if (e.key == "Enter") {
                this.search();
            }
        }
        this.backButton.onclick = (e) => this.back();
    }

    show() {
        super.show();
        this.searchKeywordInput.focus();
    }

    back() {
        this.hide();
        this.parent.update();
        this.parent.show();
    }

    gotoDetailScreen(movie) {
        this.hide();
        const detailScreen = new DetailScreen(this.engine, this, movie);
        detailScreen.show(movie);
    }

    getSearchParams() {
        const keyword = this.searchKeywordInput.value;
        const filterConfig = this.engine.source.filterConfig();
        const filters = Object.keys(filterConfig?.values ?? {}).reduce((acc, key) => {
            const select = document.getElementById("filter-" + key);
            acc[key] = select?.value;
            return acc;
        }, {});
        return { keyword, filters };
    }

    search() {
        let { keyword, filters } = this.getSearchParams();
        if (keyword) {
            toastMsg("Tìm kiếm: " + keyword);
        } else if (Object.keys(filters).length) {
            toastMsg("Tìm kiếm theo bộ lọc: " + JSON.stringify(removeEmptyValues(filters), null, 1).replaceAll('"', '').slice(1, -1));
        }

        showLoadingScreen();
        this.engine.getSearchMovies(keyword, filters).then(movies => {
            hideLoadingScreen();

            this.movieListDiv.innerHTML = '';
            movies.forEach(movie => {
                const cardContent = fillTemplate(MOVIE_CARD_TEMPLATE, {
                    ...movie,
                    watchingEpisode: movie.watchingEpisode ? `${movie.watchingEpisode}/` : ''
                });
                const cardDom = createDom(cardContent);
                cardDom.onclick = (e) => this.gotoDetailScreen(movie);
                this.movieListDiv.appendChild(cardDom);
            });

            const loadMoreButton = createDom(`<button class="load-more-button">+</button>`);
            loadMoreButton.onclick = (e) => this.search();
            this.movieListDiv.appendChild(loadMoreButton);
        });
    }

    createFilterComponent(searchFilterDiv, filterConfig) {
        const filterContentContainerDiv = createDom(`<div class="filter-content-container"</div>`);
        searchFilterDiv.appendChild(filterContentContainerDiv);
        Object.keys(filterConfig.values).forEach(key => {
            const filter = filterConfig.values[key];
            const filterDiv = createDom(`<div class="filter-container"><label>${filter.label}</label></div>`);
            const select = document.createElement('select');
            select.id = "filter-" + key;
            filter.options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.innerHTML = option.label;
                select.appendChild(optionElement);
            });
            filterDiv.appendChild(select);
            filterContentContainerDiv.appendChild(filterDiv);
        });
        if (filterConfig.notice) {
            const noticeDiv = createDom(`<div class="filter-notice">${filterConfig.notice}</div>`);
            searchFilterDiv.appendChild(noticeDiv);
        }
    }
}

class DetailScreen extends BaseScreen {

    constructor(engine, parent, movie) {
        super(engine, parent);
        this.movie = movie;
        this._init();
    }

    _init() {
        this.screenContent = document.getElementById("detail-movie-screen");
        this.movieTitleDiv = document.getElementById("movie-title");
        this.refreshButton = document.getElementById("detail-refresh-button");
        this.backButton = document.getElementById("detail-back-button");
        this.addFavoriteButton = document.getElementById("add-favorite");
        this.removeFavoriteButton = document.getElementById("remove-favorite");

        this.engine.selectingMovie = this.movie;
        this.forceReload = false;


        this.addFavoriteButton.onclick = () => {
            this.engine.addFavotiteMovie(this.movie);
            this.addFavoriteButton.style.display = 'none';
            this.removeFavoriteButton.style.display = 'block';
        }
        this.removeFavoriteButton.onclick = () => {
            this.engine.removeFavotiteMovie(this.movie);
            this.addFavoriteButton.style.display = 'block';
            this.removeFavoriteButton.style.display = 'none';
        }
        this.refreshButton.onclick = (e) => {
            this.movie.detailLoaded = false;
            this.forceReload = true;
            this.update();
        }
        this.backButton.onclick = (e) => {
            this.back();
        }

        this.update();
    }

    update() {
        const bMovie = this.movie;

        showLoadingScreen();
        this.screenContent.style.filter = 'blur(10px)';

        const movieDetailDiv = document.getElementById('detail-movie-screen');
        movieDetailDiv.querySelector("#detail-movie-bg").style.backgroundImage = `url('${bMovie.backgroundImageUrl}')`;
        movieDetailDiv.querySelector("#detail-movie-image").src = bMovie.cardImageUrl;
        movieDetailDiv.querySelector("#detail-movie-title").innerHTML = bMovie.title;

        const episodeListDiv = document.querySelector(".episode-list");
        episodeListDiv.innerHTML = '';

        if (!this.forceReload) {
            if (bMovie.episodeList?.length && bMovie.episodeList?.length == bMovie.latestEpisode) {
                bMovie.detailLoaded = true;
            }
        }

        const detailMoviePromise = bMovie.detailLoaded ? Promise.resolve(bMovie) : this.engine.getMovieDetail(bMovie);
        detailMoviePromise.then(detailMovie => {
            this.screenContent.style.filter = null;
            hideLoadingScreen();
            console.log(detailMovie);

            movieDetailDiv.querySelector("#detail-movie-bg").style.backgroundImage = `url('${detailMovie.backgroundImageUrl}')`;
            movieDetailDiv.querySelector("#detail-movie-image").src = detailMovie.cardImageUrl;
            movieDetailDiv.querySelector("#detail-movie-title").innerHTML = detailMovie.title;
            movieDetailDiv.querySelector('#detail-movie-genres').innerHTML = detailMovie.genres;
            movieDetailDiv.querySelector('#detail-movie-description').innerHTML = detailMovie.description;

            if (this.engine.favoriteMovies.some(m => m.title == detailMovie.title)) {
                this.addFavoriteButton.style.display = 'none';
                this.removeFavoriteButton.style.display = 'block';
            } else {
                this.addFavoriteButton.style.display = 'block';
                this.removeFavoriteButton.style.display = 'none';
            }

            detailMovie.episodeList?.forEach(episode => {
                const eleContent = fillTemplate(EPISODE_TEMPLATE, {
                    title: isNaN(Number(episode.title)) ? episode.title : `Tập ${episode.title}`
                });
                const episodeItem = createDom(eleContent);

                if (Number(episode.title) < Number(detailMovie.watchingEpisode)) {
                    episodeItem.classList.add("movie-episode-watched")
                }
                if (episode.title == detailMovie.watchingEpisode) {
                    episodeItem.classList.add("movie-episode-watching")
                }
                if (episode.currentTime) {
                    episodeItem.querySelector(".movie-episode-watched-time").innerHTML = `${formatDuration(episode.currentTime)} / ${formatDuration(episode.duration)}`;
                }

                episodeItem.addEventListener('click', () => {
                    this.showMoviePlayer(detailMovie, episode);
                })
                episodeListDiv.appendChild(episodeItem);
            });

        });
    }

    showMoviePlayer(movie, episode) {
        new PlayerScreen(this.engine, this, movie, episode).show();
    }
}

class PlayerScreen extends BaseScreen {

    constructor(engine, parent, movie, episode) {
        super(engine, parent);
        this.movie = movie;
        this.episode = episode;
        this._init();
    }

    _init() {
        this.screenContent = document.getElementById("player-screen");
        this.playerIframe = document.getElementById("player-iframe");
        this.playerTitleDiv = document.getElementById("player-title");
        this.backButton = document.getElementById("player-back-button");

        this.backButton.onclick = (e) => {
            this.back();
        }

        this.update();
    }

    update() {
        this.movie.watchingEpisode = this.episode.title;
        this.engine.saveFavoriteMovies();

        this.playerIframe.src = this.episode.url;
        this.playerTitleDiv.innerHTML = `${this.movie.title} - ${this.episode.title}`;
    }

    hide() {
        super.hide();
        this.playerIframe.src = '';
    }
}

// ============================
// #endregion
// ============================

// ============================
// #region COMMON SCRIPTS
// ============================

/* Run in all frame script */
function runCommonScript() {

    // Remove ads
    setIntervalImmediate(() => {
        const afterBodyDoms = [];
        let nextSibling = document.body?.nextSibling;
        while (nextSibling) {
            afterBodyDoms.push(nextSibling);
            nextSibling = nextSibling.nextSibling;
        }
        afterBodyDoms.forEach((dom) => {
            console.log("Remove:", document.body.nextSibling);
            if (document.body.nextSibling.classList.contains("h-main-container")) {
                console.log("Skip main container");
            } else {
                document.body.nextSibling.remove();
            }
        });
    }, 1000);

    // Handle video
    setIntervalImmediate(() => {
        Array.from(document.getElementsByTagName("video")).forEach((element) => {

            // Check if the video is an advertisement by duration threshold
            if (element.duration < DURATION_THRESHOLD){
                if (element.currentTime < element.duration) {
                    console.log("Skipped an ads!!!!");
                    element.muted = true;
                    element.volume = 0;
                    element.currentTime = element.duration + 1;
                }
            }
        });
    }, 1000);

    // Make player draggable
    makeFloatMoviePlayerDraggable();
}

// ============================
// #endregion
// ============================



// ============================
// #region MAIN FRAME
// ============================

const SUPPORTED_SOURCES =[
    new Animet(),
    new Phimmoi(),
    new Rophim(),
    new Shin404()
].reduce((acc, source) => {
    acc[new URL(source.baseUrl).host] = source;
    acc[source.name] = source;
    return acc;
}, {});
const hashParams = new URLSearchParams(location.hash.substring(1));
const sourceFromUrl = hashParams.get('source');

const DURATION_THRESHOLD = 120; // seconds, under this duration is considered an ad

// MAIN FRAME
if (window.self == window.top) {
    var source = SUPPORTED_SOURCES[location.host] || SUPPORTED_SOURCES[sourceFromUrl];
    if (source) {
        addMainStyle();
        addMainTemplate();
        runCommonScript();

        loadDataFromSharedStorage(':SETTING', undefined).then((setting) => {
            if (setting){
                if (typeof(setting) == 'string'){
                    setting = JSON.parse(setting);
                }
                window.anytvSetting = setting;
            }
        });

        // Update host of source to current host
        const sourceUrl = new URL(source.baseUrl);
        sourceUrl.host = location.host;
        source.baseUrl = sourceUrl.origin;

        var engine = new Engine(source);

        // Create main screen container
        // Wait for DOM to be loaded, because it needs to be in the body
        ["DOMContentLoaded", "MainTemplateLoaded"].forEach(event => {
            document.addEventListener(event, () => {
                const mainScreen = new MainScreen(engine, null);
                mainScreen.show();
            });
        });

        // Listen for messages from the iframe
        window.addEventListener("message", (event) => {
            if (event.data.type === 'videoInfo') {
                const { currentTime, duration, videoUrl } = event.data;
                const currentEpisode = engine.selectingMovie.episodeList.find(episode => episode.title == engine.selectingMovie.watchingEpisode);
                if (currentEpisode && currentEpisode.currentTime != currentTime) {
                    currentEpisode.currentTime = currentTime;
                    currentEpisode.duration = duration;
                    engine.saveFavoriteMovies();
                }
                console.log(`Video Info: ${currentTime}/${duration} - ${videoUrl}`);
            }

            if (event.data.type === 'checkHost') {
                event.source.postMessage({
                    type: 'hostCheckResult',
                    host: location.host,
                    version: VERSION,
                    source: source.name,
                }, event.origin);
            }
        });

        // Sync before existing
        window.addEventListener("beforeunload", (e) => {
            syncDataSyncOnClose();
        });

    }

}

// ============================
// #endregion
// ============================

// ============================
// #region OTHER FRAMES
// ============================

if (window.self != window.top) {
    // IFRAME

    window.top.postMessage({
        type: 'checkHost',
    }, "*");

    window.addEventListener("message", (event) => {
        if (event.data.type === 'hostCheckResult') {
            let source = SUPPORTED_SOURCES[event.data.source];
            if (source) {

                runCommonScript();
                setIntervalImmediate(() => {
                    // Hide all images to prevent ads
                    const images = document.querySelectorAll("img");
                    images.forEach(image => {
                        image.style.display = "none";
                    });
                }, 1000);

                // Handle video container
                if (source.moviePlayerContainerSelector()){
                    var videoContainerTimer = setIntervalImmediate(() => {
                        let videoContainer = document.querySelector(source.moviePlayerContainerSelector());
                        if (videoContainer) {
                            clearInterval(videoContainerTimer);
                            videoContainer.style.width= "100dvw";
                            videoContainer.style.height= "calc(100dvh - 29px)";
                            videoContainer.style.position= "fixed";
                            videoContainer.style.zIndex= 9999;
                            videoContainer.style.left= 0;
                            videoContainer.style.top= "29px";
                            videoContainer.style.background = "black";

                            let parent = videoContainer.parentElement
                            while (parent && parent != document.body){
                                parent.style.zIndex= 9999;
                                parent = parent.parentElement;
                            }

                            document.body.style.height = "50dvh";
                            document.body.style.overflow = "hidden";
                        }
                    }, 500);
                }

                // Handle server list
                if (source.movieServerSelector()) {
                    var serverListContainerTimer = setIntervalImmediate(() => {
                        let serverListContainer = document.querySelector(source.movieServerSelector());
                        if (serverListContainer) {
                            clearInterval(serverListContainerTimer);
                            const box = serverListContainer.getBoundingClientRect();
                            const scale = 30 / box.height;

                            serverListContainer.style.transform = `scale(${scale})`;
                            serverListContainer.style.transformOrigin = "top left";
                            serverListContainer.style.width = Math.max(100, (100 / scale)) + "dvw";
                            serverListContainer.style.height = box.height + 'px';
                            serverListContainer.style.position = "fixed";
                            serverListContainer.style.zIndex = 9999;
                            serverListContainer.style.left = 0;
                            serverListContainer.style.top = 0;
                            serverListContainer.style.background = "black";
                        }
                    }, 500);
                }

                // Handle video
                setIntervalImmediate(() => {
                    Array.from(document.getElementsByTagName("video")).forEach((element) => {

                        // Main video
                        if (element.duration > DURATION_THRESHOLD){

                            // Stop video when it is finished to prevent auto-play next video
                            if (element.currentTime > element.duration - 1){
                                element.pause();
                            }

                            // Send current time and duration to parent window
                            window.top.postMessage({
                                type: 'videoInfo',
                                currentTime: Math.round(element.currentTime),
                                duration: Math.round(element.duration),
                                videoUrl: element.src
                            }, "*");
                        }
                    });
                }, 1000);
            }
        }
    });
}


// ============================
// #endregion
// ============================

// ============================
// #region HOME PAGE
// ============================

if (["hajaulee.github.io"].includes(location.host)) {
    fetch("main.user.js")
            .then(response => response.text())
            .then(data => {
                const latestVersion = data.match(/VERSION.*".*"/)[0].slice(11, -1);
                window.ANYTVWEB_LATEST_VERSION = latestVersion;
                addMainStyle();
                // Add only snackbar to the page
                document.body.appendChild(createDom("<div id='snackbar'></div>"));

                if (window.ANYTVWEB_LATEST_VERSION) {
                    const parsedVersion = VERSION.split('.').map(Number);
                    const latestVersion = window.ANYTVWEB_LATEST_VERSION.split('.').map(Number);
                    const isNewerVersion = latestVersion.some((num, index) => num > (parsedVersion[index] || 0));
                    if (isNewerVersion) {
                        toastMsg("Có phiên bản mới: " + window.ANYTVWEB_LATEST_VERSION);
                    } else {
                        console.log("Phiên bản mới nhất: " + VERSION);
                    }
                }
            })
            .catch(error => console.error('Error fetching the script:', error));

}


// ============================
// #endregion
// ============================
