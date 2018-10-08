const moment = require("moment");
const youtubeHelper = require("./youtubeHelper")
var exports = module.exports = {};


exports.rpcClient = null
exports.rpcConnectionState = false

exports.currentVideoInfo = {}
exports.currentStateInfo = {}
exports.currentPlaybackInfo = {}

exports.richStateUpdate = function (setState, hostname) {
    if (setState) {
        if (!exports.rpcConnectionState) {
            //NOTE: This is a hack to make discord rp reconnect. There might be a better way to do this
            exports.rpcClient = require('discord-rich-presence')('479682964859519018');
            exports.rpcConnectionState = true
        }
        exports.rpcClient.updatePresence({
            details: 'Running Youcord',
            state: setState,
            largeImageKey: getLargeImage(exports.currentStateInfo.hostname)
        });
    } else {
        exports.rpcClient.disconnect();
        exports.rpcConnectionState = false
    }
}

exports.richPresenceUpdate = function (ytd, ps) {
    exports.currentPlaybackInfo = ps;
    exports.currentVideoInfo = ytd;

    let left = [
        parseInt(ps.max_playback_time.split(":")[0]) - parseInt(ps.current_playback_time.split(":")[0]),
        parseInt(ps.max_playback_time.split(":")[1]) - parseInt(ps.current_playback_time.split(":")[1])
    ];

    let start = (ps.video_state == "Pause" && !ps.isLive) ? moment().unix() : null;
    let end = (ps.video_state == "Pause" && !ps.isLive) ? moment()
        .add(left[0], "m")
        .add(left[1], "s")
        .unix() : null;

    var sinfo = getSmallInfo(ps.video_state, ps.isLive)

    exports.rpcClient.updatePresence({
        details: youtubeHelper.getCategoryIcon(ytd.category) + ' ' + ytd.title,
        state: '👤 ' + ytd.uploader,
        startTimestamp: start,
        endTimestamp: end,
        largeImageKey: getLargeImage(ps.hostname),
        smallImageKey: sinfo.image,
        smallImageText: sinfo.text,
        largeImageText: ytd.views + ' 👀 | ' + ytd.likes + ' 👍 | ' + ytd.dislikes + ' 👎'
    });

    console.log(`RPUpdate: ${ytd.title} | ${ytd.uploader} | ${ytd.category} | ${(ps.video_state == "Pause") ? "Playing" : "Paused"} | ${ps.current_playback_time}`);
}

exports.shouldUpdateState = function (now) {
    if (!youtubeHelper.isGettingVideoInfo) {
        return (now.id !== exports.currentPlaybackInfo.id || now.video_state !== exports.currentPlaybackInfo.video_state || now.current_playback_time !== exports.currentPlaybackInfo.current_playback_time);
    } else {
        return false;
    }
}

function getLargeImage(hName) {
    return (hName !== 'gaming.youtube.com') ? 'youtube' : 'youtube-gaming';
}

function getSmallInfo(state, isLive) {
    var info = {
        image: undefined,
        text: undefined
    }
    if (isLive) {
        info.image = 'live'
        info.text = 'Watching Live Video'
    }
    if (state == 'Play') {
        info.image = 'pause'
        info.text = 'Video Paused'
    }

    return info;
}
