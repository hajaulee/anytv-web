// ==UserScript==
// @name         Simple player
// @namespace    http://hajaulee.github.io
// @version      1.0
// @description  A simpler player for movie webpage.
// @author       Haule
// @match        https://*/*
// @grant        none
// ==/UserScript==

/* ============================
 * CẤU HÌNH VÀ TEMPLATE HTML
 * ============================ */

// Template chính cho giao diện người dùng
const MAIN_TEMPLATE = /* html */ `
    <div class="h-main-container">
        <!-- Màn hình chính -->
        <div id="main-screen">
            <div class="header">
                <button class="icon-button" onclick="location.href='https://hajaulee.github.io/anytv-web/'">〈</button>
                <span style="flex: 1 1 auto"></span>
                <button class="icon-button" onclick="openSearch()">🔍</button>
            </div>
            <div class="content-container">
                <h2 class="category-header">Yêu thích</h2>
                <div id="favorite-movies" class="movie-list"></div>
                <h2 class="category-header">Phổ biến</h2>
                <div id="popular-movies" class="movie-list"></div>
                <h2 class="category-header">Mới cập nhật</h2>
                <div id="latest-movies" class="movie-list"></div>
            </div>
        </div>

        <!-- Màn hình tìm kiếm -->
        <div id="search-screen" style="display: none">
            <div class="header">
                <button class="icon-button" onclick="closeSearch()">〈</button>
                <input id="search-keyword-input" placeholder="Nhập từ khóa..." class="input-search" autofocus onchange="showSearchResultMovies()">
                <button class="icon-button" onclick="showSearchResultMovies()">🔍</button>
            </div>
            <div class="content-container">
                <h2 class="category-header">Kết quả tìm kiếm</h2>
                <div id="search-movies" class="movie-list"></div>
            </div>
        </div>

        <!-- Màn hình chi tiết phim -->
        <div id="detail-movie-screen" style="display: none">
            <div class="header detail-movie-header">
                <button class="icon-button" onclick="closeDetail()">〈</button>
                <span style="flex: 1 1 auto"></span>
                <button class="icon-button" onclick="refreshMovieDetail()">↻</button>
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
                    <button class="icon-button" onclick="closePlayer()">〈</button>
                    <span id="player-title"></span>
                </div>
                <iframe id="player-iframe" src="" class="player-iframe" frameborder="0"></iframe>
            </div>
        </div>

        <!-- Snackbar thông báo -->
        <div id="snackbar">Some text some message..</div>
    </div>
`;

// Template cho thẻ phim
const MOVIE_CARD_TEMPLATE = /* html */ `
<div class="card-movie" style="width: calc({{thumbnailRatio}} * 25dvh - 48px)">
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
</div>
`;

