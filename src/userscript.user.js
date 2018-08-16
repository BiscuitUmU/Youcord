// ==UserScript==
// @name Youcord Discord RPC
// @namespace https://owo.icu
// @grant none
// @author Biscuit
// @match *://www.youtube.com/*
// @require https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.4/socket.io.js
// @icon https://raw.githubusercontent.com/AcedArmy/Youcord/master/images/userscirpt-icon.png?raw=true
// ==/UserScript==

window.biscuit = {};
window.biscuit.interval = null;
window.biscuit.socket = io("http://127.0.0.1:13701");
window.biscuit.finder_value = 0;
window.biscuit.videoUploader = null

function findCorrectUploaderElement(findClass) {
    if (document.getElementsByClassName(findClass)[window.biscuit.finder_value].textContent.startsWith('#')) {
        window.biscuit.finder_value++
        findCorrectUploaderElement(findClass);
    } else {
        window.biscuit.finder_value = 0
        return window.biscuit.videoUploader = document.getElementsByClassName('yt-simple-endpoint style-scope yt-formatted-string')[window.biscuit.finder_value].textContent
    }
}

window.biscuit.socket.on("connect", async function () {
    window.biscuit.interval = window.setInterval(async function () {
        try {
            findCorrectUploaderElement('yt-simple-endpoint style-scope yt-formatted-string');
            window.biscuit.socket.emit("video_update", {
                title: document.getElementsByClassName("style-scope ytd-video-primary-info-renderer")[4].textContent,
                uploader: window.biscuit.videoUploader,
                views: document.getElementsByClassName("view-count style-scope yt-view-count-renderer")[0].textContent,
                likes: document.getElementsByClassName("style-scope ytd-toggle-button-renderer style-text")[1].textContent,
                dislikes: document.getElementsByClassName("style-scope ytd-toggle-button-renderer style-text")[3].textContent,
                current_playback_time: document.getElementsByClassName("ytp-time-current")[0].textContent,
                max_playback_time: document.getElementsByClassName("ytp-time-duration")[0].textContent,
                video_state: document.getElementsByClassName("ytp-play-button ytp-button")[0].getAttribute('aria-label')
            });
        } catch (err) {
            window.biscuit.socket.emit("state_update", {
                pathname: window.location.pathname
            });
        }
    }, 1000);
});

window.biscuit.socket.on("disconnect", function () {
    window.clearInterval(window.biscuit.interval);
});