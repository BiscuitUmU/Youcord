const client = require('discord-rich-presence')('479682964859519018');
const server = require("http").createServer();
const io = require("socket.io")(server);
const moment = require("moment");
const port = 13701;

var remember_me_video = {}
var remember_me_state = {}

function richStateUpdate(setState) {
    client.updatePresence({
        details: 'Running Youcord',
        state: setState,
        largeImageKey: 'youtube'
    });
}

io.on("connection", async function (socket) {
    console.log(socket.handshake.address.split(":")[3] + " connected to the server");
    client.updatePresence({
        details: 'Running Youcord',
        state: 'Browsing Youtube',
        largeImageKey: 'youtube'
    });

    socket.on("state_update", async function (now) {
        if (now != remember_me_state) {
            
            remember_me_state = now
            var splitState = now.pathname.split('/');

            if (splitState[splitState.length - 2] == 'feed') {
                return richStateUpdate('Browsing ' + splitState[splitState.length - 1]);
            } else {
                return richStateUpdate('Browsing YouTube');
            }
        }
    });

    socket.on("video_update", async function (now) {

        if (now.title !== remember_me_video.title || now.video_state !== remember_me_video.video_state) {

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

                console.log("RPUpdate: " + now.title + ' | ' + now.uploader + " | " + (now.video_state == "Pause") ? "Playing" : "Paused");

                return client.updatePresence({
                    details: '📺 ' + now.title,
                    state: '👤 ' + now.uploader,
                    startTimestamp: start,
                    endTimestamp: end,
                    largeImageKey: 'youtube',
                    smallImageKey: (now.video_state == "Play") ? "pause" : undefined,
                    smallImageText: (now.video_state == "Play") ? "Idle" : undefined,
                    largeImageText: now.views.split(' ')[0] + ' 👀 | ' + now.likes + ' 👍 | ' + now.dislikes + ' 👎',
                    instance: false,
                });
            } catch (err) { console.log(err); };
        }
    });

    socket.on("disconnect", function () {
        console.log(socket.handshake.address.split(":")[3] + " disconnected from the server");
        return richStateUpdate('Not on YouTube');
    });
});

server.listen(port, function () {
    console.log("WebSocket server started on port: " + port);
    return richStateUpdate('Not on YouTube');
});