const server = require("http").createServer();
const io = require("socket.io")(server);

const discordHelper = require("./utils/discordHelper");
const youtubeHelper = require("./utils/youtubeHelper");

const port = 13701;

io.on("connection", async function (socket) {
    console.log(socket.handshake.address.split(":")[3] + " connected to the server");
    discordHelper.richStateUpdate("Browsing YouTube");

    socket.on("path_update", async function (now) {
        if (now != discordHelper.currentStateInfo) {
            discordHelper.currentStateInfo = now
            var splitState = now.pathname.split('/');

            if (splitState[splitState.length - 2] == 'feed' || splitState[splitState.length - 2] == 'user') {
                return discordHelper.richStateUpdate('Browsing ' + splitState[splitState.length - 1]);
            } else {
                return discordHelper.richStateUpdate('Browsing YouTube');
            }
        }
    });

    socket.on("video_update", async function (now) {

        if (discordHelper.shouldUpdateState(now)) {
            try {
                if (now.id !== discordHelper.currentPlaybackInfo.id) {
                    await youtubeHelper.getVideoInfo(now.id)
                        .then(res => discordHelper.richPresenceUpdate(res, now));
                } else {
                    discordHelper.richPresenceUpdate(discordHelper.currentVideoInfo, now)
                }
            } catch (err) { console.log(err); };
        }
    });

    socket.on("disconnect", function () {
        console.log(socket.handshake.address.split(":")[3] + " disconnected from the server");
        return discordHelper.richStateUpdate(null);
    });
});

server.listen(port, function () {
    console.log("WebSocket server started on port: " + port);
});
