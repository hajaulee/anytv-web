// ==UserScript==
// @name         Simple player
// @namespace    http://hajaulee.github.io
// @version      1.0
// @description  A simpler player for movie webpage.
// @author       Heille
// @match        https://*/*
// @grant        none
// ==/UserScript==

const MAIN_TEMPLATE = /* html */ `
    <div class="h-main-container">
        <div id="main-screen">
            <h2 class="category-header">Phổ biến</h2>
            <div id="popular-movies" class="movie-list"></div>
            <h2 class="category-header">Mới cập nhật</h2>
            <div id="latest-movies" class="movie-list"></div>
        </div>
        <div id="detail-movie-screen" style="display: none">
            <div class="detail-movie-header">
                <button onclick="closeDetail()">Close</button>
            </div>
            <div class="detail-movie-container">
                <div class="detail-movie-info">
                    <div id="detail-movie-bg"></div>
                    <img id="detail-movie-image">
                    <div id="detail-movie-title"></div>
                    <div id="detail-movie-genres"></div>
                    <div class="detail-movive-action">
                        <button>Yêu thích</button>
                    </div>
                    <div id="detail-movie-description"></div>
                </div>
                <div class="episode-list"></div>
            </div>
        </div>

        <div id="player-screen" class="float-movie-player" style="display: none">
            <div class="player-header">
                <button onclick="closePlayer()">Close</button>
            </div>
            <iframe id="player-iframe" src="" class="player-iframe"  frameborder="0"></iframe>
        </div>
    </div>
`;

const MOVIE_CARD_TEMPLATE = /* html */ `
<div class="card-movie" style="width: calc({{thumbnailRatio}} * 25vh - 48px)">
  <img src="{{cardImageUrl}}" alt="{{title}}"/>
  <p class="card-badge">{{latestEpisode}}</p>
  <div class="movie-title">{{title}}</div>
  <div class="movie-genres">{{genres}}</div>
</div>
`;

const EPISODE_TEMPLATE = /* html*/ `
<div class="movie-episode">
    <div class="movie-episode-title">{{title}}</div>
</div>
`;

const STYLES = /* css */ `

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
        padding: 10px;
        background: black;
        color: white;
        // opacity: 0.5;
    }

    .category-header {
        color: white;
        font-weight: bold;
        margin-top: 5px;
    }

    .movie-list {
        overflow-x: auto;
        white-space: nowrap;
    }

    .movie-list {
        overflow: auto; /* Enables scrolling */
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
    }
      
    .movie-list::-webkit-scrollbar {
        display: none; /* Chrome, Safari, and Opera */
    }

    .movie-list .card-movie {
        margin-right: 2em;
    }

    .card-movie {
        height: 25vh;
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
        text-shadow: 1px 1px 2px black;
        font-size: 16px;
    }

    .movie-genres {
        padding: 2px 5px;
        overflow: hidden;
        font-size: 12px;
    }

    #detail-movie-screen {
        width: 100vw;
        height: 100vh;
    }

    .detail-movie-header {
        height: 36px;
        overflow: hidden;
    }

    .detail-movie-container {
        display: flex;
        width: 100dvw;
        height: calc(100dvh - 36px);
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
        height: 33vh;
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

    .float-movie-player {
        background: yellowgreen;
        position: absolute;
        top: 10dvh;
        left: 10dvw;
        width: 80dvw;
        height: 80dvh;
        border-radius: 20px;
        overflow: hidden;
    }

    .player-header {
        height: 36px;
        overflow: hidden;
    }
    .player-iframe {
        width: 100%;
        height: calc(100% - 36px);
        position: absolute;
    }
`;


class BaseExtension {

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

class Animet extends BaseExtension {

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

        const match = episodeText?.match(/\d+$/);
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
    extension = null;
    currentLatestMoviesPage = 0;
    currentPopularMoviesPage = 0;
    currentSearchMoviesPage = 0;

    latestMovies = [];
    popularMovies = [];

    constructor(extension) {
        this.extension = extension;
    }


    getLatestMovies() {
        const promise = new Promise((resolve, reject) => {
            this.currentLatestMoviesPage++;
            const webView = new WebView();
            const webLoadingPromise = webView.loadUrl(extension.latestMovieUrl(this.currentLatestMoviesPage));
            webLoadingPromise.then((doc) => {
                var movieList = extension.latestMoviesParse(doc)
                if (movieList == null) {
                    movieList = [...doc.querySelectorAll(extension.latestMovieSelector())].filter(it => it).map(it => {
                        return extension.latestMovieFromElement(it)
                    });
                }

                // Emit result
                console.log(`Loaded ${movieList.length} latest movies.`);
                this.latestMovies = this.latestMovies.concat(movieList);

                webView.destroy();
                resolve(this.latestMovies);
            }
            );
        });
        return promise
    }

    getPopularMovies() {
        const promise = new Promise((resolve, reject) => {
            this.currentPopularMoviesPage++;
            const webView = new WebView();
            const webLoadingPromise = webView.loadUrl(extension.popularMovieUrl(this.currentPopularMoviesPage));
            webLoadingPromise.then((doc) => {
                var movieList = extension.popularMoviesParse(doc)
                if (movieList == null) {
                    movieList = [...doc.querySelectorAll(extension.popularMovieSelector())].filter(it => it).map(it => {
                        return extension.popularMovieFromElement(it)
                    });
                }

                // Emit result
                console.log(`Loaded ${movieList.length} popular movies.`);
                this.popularMovies = this.popularMovies.concat(movieList);

                // webView.destroy();
                resolve(this.popularMovies);
            }
            );
        });
        return promise
    }

