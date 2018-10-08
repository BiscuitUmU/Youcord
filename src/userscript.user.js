// ==UserScript==
// @name Youcord Discord RPC
// @namespace https://owo.icu
// @grant none
// @author Biscuit
// @exclude-match *://music.youtube.com/*
// @match *://*.youtube.com/*
// @require https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.4/socket.io.js
// @icon https://raw.githubusercontent.com/AcedArmy/Youcord/master/images/userscript-icon.png?raw=true
// ==/UserScript==

window.biscuit = {};
window.biscuit.interval = null;
window.biscuit.socket = io("http://127.0.0.1:13701");
window.biscuit.remember = {}

function doVideoUpdate(video_update) {
    if (video_update.video_state !== window.biscuit.remember.video_state || video_update.current_playback_time !== window.biscuit.remember.current_playback_time) {
        window.biscuit.socket.emit("video_update", video_update);
        window.biscuit.remember = video_update;
    }
}

function doPathUpdate(path_update) {
    if (path_update.pathname !== window.biscuit.remember.pathname) {
        window.biscuit.socket.emit("path_update", path_update);
        window.biscuit.remember = path_update;
    }
}

window.biscuit.socket.on("connect", async function () {
    window.biscuit.interval = window.setInterval(async function () {
        try {
            var video_update = {
                id: window.location.href.substring(window.location.href.indexOf("v=") + 2).slice(0, 11),
                current_playback_time: document.getElementsByClassName("ytp-time-current")[0].textContent,
                max_playback_time: document.getElementsByClassName("ytp-time-duration")[0].textContent,
                video_state: document.getElementsByClassName("ytp-play-button ytp-button")[0].getAttribute('aria-label'),
                isLive: (document.getElementsByClassName("ytp-time-display notranslate ytp-live")[0]) ? true : false,
                pathname: window.location.pathname,
                hostname: window.location.hostname
            }

            if (video_update.id.startsWith('ttps://')) return doStateUpdate({ pathname: video_update.pathname, hostname: window.location.hostname })
            return doVideoUpdate(video_update)

        } catch (err) {
            var path_update = {
                pathname: window.location.pathname,
                hostname: window.location.hostname
            }

            return doPathUpdate(path_update)
        }
    }, 1000);
});

window.biscuit.socket.on("disconnect", function () {
    window.clearInterval(window.biscuit.interval);
});
