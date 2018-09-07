const server = require("http").createServer();
const io = require("socket.io")(server);
const moment = require("moment");
const fetch = require("node-fetch")
const port = 13701;

const Cats = {
    Music: {
        icon: '🎵'
    },
    Other: {
        icon: '📺'
    }
}

var client = null

var remember_me_video = {}
var remember_me_state = {}
var remember_me_playback = {}
var discord_rp_conn_state = false

function richStateUpdate(setState) {
    if (setState) {
        if (!discord_rp_conn_state) {
            //NOTE: This is a hack to make discord rp reconnect. There might be a better way to do this
            client = require('discord-rich-presence')('479682964859519018');
            discord_rp_conn_state = true
        }
        client.updatePresence({
            details: 'Running Youcord',
            state: setState,
            largeImageKey: 'youtube'
        });
    } else {
        client.disconnect();
        discord_rp_conn_state = false
    }
}

function richPresenceUpdate(ytd, ps) {

    let left = [
        parseInt(ps.max_playback_time.split(":")[0]) - parseInt(ps.current_playback_time.split(":")[0]),
        parseInt(ps.max_playback_time.split(":")[1]) - parseInt(ps.current_playback_time.split(":")[1])
    ];

    let start = (ps.video_state == "Pause" && !ps.isLive) ? moment().unix() : null;
    let end = (ps.video_state == "Pause" && !ps.isLive) ? moment()
        .add(left[0], "m")
        .add(left[1], "s")
        .unix() : null;

    client.updatePresence({
        details: getCatIcon(ytd.category) + ' ' + ytd.title,
        state: '👤 ' + ytd.uploader,
        startTimestamp: start,
        endTimestamp: end,
        largeImageKey: (ps.hostname !== 'gaming.youtube.com') ? 'youtube' : 'youtube-gaming',
        smallImageKey: (ps.video_state == "Play") ? "pause" : undefined,
        smallImageText: (ps.video_state == "Play") ? "Video Paused" : undefined,
        largeImageText: ytd.views + ' 👀 | ' + ytd.likes + ' 👍 | ' + ytd.dislikes + ' 👎'

    });

    console.log(`RPUpdate: ${ytd.title} | ${ytd.uploader} | ${ytd.category} | ${(ps.video_state == "Pause") ? "Playing" : "Paused"} | ${ps.current_playback_time}`)
}

function getCatIcon(name) {
    if (name === 'Music') return Cats.Music.icon
    return Cats.Other.icon
}

io.on("connection", async function (socket) {
    console.log(socket.handshake.address.split(":")[3] + " connected to the server");
    richStateUpdate("Browsing Youtube");

    socket.on("path_update", async function (now) {
        if (now != remember_me_state) {

            remember_me_state = now
            var splitState = now.pathname.split('/');

            if (splitState[splitState.length - 2] == 'feed' || splitState[splitState.length - 2] == 'user') {
                return richStateUpdate('Browsing ' + splitState[splitState.length - 1]);
            } else {
                return richStateUpdate('Browsing YouTube');
            }
        }
    });

    socket.on("video_update", async function (now) {

        if (now.id !== remember_me_playback.id || now.video_state !== remember_me_playback.video_state || now.current_playback_time !== remember_me_playback.current_playback_time) {

            try {

                var rmv = remember_me_video

                if (now.id !== remember_me_playback.id) {
                    remember_me_playback = now
                    var ytr = { title: null, uploader: null, likes: null, dislikes: null, views: null, category: null }
                    fetch(`https://www.youtube.com/watch?pbj=1&v=${now.id}`, {
                        headers: {
                            'x-youtube-client-name': '1',
                            'x-youtube-client-version': '2.20180905'
                        }
                    })
                        .then(function (response) {
                            return response.json();
                        })
                        .then(function (jsd) {
                            ytr.title = jsd[2].player.args.title
                            ytr.uploader = jsd[2].player.args.author
                            ytr.likes = jsd[3].response.contents.twoColumnWatchNextResults.results.results.contents[0].videoPrimaryInfoRenderer.sentimentBar.sentimentBarRenderer.tooltip.split(' / ')[0]
                            ytr.dislikes = jsd[3].response.contents.twoColumnWatchNextResults.results.results.contents[0].videoPrimaryInfoRenderer.sentimentBar.sentimentBarRenderer.tooltip.split(' / ')[1]
                            ytr.views = jsd[3].response.contents.twoColumnWatchNextResults.results.results.contents[0].videoPrimaryInfoRenderer.viewCount.videoViewCountRenderer.viewCount.simpleText.split(' ')[0]
                            try {
                                ytr.category = jsd[3].response.contents.twoColumnWatchNextResults.results.results.contents[1].videoSecondaryInfoRenderer.metadataRowContainer.metadataRowContainerRenderer.rows[1].metadataRowRenderer.contents[0].runs[0].text
                            } catch (e) {
                                ytr.category = jsd[3].response.contents.twoColumnWatchNextResults.results.results.contents[1].videoSecondaryInfoRenderer.metadataRowContainer.metadataRowContainerRenderer.rows[0].metadataRowRenderer.contents[0].runs[0].text
                            }

                            remember_me_video = ytr;
                            return richPresenceUpdate(ytr, now)
                        });

                } else {
                    remember_me_playback = now;
                    return richPresenceUpdate(rmv, now)
                }
            } catch (err) { console.log(err); };
        }
    });

    socket.on("disconnect", function () {
        console.log(socket.handshake.address.split(":")[3] + " disconnected from the server");
        return richStateUpdate(null);
    });
});

server.listen(port, function () {
    console.log("WebSocket server started on port: " + port);
});