/* ============================
 * STYLES (CSS)
 * ============================ */

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
        margin-top: 5px;
    }

    .movie-list {
        overflow-x: auto;
        overflow-y: hidden;
        white-space: nowrap;
        height: 26dvh;
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
        height: 25dvh;
        display: inline-block;
        position: relative;
        background-color: blue;
        color: white;
        border-radius: 5px;
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

    .input-search {
        background: transparent;
        padding: 0;
        margin: 0;
        margin-left: 10px;
        outline: none;
        border: none;
        width: 100%;
    }

    #detail-movie-screen {
        width: 100dvw;
        height: 100dvh;
    }

    .header {
        height: 36px;
        overflow: hidden;
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
    }

    .episode-list {
        flex: 1 1 auto;
        padding: 1em;
        overflow-y: auto;
    }
    .movie-episode {
        height: 56px;
    }
    .movie-episode-title {
        font: 24px;
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
    }

    .float-movie-player {
        position: absolute;
        top: 10dvh;
        left: 10dvw;
        width: 80dvw;
        height: 80dvh;
        border-radius: 20px;
        overflow: hidden;
        background-color: rgba(0, 0, 0, 0.7);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .player-header {
        padding-left: 10px;
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
    }

    .load-more-button {
        font-size: 100px;
        width: 16dvh;
        height: 25dvh;
        background: #122332;
        border-radius: 10px !important;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        vertical-align: top;
        border: 0;
    }

    #snackbar {
        visibility: hidden;
        min-width: 250px;
        margin-left: -125px;
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
`;

/* ============================
 * LỚP CƠ SỞ VÀ NGUỒN DỮ LIỆU
 * ============================ */

class BaseSource {

    name = "Base";
    thumbnailRatio = 0.75;
    baseUrl = "https://abc.xyz";

    // POPULAR MOVIES
    popularMovieUrl(page) { return null }
    popularMoviesParse(doc) { return null }
    popularMovieSelector() { return null }
    popularMovieFromElement(e) { return null }

    // LATEST MOVIES
    latestMovieUrl(page) { return null }
    latestMoviesParse(doc) { return null }
    latestMovieSelector() { return null }
    latestMovieFromElement(element) { return null }

    // SEARCH MOVIES
    searchMovieUrl(keyword, page) {return null}
    searchMoviesParse(doc) {return null}
    searchMovieSelector() {return null}
    searchMovieFromElement(e) {return null}

    // MOVIE DETAIL
    movieDetailParse(doc) {return null}
    relatedMoviesParse(doc) {return null}

    // EPISODES
    firstEpisodeUrl(doc) {return null}
    episodesParse(doc) {return null}
    episodeSelector() {return null}
    episodeFromElement(e) {return null}

    // PLAYER
    moviePlayerSelector() {return "video"}
    moviePlayerContainerSelector() { return  this.moviePlayerSelector()}
    onMoviePageLoadedJavascript()  {return null}

    movieServerSelector() {return null}
}

class Animet extends BaseSource {

    name = "Animet";
    thumbnailRatio = 0.75;
    baseUrl = "https://anime4.site";

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
    searchMovieUrl(keyword, page) {
        keyword = keyword.replaceAll(" ", "-")
        return `${this.baseUrl}/tim-kiem/${keyword}/trang-${page}.html`;
    }
    searchMovieSelector() {return this.latestMovieSelector()}
    searchMovieFromElement(e) {return this.latestMovieFromElement(e)}

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

    episodeSelector(){ return ".list-episode a"}

    episodeFromElement(e) {
        return {
            title: e?.textContent?.trim(), 
            url: e.getAttribute("href")
        }
    }
}

class Phimmoi extends BaseSource {

    name= "Phimmoi"
    thumbnailRatio = 1.7
    baseUrl = "https://phimmoichill.best";

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
    searchMovieUrl(keyword, page) {
        return `${this.baseUrl}/tim-kiem/${keyword.replace(" ", "+")}/`
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
                    const episodeNum = match ? parseInt(match[0], 10) : null;
                    return {
                        title: episodeNum, 
                        url: it.getAttribute("href") 
                    }
                });
            } else {
                return [{title: "Xem ngay", url: doc.baseUri()}]
            }
        }
        return []

    }

    episodeSelector() {
        return ""
    }

    episodeFromElement(e) {
        return {title: "", url: ""}
    }
}



class WebView {

    iframe = null;
    constructor() {
        // Add the iframe to the body
        this.iframe = document.createElement('iframe');
        document.body.appendChild(this.iframe);
    }

    async loadUrl(url) {
        console.log("Loading:", url);
        this.iframe.src = url;
        return await new Promise((resolve, reject) => {
            setTimeout(() => {                
                resolve(this.iframe.contentDocument || this.iframe.contentWindow.document);
            }, 3000);
        });

    }

    destroy() {
        this.iframe?.remove();
    }
}


class Engine {
    source = null;
    currentLatestMoviesPage = 0;
    currentPopularMoviesPage = 0;
    currentSearchMoviesPage = 0;
    currentSearchKeyword = null;

    selectingMovie = null;

    moviePool = {};

    favoriteMovies = [];
    latestMovies = [];
    popularMovies = [];
    searchMovies = [];

    constructor(source) {
        this.source = source;
    }

    updateMovie(movie){
        const movieInPool = this.moviePool[movie.title] ?? movie;
        movieInPool.thumbnailRatio = this.source.thumbnailRatio;
        if (movie.genres && !movieInPool.genres){
            movieInPool.genres = movie.genres;
        }
        if (movie.episodeList && !movieInPool.episodeList) {
            movieInPool.episodeList = movie.episodeList;
        }
        if (movie.description && !movieInPool.description){
            movieInPool.description = movie.description;
        }

        this.moviePool[movie.title] = movieInPool;
        return movieInPool;
    }

    updateMovieList(currentList, newData){
        newData.forEach(movie => {
            if (!currentList.some(m => m.title == movie.title)){
                movie = this.updateMovie(movie);
                currentList.push(movie);
            }
        })
    }

    async getLatestMovies() {
        const promise = new Promise((resolve, reject) => {
            this.currentLatestMoviesPage++;
            const webView = new WebView();
            const webLoadingPromise = webView.loadUrl(this.source.latestMovieUrl(this.currentLatestMoviesPage));
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
            const webLoadingPromise = webView.loadUrl(this.source.popularMovieUrl(this.currentPopularMoviesPage));
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

    async getSearchMovies(keyword) {
        const promise = new Promise((resolve, reject) => {
            if (keyword != this.currentSearchKeyword){
                this.currentSearchKeyword = keyword;
                this.currentSearchMoviesPage = 0;
                this.searchMovies = [];
            }
            this.currentPopularMoviesPage++;
            const webView = new WebView();
            const webLoadingPromise = webView.loadUrl(this.source.searchMovieUrl(keyword, this.currentSearchMoviesPage));
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

    async getMovieDetail(movie){
        const promise = new Promise((resolve, reject) => {
            const webView = new WebView();
            const webLoadingPromise = webView.loadUrl(movie.movieUrl);

            const handleResults = (detailMovie, episodes) => {
                detailMovie.episodeList = episodes;
                detailMovie.detailLoaded = true;
                if (!detailMovie.latestEpisode){
                    detailMovie.latestEpisode = episodes[episodes.length - 1]?.title;
                }
                this.saveFavoriteMovies();

                webView.destroy();
                resolve(detailMovie);
            };

            webLoadingPromise.then(doc => {
                const detailMovie = this.updateMovie({...movie, ...this.source.movieDetailParse(doc)});
                const firstEpisodeUrl = this.source.firstEpisodeUrl(doc)
                if (!firstEpisodeUrl) {
                    const episodes = this.getMovieEpisodes(doc, null, true);

                    handleResults(detailMovie, episodes);
                } else {
                    const webLoadingPromise1 = webView.loadUrl(firstEpisodeUrl);
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
    ){
        var episodes = this.source.episodesParse(doc)
        if (!episodes?.length) {
            episodes = [...doc.querySelectorAll(this.source.episodeSelector())].filter(it => it).map(it => {
                return this.source.episodeFromElement(it)
            });

        }
        // when can not get episode list, but has firstEpisodeUrl -> set it to episode
        if (contentPageFinished && !episodes?.length && firstEpisodeUrl != null) {
            episodes = [{title: "Xem ngay", url: firstEpisodeUrl}]
        }
        return episodes
    }

    async getFavoriteMovies(){
        if (!this.favoriteMovies.length){
            const favoriteMoviesData = localStorage.getItem('FAVORITE_MOVIES') ?? '[]';
            this.favoriteMovies = JSON.parse(favoriteMoviesData)
                .map(movie => ({...movie, detailLoaded: false}))
                .map(movie => this.updateMovie(movie));
        }
        return this.favoriteMovies;
    }

    async saveFavoriteMovies(){
        localStorage.setItem('FAVORITE_MOVIES', JSON.stringify(this.favoriteMovies));
        return this.favoriteMovies;
    }

    addFavotiteMovie(movie) {
        movie = this.updateMovie(movie);
        if (this.favoriteMovies.every(m => m.title != movie)){
            this.favoriteMovies.push(movie);
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
}

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
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
}

const SUPPORTED_SOURCES = {
    'anime4.site': new Animet(),
    'phimmoichill.best': new Phimmoi()
}

if (SUPPORTED_SOURCES[location.host]) {
    // MAIN FRAME
    if (window.self == window.top) {

        // Add the styles to the document
        const styleTag = document.createElement('style');
        styleTag.textContent = STYLES;
        document.head.appendChild(styleTag);

        // Add the template to the body
        const templateDiv = document.createElement('div');
        templateDiv.innerHTML = MAIN_TEMPLATE;
        document.body.appendChild(templateDiv.firstElementChild);

        var source = SUPPORTED_SOURCES[location.host];
        var engine = new Engine(source);

        const mainScreenDiv = document.getElementById("main-screen");
        const detailScreenDiv = document.getElementById("detail-movie-screen");
        const playerScreenDiv = document.getElementById("player-screen");
        const searchScreenDiv = document.getElementById("search-screen");


        function closePlayer() {
            playerScreenDiv.style.display = 'none';
            document.getElementById("player-iframe").src = '';
        }

        function closeDetail() {
            closePlayer();
            showFavoriteMovies();
            detailScreenDiv.style.display = 'none';
            mainScreenDiv.style.display = 'block';
        }

        function openSearch() {
            mainScreenDiv.style.display = 'none';
            searchScreenDiv.style.display = 'block';
            document.getElementById("search-keyword-input").focus();
        }

        function closeSearch(){
            searchScreenDiv.style.display = 'none';
            mainScreenDiv.style.display = 'block';
        }

        function showFavoriteMovies() {
            engine.getFavoriteMovies().then(movies => {

                const movieListDiv = document.getElementById("favorite-movies");
                movieListDiv.innerHTML = '';
                movies.forEach(movie => {
                    const cardContent = fillTemplate(MOVIE_CARD_TEMPLATE, { 
                        ...movie,
                        watchingEpisode: movie.watchingEpisode ? `${movie.watchingEpisode}/`: ''
                    });
                    const cardDom = createDom(cardContent);
                    cardDom.addEventListener('click', (e) => {
                        showDetailMovie(movie);
                    })
                    movieListDiv.appendChild(cardDom);
                });
            });
        }

        function showLastestMovies() {
            toastMsg("Đang tải danh sách phim mới...");
            engine.getLatestMovies().then(movies => {
                // console.log("Results:");

                // console.log(movies);
                // console.log(engine);

                const movieListDiv = document.getElementById("latest-movies");
                movieListDiv.innerHTML = '';
                movies.forEach(movie => {
                    const cardContent = fillTemplate(MOVIE_CARD_TEMPLATE, { 
                        ...movie, 
                        watchingEpisode: movie.watchingEpisode ? `${movie.watchingEpisode}/`: ''
                    });
                    const cardDom = createDom(cardContent);
                    cardDom.addEventListener('click', (e) => {
                        showDetailMovie(movie);
                    })
                    movieListDiv.appendChild(cardDom);
                });

                movieListDiv.appendChild(createDom(`<button class="load-more-button" onclick="showLastestMovies()">+</button>`))
            });
        }

        function showPopularMovies() {
            toastMsg("Đang tải danh sách phim hot...");
            engine.getPopularMovies().then(movies => {
                // console.log("Results:");

                // console.log(movies);
                // console.log(engine);

                const movieListDiv = document.getElementById("popular-movies");
                movieListDiv.innerHTML = '';
                movies.forEach(movie => {
                    const cardContent = fillTemplate(MOVIE_CARD_TEMPLATE, { 
                        ...movie, 
                        watchingEpisode: movie.watchingEpisode ? `${movie.watchingEpisode}/`: ''
                    });
                    const cardDom = createDom(cardContent);
                    cardDom.addEventListener('click', (e) => {
                        showDetailMovie(movie);
                    })
                    movieListDiv.appendChild(cardDom);
                });

                movieListDiv.appendChild(createDom(`<button class="load-more-button" onclick="showPopularMovies()">+</button>`))

            });

        }

        function showSearchResultMovies() {
            const keyword = document.getElementById('search-keyword-input').value;
            toastMsg("Tìm kiếm: " + keyword);
            engine.getSearchMovies(keyword).then(movies => {
                // console.log("Results:");

                // console.log(movies);
                // console.log(engine);

                const movieListDiv = document.getElementById("search-movies");
                movieListDiv.innerHTML = '';
                movies.forEach(movie => {
                    const cardContent = fillTemplate(MOVIE_CARD_TEMPLATE, { 
                        ...movie, 
                        watchingEpisode: movie.watchingEpisode ? `${movie.watchingEpisode}/`: ''
                    });
                    const cardDom = createDom(cardContent);
                    cardDom.addEventListener('click', (e) => {
                        showDetailMovie(movie);
                    })
                    movieListDiv.appendChild(cardDom);
                });

                movieListDiv.appendChild(createDom(`<button class="load-more-button" onclick="showSearchResultMovies()">+</button>`))
            });
        }

        function showDetailMovie(bMovie, forceReload) {
            engine.selectingMovie = bMovie;

            mainScreenDiv.style.display = 'none';
            searchScreenDiv.style.display = 'none';
            detailScreenDiv.style.display = 'block';
            detailScreenDiv.style.filter = 'blur(10px)';

            const movieDetailDiv = document.getElementById('detail-movie-screen');
            movieDetailDiv.querySelector("#detail-movie-bg").style.backgroundImage = `url('${bMovie.backgroundImageUrl}')`;
            movieDetailDiv.querySelector("#detail-movie-image").src = bMovie.cardImageUrl;
            movieDetailDiv.querySelector("#detail-movie-title").innerHTML = bMovie.title;
            
            const episodeListDiv = document.querySelector(".episode-list");
            episodeListDiv.innerHTML = '';

            const addFavoriteButton = document.getElementById("add-favorite");
            const removeFavoriteButton = document.getElementById("remove-favorite");

            addFavoriteButton.onclick = () => {
                engine.addFavotiteMovie(bMovie);
                addFavoriteButton.style.display = 'none';
                removeFavoriteButton.style.display = 'block';
            }
            removeFavoriteButton.onclick = () => {
                engine.removeFavotiteMovie(bMovie);
                addFavoriteButton.style.display = 'block';
                removeFavoriteButton.style.display = 'none';
            }

            if (!forceReload){
                if (bMovie.episodeList?.length == bMovie.latestEpisode){
                    bMovie.detailLoaded = true;
                }
            }

            const detailMoviePromise = bMovie.detailLoaded ? Promise.resolve(bMovie) : engine.getMovieDetail(bMovie);
            detailMoviePromise.then(detailMovie => {
                detailScreenDiv.style.filter = null;
                console.log(detailMovie);

                movieDetailDiv.querySelector("#detail-movie-bg").style.backgroundImage = `url('${detailMovie.backgroundImageUrl}')`;
                movieDetailDiv.querySelector("#detail-movie-image").src = detailMovie.cardImageUrl;
                movieDetailDiv.querySelector("#detail-movie-title").innerHTML = detailMovie.title;
                movieDetailDiv.querySelector('#detail-movie-genres').innerHTML = detailMovie.genres;
                movieDetailDiv.querySelector('#detail-movie-description').innerHTML = detailMovie.description;
                
                if (engine.favoriteMovies.some(m => m.title == detailMovie.title)){
                    addFavoriteButton.style.display = 'none';
                    removeFavoriteButton.style.display = 'block';
                } else {
                    addFavoriteButton.style.display = 'block';
                    removeFavoriteButton.style.display = 'none';
                }

                detailMovie.episodeList?.forEach(episode => {
                    const eleContent = fillTemplate(EPISODE_TEMPLATE, {
                        title: isNaN(Number(episode.title)) ? episode.title : `Tập ${episode.title}`
                    });
                    const episodeItem = createDom(eleContent);
                    if (Number(episode.title) < Number(detailMovie.watchingEpisode)){
                        episodeItem.classList.add("movie-episode-watched")
                    }
                    if (episode.title == detailMovie.watchingEpisode){
                        episodeItem.classList.add("movie-episode-watching")
                    }
                    episodeItem.addEventListener('click', () => {
                        showMoviePlayer(detailMovie, episode);
                    })
                    episodeListDiv.appendChild(episodeItem);
                });

            });
        }

        function refreshMovieDetail(){
            toastMsg("Tải lại thông tin phim")
            if (engine.selectingMovie){
                engine.selectingMovie.detailLoaded = false;
                showDetailMovie(engine.selectingMovie, true);
            }
        }

        function showMoviePlayer(movie, episode){
            movie.watchingEpisode = episode.title;
            engine.saveFavoriteMovies();
            // Update displaying watching episode
            showDetailMovie(movie);

            playerScreenDiv.style.display = 'block';
            const playerIframe = document.getElementById("player-iframe");
            playerIframe.src = episode.url;

            const playerTitleDiv = document.getElementById("player-title");
            playerTitleDiv.innerHTML = `${movie.title} - ${episode.title}`;
        }

        showFavoriteMovies();
        showLastestMovies();
        showPopularMovies();
    }

    /* Run in all frame script */

    // Disable popup opening
    window.open = console.log;

    // Remove ads
    setInterval(() => {
        while (document.body.nextSibling) {
            document.body.nextSibling.remove();
        }
    }, 1000);

    // Remove video ads
    setInterval(() => {
        Array.from(document.getElementsByTagName("video")).forEach((element) => {
            if (element.duration < 120 && element.currentTime < element.duration){
                console.log("Skipped an ads!!!!");
                element.muted = true;
                element.volume = 0;
                element.currentTime = element.duration + 1;
            }
        });
    }, 1000);
}