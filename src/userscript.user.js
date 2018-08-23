// ==UserScript==
// @name Youcord Discord RPC
// @namespace https://owo.icu
// @grant none
// @author Biscuit
// @match *://www.youtube.com/*
// @require https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.4/socket.io.js
// @icon https://raw.githubusercontent.com/AcedArmy/Youcord/master/images/userscript-icon.png?raw=true
// ==/UserScript==

window.biscuit = {};
window.biscuit.interval = null;
window.biscuit.socket = io("http://127.0.0.1:13701");
window.biscuit.remember = {}

function findCorrectUploaderElement(findClass) {
    return new Promise((resolve, reject) => {
        [].slice.call(document.getElementsByClassName(findClass)).map((e) => {
            if (!e.textContent.startsWith('#')) resolve(e.textContent);
        })
    });
}

window.biscuit.socket.on("connect", async function () {
    window.biscuit.interval = window.setInterval(async function () {
        try {
            var video_update = {
                title: document.getElementsByClassName("style-scope ytd-video-primary-info-renderer")[4].textContent,
                uploader: await findCorrectUploaderElement('yt-simple-endpoint style-scope yt-formatted-string'),
                views: document.getElementsByClassName("view-count style-scope yt-view-count-renderer")[0].textContent,
                likes: document.getElementsByClassName("style-scope ytd-toggle-button-renderer style-text")[1].textContent,
                dislikes: document.getElementsByClassName("style-scope ytd-toggle-button-renderer style-text")[3].textContent,
                current_playback_time: document.getElementsByClassName("ytp-time-current")[0].textContent,
                max_playback_time: document.getElementsByClassName("ytp-time-duration")[0].textContent,
                video_state: document.getElementsByClassName("ytp-play-button ytp-button")[0].getAttribute('aria-label'),
                pathname: window.location.pathname
            }

            if (video_update.title !== window.biscuit.remember.title || video_update.video_state !== window.biscuit.remember.video_state || video_update.current_playback_time !== window.biscuit.remember.current_playback_time) {
                window.biscuit.socket.emit("video_update", video_update);
                window.biscuit.remember = video_update;
            }
        } catch (err) {

            var state_update = {
                pathname: window.location.pathname
            }

            if (state_update.pathname !== window.biscuit.remember.pathname) {
                window.biscuit.socket.emit("state_update", state_update);
                window.biscuit.remember = state_update;
            }
        }
    }, 1000);
});

window.biscuit.socket.on("disconnect", function () {
    window.clearInterval(window.biscuit.interval);
});