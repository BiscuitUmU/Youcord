const server = require("http").createServer();
const io = require("socket.io")(server);
const moment = require("moment");
const port = 13701;

var client = null

var remember_me_video = {}
var remember_me_state = {}
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

io.on("connection", async function (socket) {
    console.log(socket.handshake.address.split(":")[3] + " connected to the server");
    richStateUpdate("Browsing Youtube");

    socket.on("state_update", async function (now) {
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

        if (now.title !== remember_me_video.title || now.video_state !== remember_me_video.video_state || now.current_playback_time !== remember_me_video.current_playback_time) {

            remember_me_video = now;

            try {
                let left = [
                    parseInt(now.max_playback_time.split(":")[0]) - parseInt(now.current_playback_time.split(":")[0]),
                    parseInt(now.max_playback_time.split(":")[1]) - parseInt(now.current_playback_time.split(":")[1])
                ];

                let start = (now.video_state == "Pause") ? moment().unix() : null;
                let end = (now.video_state == "Pause") ? moment()
                    .add(left[0], "m")
                    .add(left[1], "s")
                    .unix() : null;

                console.log(`RPUpdate: ${now.title} | ${now.uploader} | ${(now.video_state == "Pause") ? "Playing" : "Paused"} | ${now.current_playback_time}`)

                return client.updatePresence({
                    details: '📺 ' + now.title,
                    state: '👤 ' + now.uploader,
                    startTimestamp: start,
                    endTimestamp: end,
                    largeImageKey: 'youtube',
                    smallImageKey: (now.video_state == "Play") ? "pause" : undefined,
                    smallImageText: (now.video_state == "Play") ? "Video Paused" : undefined,
                    largeImageText: now.views.split(' ')[0] + ' 👀 | ' + now.likes + ' 👍 | ' + now.dislikes + ' 👎'
                });
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