    getMovieDetail(movie){
        const promise = new Promise((resolve, reject) => {
            const webView = new WebView();
            const webLoadingPromise = webView.loadUrl(movie.movieUrl)
            webLoadingPromise.then(doc => {
                const detailMovie = {...movie, ...extension.movieDetailParse(doc)}
                const firstEpisodeUrl = extension.firstEpisodeUrl(doc)
                if (!firstEpisodeUrl) {
                    const episodes = this.getMovieEpisodes(doc, null, true)
                    detailMovie.episodeList = episodes;
                    webView.destroy();
                    resolve(detailMovie)
                } else {
                    const webLoadingPromise1 = webView.loadUrl(firstEpisodeUrl);
                    webLoadingPromise1.then(doc1 => {                        
                        var episodes = this.getMovieEpisodes(doc1, firstEpisodeUrl, true)
                        detailMovie.episodeList = episodes;
                        console.log(episodes);
                        
                        webView.destroy();
                        resolve(detailMovie)
                        
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
        var episodes = this.extension.episodesParse(doc)
        if (!episodes?.length) {
            episodes = [...doc.querySelectorAll(this.extension.episodeSelector())].filter(it => it).map(it => {
                return this.extension.episodeFromElement(it)
            });

        }
        // when can not get episode list, but has firstEpisodeUrl -> set it to episode
        if (contentPageFinished && !episodes?.length && firstEpisodeUrl != null) {
            episodes = [{title: "Xem ngay", url: firstEpisodeUrl}]
        }
        return episodes
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

if (location.host == 'anime4.site') {
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

        var extension = new Animet();
        var engine = new Engine(extension);

        const mainScreenDiv = document.getElementById("main-screen");
        const detailScreenDiv = document.getElementById("detail-movie-screen");
        const playerScreenDiv = document.getElementById("player-screen");

        function closePlayer() {
            playerScreenDiv.style.display = 'none';
            document.getElementById("player-iframe").src = '';
        }

        function closeDetail() {
            closePlayer();
            detailScreenDiv.style.display = 'none';
            mainScreenDiv.style.display = 'block';
        }

        function showLastestMovies() {
            engine.getLatestMovies().then(movies => {
                // console.log("Results:");

                // console.log(movies);
                // console.log(engine);

                const movieListDiv = document.getElementById("latest-movies");
                movieListDiv.innerHTML = '';
                engine.latestMovies.forEach(movie => {
                    const cardContent = fillTemplate(MOVIE_CARD_TEMPLATE, { ...movie, thumbnailRatio: engine.extension.thumbnailRatio });
                    const cardDom = createDom(cardContent);
                    cardDom.addEventListener('click', (e) => {
                        showDetailMovie(movie);
                    })
                    movieListDiv.appendChild(cardDom);
                });

                movieListDiv.appendChild(createDom(`<button onclick="loadLastestMovies()">Load more</button>`))
            });
        }

        function showPopularMovies() {
            engine.getPopularMovies().then(movies => {
                // console.log("Results:");

                // console.log(movies);
                // console.log(engine);

                const movieListDiv = document.getElementById("popular-movies");
                movieListDiv.innerHTML = '';
                engine.popularMovies.forEach(movie => {
                    const cardContent = fillTemplate(MOVIE_CARD_TEMPLATE, { ...movie, thumbnailRatio: engine.extension.thumbnailRatio });
                    const cardDom = createDom(cardContent);
                    cardDom.addEventListener('click', (e) => {
                        showDetailMovie(movie);
                    })
                    movieListDiv.appendChild(cardDom);
                })
            });
        }

        function showDetailMovie(bMovie) {
            mainScreenDiv.style.display = 'none';
            detailScreenDiv.style.display = 'block';

            engine.getMovieDetail(bMovie).then(detailMovie => {
                console.log(detailMovie);
                const movieDetailDiv = document.getElementById('detail-movie-screen');
                const episodeListDiv = document.querySelector(".episode-list");

                movieDetailDiv.querySelector("#detail-movie-bg").style.backgroundImage = `url('${detailMovie.backgroundImageUrl}')`;
                movieDetailDiv.querySelector("#detail-movie-image").src = detailMovie.cardImageUrl;
                movieDetailDiv.querySelector("#detail-movie-title").innerHTML = detailMovie.title;
                movieDetailDiv.querySelector('#detail-movie-genres').innerHTML = detailMovie.genres;
                movieDetailDiv.querySelector('#detail-movie-description').innerHTML = detailMovie.description;

                episodeListDiv.innerHTML = '';
                detailMovie.episodeList?.forEach(episode => {
                    const eleContent = fillTemplate(EPISODE_TEMPLATE, {
                        title: isNaN(Number(episode.title)) ? episode.title : `Tập ${episode.title}`
                    });
                    const eleDom = createDom(eleContent);
                    eleDom.addEventListener('click', () => {
                        showMoviePlayer(detailMovie, episode);
                    })
                    episodeListDiv.appendChild(eleDom);
                });

            });
        }

        function showMoviePlayer(movie, episode){
            playerScreenDiv.style.display = 'block';
            const playerIframe = document.getElementById("player-iframe");
            playerIframe.src = episode.url;
        }

        showLastestMovies();
        showPopularMovies();

    }

    // Run in all frame script

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